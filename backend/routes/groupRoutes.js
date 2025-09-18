// backend/routes/groupRoutes.js
const express = require("express");
const slugify = require("slugify");
const Group = require("../models/Group");
const GroupPost = require("../models/GroupPost");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload"); // optional group image upload
const router = express.Router();

/**
 * Helper: check if user is owner or admin
 */
function isAdminOrOwner(group, userId) {
  const uid = String(userId);
  if (!group) return false;
  if (String(group.owner) === uid) return true;
  if (Array.isArray(group.admins) && group.admins.some((a) => String(a) === uid)) return true;
  return false;
}

/**
 * POST /api/groups
 * Create a group (owner). Accept optional image via multipart: field name "image"
 */
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const name = (req.body && req.body.name) ? String(req.body.name).trim() : "";
    if (!name) return res.status(400).json({ success: false, message: "Group name required" });

    // create slug and ensure uniqueness
    let baseSlug = slugify(name, { lower: true, strict: true }).slice(0, 50) || `g-${Date.now()}`;
    let slug = baseSlug;
    let i = 0;
    while (await Group.findOne({ slug })) { // tiny loop to avoid collisions
      i++;
      slug = `${baseSlug}-${i}`;
    }

    const visibility = req.body.visibility === "private" ? "private" : "public";
    const description = (req.body.description || "").toString().slice(0, 2000);
    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const group = await Group.create({
      name,
      slug,
      description,
      image,
      visibility,
      owner: req.user._id,
      admins: [],
      members: [req.user._id],
    });

    return res.status(201).json({ success: true, message: "Group created", group });
  } catch (err) {
    console.error("Create group error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * GET /api/groups
 * List groups (public only by default). Query ?q=search & ?visibility=all|public|private
 */
router.get("/", async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const visibility = (req.query.visibility || "public").toString();
    const filter = {};
    if (visibility === "public") filter.visibility = "public";
    if (visibility === "private") filter.visibility = "private";
    // text search on name/description
    if (q) {
      filter.$or = [
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { description: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const groups = await Group.find(filter).select("name slug description image visibility owner members").sort({ createdAt: -1 }).limit(100);
    return res.json({ success: true, groups });
  } catch (err) {
    console.error("List groups error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * GET /api/groups/:slug
 * Get single group by slug (or id if slug looks like id)
 */
router.get("/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    const group = await Group.findOne({ $or: [{ slug }, { _id: slug }] })
      .populate("owner", "name email avatar")
      .populate("admins", "name email avatar")
      .populate("members", "name email avatar");
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });
    return res.json({ success: true, group });
  } catch (err) {
    console.error("Get group error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/groups/:id/join
 * Join a public group immediately; for private groups, add join request
 */
router.post("/:id/join", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const uid = String(req.user._id);
    if (group.members.some((m) => String(m) === uid)) return res.status(400).json({ success: false, message: "Already a member" });

    if (group.visibility === "public") {
      group.members.push(req.user._id);
      await group.save();

      // notify owner/admins about new member (best-effort)
      try {
        await Notification.create({
          user: group.owner,
          actor: req.user._id,
          type: "system",
          data: { action: "joined_group", group: group._id },
        });
      } catch (nerr) { console.warn("Notify owner failed:", nerr?.message || nerr); }

      return res.json({ success: true, message: "Joined group", groupId: group._id });
    } else {
      // private -> create a join request object (avoid duplicates)
      const alreadyRequested = group.joinRequests.some((r) => String(r.user) === uid);
      if (alreadyRequested) return res.status(400).json({ success: false, message: "Join request already pending" });

      group.joinRequests.push({ user: req.user._id, message: (req.body.message || "").slice(0, 500) });
      await group.save();

      // notify owner/admins of join request
      try {
        const recipients = [group.owner, ...group.admins].filter(Boolean);
        await Notification.create({
          user: group.owner,
          actor: req.user._id,
          type: "system",
          data: { action: "join_request", group: group._id, message: req.body.message || "" },
        });
        // optionally create notifications for admins too (loop)
        for (const a of group.admins) {
          await Notification.create({
            user: a,
            actor: req.user._id,
            type: "system",
            data: { action: "join_request", group: group._id },
          }).catch(() => {});
        }
      } catch (nerr) { console.warn("Notify admins failed:", nerr?.message || nerr); }

      return res.json({ success: true, message: "Join request submitted" });
    }
  } catch (err) {
    console.error("Join group error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/groups/:id/approve/:requestUserId
 * Approve a join request (owner or admin)
 */
router.post("/:id/approve/:requestUserId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (!isAdminOrOwner(group, req.user._id)) return res.status(403).json({ success: false, message: "Not authorized" });

    const reqUserId = req.params.requestUserId;
    const reqIndex = group.joinRequests.findIndex((r) => String(r.user) === String(reqUserId));
    if (reqIndex === -1) return res.status(404).json({ success: false, message: "Join request not found" });

    // add to members, remove request
    group.members.push(reqUserId);
    group.joinRequests.splice(reqIndex, 1);
    await group.save();

    // Notify the user
    try {
      await Notification.create({ user: reqUserId, actor: req.user._id, type: "system", data: { action: "join_approved", group: group._id } });
    } catch (nerr) { console.warn("Notify approved failed:", nerr?.message || nerr); }

    return res.json({ success: true, message: "Join request approved" });
  } catch (err) {
    console.error("Approve request error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/groups/:id/deny/:requestUserId
 * Deny a join request (owner/admin)
 */
router.post("/:id/deny/:requestUserId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (!isAdminOrOwner(group, req.user._id)) return res.status(403).json({ success: false, message: "Not authorized" });

    const reqUserId = req.params.requestUserId;
    const reqIndex = group.joinRequests.findIndex((r) => String(r.user) === String(reqUserId));
    if (reqIndex === -1) return res.status(404).json({ success: false, message: "Join request not found" });

    group.joinRequests.splice(reqIndex, 1);
    await group.save();

    // optional notify denied
    try {
      await Notification.create({ user: reqUserId, actor: req.user._id, type: "system", data: { action: "join_denied", group: group._id } });
    } catch (nerr) {}

    return res.json({ success: true, message: "Join request denied" });
  } catch (err) {
    console.error("Deny request error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/groups/:id/leave
 * Leave a group (member)
 */
router.post("/:id/leave", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const uid = String(req.user._id);
    if (!group.members.some((m) => String(m) === uid)) return res.status(400).json({ success: false, message: "Not a member" });

    // owner cannot leave — they must delete or transfer ownership
    if (String(group.owner) === uid) return res.status(400).json({ success: false, message: "Owner cannot leave the group" });

    group.members = group.members.filter((m) => String(m) !== uid);
    group.admins = group.admins.filter((a) => String(a) !== uid);
    await group.save();

    return res.json({ success: true, message: "Left group" });
  } catch (err) {
    console.error("Leave group error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/groups/:id/promote/:userId
 * Promote a member to admin (owner only)
 */
router.post("/:id/promote/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (String(group.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Only owner can promote" });

    const uid = req.params.userId;
    if (!group.members.some((m) => String(m) === String(uid))) return res.status(400).json({ success: false, message: "User is not a member" });

    if (!group.admins.some((a) => String(a) === String(uid))) group.admins.push(uid);
    await group.save();

    return res.json({ success: true, message: "Promoted to admin" });
  } catch (err) {
    console.error("Promote error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/groups/:id/demote/:userId
 * Demote admin to member (owner only)
 */
router.post("/:id/demote/:userId", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (String(group.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Only owner can demote" });

    const uid = req.params.userId;
    group.admins = group.admins.filter((a) => String(a) !== String(uid));
    await group.save();

    return res.json({ success: true, message: "Demoted admin" });
  } catch (err) {
    console.error("Demote error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * DELETE /api/groups/:id
 * Delete group (owner only) - also removes related group posts and notifications
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    if (String(group.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Only owner can delete" });

    // remove group posts
    await GroupPost.deleteMany({ group: group._id }).catch(() => {});
    // remove notifications referencing this group (best-effort)
    await Notification.deleteMany({ "data.group": group._id }).catch(() => {});

    await group.deleteOne();
    return res.json({ success: true, message: "Group deleted" });
  } catch (err) {
    console.error("Delete group error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/groups/:id/posts
 * Create a post inside a group (member only). optional multipart with image field "image"
 */
router.post("/:id/posts", auth, upload.single("image"), async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    const uid = String(req.user._id);
    if (!group.members.some((m) => String(m) === uid)) return res.status(403).json({ success: false, message: "Must be a member to post" });

    const content = (req.body && req.body.content) ? String(req.body.content).trim() : "";
    if (!content) return res.status(400).json({ success: false, message: "Content required" });

    const image = req.file ? `/uploads/${req.file.filename}` : "";

    const gp = await GroupPost.create({ group: group._id, user: req.user._id, content, image });
    return res.status(201).json({ success: true, message: "Group post created", post: gp });
  } catch (err) {
    console.error("Create group post error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * GET /api/groups/:id/posts
 * Get posts for a group (members can see private groups; public groups visible to all)
 */
router.get("/:id/posts", auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: "Group not found" });

    // if private and requester is not a member -> 403
    if (group.visibility === "private" && !group.members.some((m) => String(m) === String(req.user._id))) {
      return res.status(403).json({ success: false, message: "Not authorized to view posts" });
    }

    const posts = await GroupPost.find({ group: group._id })
      .sort({ createdAt: -1 })
      .populate("user", "name email avatar")
      .limit(200);

    return res.json({ success: true, posts });
  } catch (err) {
    console.error("Get group posts error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
