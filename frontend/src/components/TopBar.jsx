import React from "react";
import { useAuth } from "../auth/AuthContext";

export default function TopBar({ onOpen }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-faGreen-500 to-faGreen-700 text-white flex items-center justify-center font-bold">FA</div>
        <div>
          <div className="text-lg font-semibold">FarmerAI</div>
          <div className="text-xs text-gray-500">Helping farmers with AI</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="px-3 py-1 rounded-md bg-gray-100 text-sm">Explore</button>
        <button onClick={onOpen} className="px-3 py-1 rounded-md bg-faGreen-500 text-white text-sm">Chatbot</button>
        {user ? <button onClick={logout} className="text-sm text-gray-500">Logout</button> : null}
      </div>
    </div>
  );
}
