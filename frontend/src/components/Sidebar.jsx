// src/components/Sidebar.jsx
import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import MenuItemMotion from "./MenuItemMotion";

export default function Sidebar({ onQuickAction, onNewChat, onClose }) {
  const { user, signOut } = useAuth();
  const [showQuick, setShowQuick] = useState(false);

  const quickActions = [
    "🌾 Diagnose crop",
    "💧 Irrigation tips",
    "🐛 Pest control advice",
    "📊 Market price",
    "🌱 Best crop for this season",
  ];

  const history = [
    "Tomato disease check",
    "Wheat irrigation advice",
    "Paddy pest issue",
  ];

  return (
    <aside className="w-64 h-screen flex flex-col bg-white/90 backdrop-blur-xl shadow-lg border-r border-faGray-200">
      {/* Mobile close button (drawer mode) */}
      <div className="lg:hidden p-3 border-b flex items-center justify-between">
        <h2 className="text-lg font-semibold text-faGreen-700">Menu</h2>
        <button
          onClick={onClose}
          className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
        >
          ✕
        </button>
      </div>

      {/* New Chat button (top) */}
      <div className="p-4 border-b">
        <button
          onClick={onNewChat}
          className="w-full px-3 py-2 rounded-md bg-faGreen-600 text-white hover:bg-faGreen-700 font-semibold transition"
        >
          ➕ New Chat
        </button>
      </div>

      {/* Quick Actions tab header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-faGreen-700">Quick Actions</h3>
          <button
            onClick={() => setShowQuick((s) => !s)}
            className="text-sm text-faGray-700 px-2 py-1 rounded hover:bg-faGray-100 transition"
            aria-expanded={showQuick}
          >
            {showQuick ? "Hide" : "Show"}
          </button>
        </div>

        {/* Quick action list (toggleable) */}
        {showQuick && (
          <ul className="mt-3 space-y-2">
            {quickActions.map((q, i) => (
              <li key={i}>
                <MenuItemMotion
                  icon={null}
                  label={q}
                  onClick={() => onQuickAction(q)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* History */}
      <div className="p-4 flex-1 overflow-y-auto border-b">
        <h2 className="text-lg font-semibold text-faGreen-700 mb-3">History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500">No history yet</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {history.map((item, i) => (
              <li key={i}>
                <MenuItemMotion
                  icon={null}
                  label={item}
                  onClick={() => {
                    /* If you want clicking history to re-open that conversation, hook here */
                    // you can call a prop, or add logic to load the conversation
                    console.log("open history item:", item);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Account info & actions */}
      <div className="p-4 space-y-3 text-sm">
        {user ? (
          <>
            <div>
              <div className="font-semibold text-gray-800">{user.name}</div>
              <div className="text-gray-500">{user.email}</div>
              <div className="mt-1 text-xs text-faGreen-700">
                Role: {user.role}
                {user.role === "farmer" && user.farmerType
                  ? ` (${user.farmerType})`
                  : ""}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  localStorage.removeItem("fa_user");
                  signOut();
                }}
                className="w-full px-3 py-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 transition"
              >
                Logout
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("fa_user");
                  window.location.reload();
                }}
                className="w-full px-3 py-2 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
              >
                Switch Account
              </button>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Not signed in</p>
        )}
      </div>
    </aside>
  );
}
