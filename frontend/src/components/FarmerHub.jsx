import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

/*
 FarmerHub.jsx - Single-file implementation of a client-side "social feed"
 - Posts persist in localStorage at key "farmerhub_posts"
 - Each post: { id, userName, role, text, img (dataURL|null), likes:[], comments: [{id,name,text,ts}], tags:[], createdAt }
 - Features: create post, image preview, like/unlike, comments, delete (if owner), copy share link, search, tag filter
*/

/* ---------- Utilities ---------- */
const STORAGE_KEY = "farmerhub_posts";
const me = (name = "You") => ({ name }); // stubbed auth

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

function readPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
function writePosts(posts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

/* Seed sample posts once */
function seedIfEmpty() {
  const existing = readPosts();
  if (existing && existing.length) return;
  const now = Date.now();
  const sample = [
    {
      id: uid("p_"),
      userName: "Ravi",
      role: "farmer (small)",
      text: "My tomato leaves have yellow spots — anyone seen this before? Attached a photo.",
      img: null,
      likes: [],
      comments: [
        {
          id: uid("c_"),
          name: "AgriPro",
          text: "Looks like early blight. Try removing affected leaves and apply approved fungicide.",
          ts: now - 3600_000,
        },
      ],
      tags: ["Pest"],
      createdAt: now - 3600_000 * 5,
    },
    {
      id: uid("p_"),
      userName: "Anita",
      role: "AgriPro",
      text: "Local market price for onions increased 8% this week. Consider timing your harvest if storage isn't available.",
      img: null,
      likes: [],
      comments: [],
      tags: ["Market"],
      createdAt: now - 3600_000 * 24,
    },
  ];
  writePosts(sample);
}

/* ---------- Composer (create new post) ---------- */
function Composer({ onCreate }) {
  const [text, setText] = useState("");
  const [filePreview, setFilePreview] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      setFilePreview(reader.result);
    };
    if (f.type.startsWith("image/")) reader.readAsDataURL(f);
    else alert("Only images are supported for post preview.");
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (!tags.includes(t)) setTags((s) => [...s, t]);
    setTagInput("");
  }
  function removeTag(t) {
    setTags((s) => s.filter((x) => x !== t));
  }

  function submit() {
    if (!text.trim() && !filePreview) return alert("Write something or attach an image.");
    const currentUser =
      JSON.parse(localStorage.getItem("fa_user")) || { name: "Anonymous" };
    const post = {
      id: uid("p_"),
      userName: currentUser.name || "Anonymous",
      role: currentUser.role
        ? `${currentUser.role}${
            currentUser.farmerType ? ` (${currentUser.farmerType})` : ""
          }`
        : "Member",
      text: text.trim(),
      img: filePreview,
      likes: [],
      comments: [],
      tags,
      createdAt: Date.now(),
    };
    onCreate(post);
    setText("");
    setFilePreview(null);
    setTags([]);
    setTagInput("");
  }

  return (
    <div className="glass-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-faGreen-50 flex items-center justify-center text-faGreen-700 font-semibold">
          {((JSON.parse(localStorage.getItem("fa_user")) || {}).name || "U")[0]}
        </div>
        <div className="flex-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Share an update, ask the community, or attach a photo..."
            className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-faGreen-500 resize-none"
          />
          {filePreview && (
            <div className="mt-2">
              <img
                src={filePreview}
                alt="preview"
                className="max-h-48 rounded-md object-cover w-full"
              />
            </div>
          )}

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer text-sm px-2 py-1 rounded-md hover:bg-faGray-50">
                <input
                  type="file"
                  onChange={handleFile}
                  accept="image/*"
                  className="hidden"
                />
                📷 Add image
              </label>

              <div className="flex items-center gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag e.g. Pest"
                  className="border px-2 py-1 rounded"
                />
                <button
                  onClick={addTag}
                  className="px-2 py-1 bg-faGreen-500 text-white rounded"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={submit}
                className="px-4 py-2 bg-faGreen-600 text-white rounded-lg shadow"
              >
                Post
              </button>
            </div>
          </div>

          {tags.length > 0 && (
            <div className="mt-2 flex gap-2 flex-wrap">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 bg-faGray-50 text-sm rounded-full flex items-center gap-2"
                >
                  #{t}
                  <button
                    onClick={() => removeTag(t)}
                    className="text-xs text-gray-400"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Comments Panel ---------- */
function CommentsPanel({ post, onAddComment }) {
  const [text, setText] = useState("");
  function submit() {
    if (!text.trim()) return;
    const currentUser =
      JSON.parse(localStorage.getItem("fa_user")) || { name: "Visitor" };
    onAddComment({
      id: uid("c_"),
      name: currentUser.name || "Visitor",
      text: text.trim(),
      ts: Date.now(),
    });
    setText("");
  }

  return (
    <div className="p-4">
      <h4 className="font-semibold text-faGreen-700 mb-2">Comments</h4>
      <div className="space-y-3 max-h-48 overflow-y-auto mb-3">
        {post.comments.length === 0 && (
          <div className="text-sm text-gray-500">
            No comments yet — be the first.
          </div>
        )}
        {post.comments.map((c) => (
          <div key={c.id} className="p-2 rounded bg-faGray-50">
            <div className="text-sm font-semibold">{c.name}</div>
            <div className="text-sm text-gray-700">{c.text}</div>
            <div className="text-xs text-gray-400 mt-1">
              {new Date(c.ts).toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 border rounded px-3 py-2"
        />
        <button
          onClick={submit}
          className="px-3 py-2 bg-faGreen-500 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}

/* ---------- PostCard ---------- */
function PostCard({ post, onLike, onDelete, onAddComment, onShare }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <motion.div layout className="relative perspective-1000" style={{ perspective: 1200 }}>
      <motion.div className="w-full" style={{ transformStyle: "preserve-3d" }}>
        {/* Front */}
        <motion.div
          onClick={() => setFlipped(true)}
          initial={{ rotateY: 0 }}
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-4 cursor-pointer will-change-transform"
          style={{ backfaceVisibility: "hidden" }}
        >
          <header className="flex items-start justify-between">
            <div>
              <div className="font-semibold text-gray-800">{post.userName}</div>
              <div className="text-xs text-gray-500">
                {post.role} • {new Date(post.createdAt).toLocaleString()}
              </div>
            </div>
            <div className="text-xs text-gray-400">
              {post.tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-1 bg-faGray-50 rounded text-xs ml-1"
                >
                  #{t}
                </span>
              ))}
            </div>
          </header>

          <p className="mt-3 text-gray-700 whitespace-pre-wrap">{post.text}</p>

          {post.img && (
            <img
              src={post.img}
              alt="post"
              className="mt-3 rounded-md max-h-64 object-cover w-full"
            />
          )}

          <footer className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLike(post.id);
                }}
                className={`px-2 py-1 rounded ${
                  post.likes.includes("me")
                    ? "bg-faGreen-500 text-white"
                    : "bg-faGray-50"
                }`}
              >
                👍 {post.likes.length}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFlipped(true);
                }}
                className="px-2 py-1 rounded bg-faGray-50"
              >
                💬 {post.comments.length}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(post.id);
                }}
                className="px-2 py-1 rounded bg-faGray-50"
              >
                🔗 Share
              </button>
            </div>

            <div>
              {(
                JSON.parse(localStorage.getItem("fa_user")) || {}
              ).name === post.userName && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm("Delete post?")) onDelete(post.id);
                  }}
                  className="text-xs text-red-500"
                >
                  Delete
                </button>
              )}
            </div>
          </footer>
        </motion.div>

        {/* Back */}
        <motion.div
          initial={{ rotateY: -180 }}
          animate={{ rotateY: flipped ? 0 : -180 }}
          transition={{ duration: 0.6 }}
          className="glass-card p-4 absolute inset-0"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-semibold">{post.userName}</div>
              <div className="text-xs text-gray-500">{post.role}</div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlipped(false)}
                className="px-3 py-1 rounded bg-faGray-50"
              >
                Back
              </button>
            </div>
          </div>

          <div className="mb-3">
            <p className="text-gray-700 whitespace-pre-wrap">{post.text}</p>
            {post.img && (
              <img
                src={post.img}
                alt="post"
                className="mt-3 rounded-md max-h-64 object-cover w-full"
              />
            )}
          </div>

          <CommentsPanel
            post={post}
            onAddComment={(c) => onAddComment(post.id, c)}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Main FarmerHub Component ---------- */
export default function FarmerHub({ onClose }) {
  seedIfEmpty();

  const [posts, setPosts] = useState(() => readPosts() || []);
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState(null);
  const [sort, setSort] = useState("latest");

  useEffect(() => {
    writePosts(posts);
  }, [posts]);

  function handleCreate(post) {
    setPosts((p) => [post, ...p]);
  }
  function handleLike(id) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              likes: p.likes.includes("me")
                ? p.likes.filter((x) => x !== "me")
                : [...p.likes, "me"],
            }
          : p
      )
    );
  }
  function handleDelete(id) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  }
  function handleAddComment(postId, comment) {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  }
  function handleShare(id) {
    const url = new URL(window.location.href);
    url.hash = `farmerhub-post-${id}`;
    navigator.clipboard
      ?.writeText(url.toString())
      .then(() => {
        alert("Link copied to clipboard. Share it with others!");
      })
      .catch(() =>
        alert("Could not copy link, please copy manually: " + url.toString())
      );
  }

  const tags = Array.from(new Set(posts.flatMap((p) => p.tags || [])));
  let filtered = posts.filter((p) =>
    p.text.toLowerCase().includes(query.toLowerCase())
  );
  if (activeTag)
    filtered = filtered.filter((p) => (p.tags || []).includes(activeTag));
  if (sort === "popular")
    filtered = filtered
      .slice()
      .sort(
        (a, b) =>
          b.likes.length + b.comments.length - (a.likes.length + a.comments.length)
      );
  else filtered = filtered.slice().sort((a, b) => b.createdAt - a.createdAt);

  return (
    <div
      className="fixed inset-0 z-60 bg-[rgba(0,0,0,0.35)] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full h-full bg-white overflow-hidden shadow-2xl grid grid-cols-12">
        {/* Left column */}
        <div className="col-span-8 p-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-faGreen-800">👥 FarmerHub</h2>
              <p className="text-sm text-gray-500">
                Community feed — share updates, ask questions, and help fellow
                farmers.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search posts..."
                className="border rounded px-3 py-2"
              />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="border rounded px-2 py-2"
              >
                <option value="latest">Latest</option>
                <option value="popular">Popular</option>
              </select>
              <button
                onClick={onClose}
                className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200"
              >
                ✕ Close
              </button>
            </div>
          </div>

          <Composer onCreate={handleCreate} />

          <div className="flex-1 overflow-y-auto space-y-4 py-2">
            {filtered.length === 0 ? (
              <div className="text-center text-gray-500 mt-12">
                No posts found — be the first to post.
              </div>
            ) : (
              filtered.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  onLike={handleLike}
                  onDelete={handleDelete}
                  onAddComment={handleAddComment}
                  onShare={handleShare}
                />
              ))
            )}
          </div>
        </div>

        {/* Right column */}
        <aside className="col-span-4 border-l p-6 overflow-y-auto">
          <div className="mb-4">
            <h4 className="font-semibold text-faGreen-700">Tags</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTag(null)}
                className={`px-3 py-1 rounded ${
                  !activeTag ? "bg-faGreen-600 text-white" : "bg-faGray-50"
                }`}
              >
                All
              </button>
              {tags.map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTag(t)}
                  className={`px-3 py-1 rounded ${
                    activeTag === t
                      ? "bg-faGreen-600 text-white"
                      : "bg-faGray-50"
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-faGreen-700">Trending</h4>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              {posts.slice(0, 5).map((p) => (
                <li key={p.id} className="p-2 bg-faGray-50 rounded">
                  {p.userName}: {String(p.text).slice(0, 60)}...
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4">
            <h4 className="font-semibold text-faGreen-700">About FarmerHub</h4>
            <p className="text-sm text-gray-600 mt-2">
              A community space to share problems and solutions. Keep posts
              respectful and practical.
            </p>
          </div>

          <div className="mt-auto">
            <div className="text-xs text-gray-400">Tips</div>
            <ul className="mt-2 text-sm text-gray-600 space-y-2">
              <li>✅ Use clear photos of leaves/fruit</li>
              <li>✅ Add tags to help others find posts</li>
              <li>✅ Respect privacy — no personal contact info</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
