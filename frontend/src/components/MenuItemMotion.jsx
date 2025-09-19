// src/components/MenuItemMotion.jsx
import React from "react";
import { motion } from "framer-motion";

/**
 * MenuItemMotion
 * Props:
 * - icon: JSX or string (optional)
 * - label: text
 * - onClick: function
 * - className: extra classes for outer button
 */
export default function MenuItemMotion({ icon, label, onClick, className = "" }) {
  return (
    <motion.button
      onClick={onClick}
      className={`relative group flex items-center gap-3 px-3 py-2 w-full text-left bg-transparent rounded-md focus:outline-none ${className}`}
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      aria-label={label}
      type="button"
    >
      {/* outline/background box */}
      <motion.span
        className="absolute -inset-1 rounded-lg pointer-events-none"
        initial={{ opacity: 0, scale: 0.98 }}
        whileHover={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        style={{
          boxShadow: "0 18px 40px rgba(16,185,129,0.06)",
          border: "2px solid rgba(34,197,94,0.10)",
          background: "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(255,255,255,0.75))",
          zIndex: 0,
        }}
      />

      {/* content on top of outline */}
      <span className="z-10 text-lg leading-none">{icon}</span>
      <span className="z-10 text-sm text-gray-700 group-hover:text-faGreen-600 truncate">
        {label}
      </span>
    </motion.button>
  );
}
