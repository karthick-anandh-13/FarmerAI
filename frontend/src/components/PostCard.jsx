import React from "react";

export default function PostCard({ onFeature = () => {} }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200" />
          <div>
            <div className="text-sm font-semibold">Username</div>
            <div className="text-xs text-gray-400">@farm_user</div>
          </div>
        </div>
        <button className="text-sm text-faGreen-600">+ Follow</button>
      </div>

      <div className="mt-4 border rounded-lg overflow-hidden h-56 flex items-center justify-center bg-gray-50">Image or Video</div>

      <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
        <div className="flex gap-6">
          <button onClick={() => onFeature("like")}>Like</button>
          <button onClick={() => onFeature("comment")}>Comment</button>
          <button onClick={() => onFeature("repost")}>Repost</button>
          <button onClick={() => onFeature("send")}>Send</button>
        </div>
        <div className="text-xs">(Comment box below)</div>
      </div>

      <div className="mt-2">
        <input className="w-full border rounded-md px-3 py-2" placeholder="Write a comment..." />
      </div>
    </div>
  );
}
