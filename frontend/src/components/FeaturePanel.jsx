import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../auth/AuthContext";

/*
FeaturePanel:
- feature: null | 'chat' | 'image' | 'live' | 'rag' | 'social'
- open: boolean
*/

function Content({ feature, onClose }) {
  const { user } = useAuth();

  if (!feature) return null;
  if (feature === "chat") {
    if (!user) {
      return <div className="p-4">Please sign up / login to use chat.</div>;
    }
    return <div className="p-4">Chat UI (placeholder) — user: {user.name}</div>;
  }
  if (feature === "image") return <div className="p-4">Image detection — upload an image below.<input className="mt-2" type="file" accept="image/*" /></div>;
  if (feature === "live") return <div className="p-4">Live detection — camera preview (placeholder)</div>;
  if (feature === "rag") return <div className="p-4">RAG Summarizer — paste text or upload doc</div>;
  if (feature === "social") return <div className="p-4">Social panel — posts and interactions</div>;
  return <div className="p-4">Feature: {feature}</div>;
}

export default function FeaturePanel({ open, feature, onClose = () => {} }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-30"
          />
          <motion.div
            key="panel"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed left-0 right-0 bottom-0 z-40 bg-white rounded-t-2xl shadow-xl max-h-[85vh] overflow-auto"
          >
            <div className="p-3 border-b flex items-center justify-between">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
              <button onClick={onClose} className="text-sm text-gray-500">Close</button>
            </div>

            <div className="p-4">
              <Content feature={feature} onClose={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
