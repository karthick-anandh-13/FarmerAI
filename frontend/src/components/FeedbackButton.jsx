import React, { useState } from "react";
import { motion } from "framer-motion";

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState("");

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 bg-faGreen-500 hover:bg-faGreen-700 text-white px-4 py-2 rounded-full shadow-lg"
      >
        💬 Feedback
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-2xl p-4 border"
        >
          <h2 className="text-lg font-semibold text-faGreen-700 mb-2">Feedback</h2>
          <textarea
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="w-full border rounded-md p-2 text-sm"
            placeholder="Tell us what you think..."
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1 rounded-md bg-gray-100 hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                alert("✅ Feedback submitted: " + feedback);
                setFeedback("");
                setOpen(false);
              }}
              className="px-3 py-1 rounded-md bg-faGreen-500 text-white hover:bg-faGreen-700"
            >
              Submit
            </button>
          </div>
        </motion.div>
      )}
    </>
  );
}
