import React from "react";

export default function BottomNav({ onChange }) {
  return (
    <div className="fixed bottom-4 left-0 right-0 flex justify-center">
      <div className="bg-white rounded-full shadow-lg px-6 py-3 flex gap-6 items-center">
        <button onClick={() => onChange("chatbot")} className="hover:text-faGreen-700">💬</button>
        <button onClick={() => onChange("image")} className="hover:text-faGreen-700">📷</button>
        <button onClick={() => onChange("rag")} className="hover:text-faGreen-700">🪄</button>
        <button onClick={() => onChange("live")} className="hover:text-faGreen-700">🎥</button>
        <button onClick={() => onChange("farmerhub")} className="hover:text-faGreen-700">👥</button>
      </div>
    </div>
  );
}
