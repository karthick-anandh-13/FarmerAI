// src/components/Chatbot.jsx
import React, { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

export default function Chatbot({ messages, setMessages, uploadedFile }) {
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  // auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  async function sendMessage(text = input) {
    if (!text.trim()) return;

    // add user message
    setMessages((prev) => [...prev, { from: "user", text }]);
    setInput("");
    setTyping(true);

    try {
      // if file uploaded → simulate local answer
      if (uploadedFile && uploadedFile.content) {
        const excerpt = String(uploadedFile.content).slice(0, 250);
        setTimeout(() => {
          setTyping(false);
          setMessages((prev) => [
            ...prev,
            {
              from: "bot",
              text: `🤖 I checked the uploaded file "${uploadedFile.name}". Here's an excerpt:\n\n${excerpt}\n\nYou asked: "${text}" — (simulated).`,
            },
          ]);
        }, 1100);
      } else {
        // ✅ ask backend Q&A API
        const res = await fetch("http://localhost:5000/api/qa/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: text }),
        });

        const data = await res.json();
        setTyping(false);

        let reply =
          data?.answer ||
          "❌ Sorry, I don’t have an answer for that yet. Try another question.";

        setMessages((prev) => [...prev, { from: "bot", text: reply }]);
      }
    } catch (err) {
      console.error("Chatbot error:", err);
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ Server error. Please try again later." },
      ]);
    }
  }

  return (
    <div className="w-full max-w-2xl h-[75vh] flex flex-col rounded-3xl shadow-2xl glass-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center">
        <h2 className="text-lg font-semibold text-faGreen-700">🌿 FarmerAI Assistant</h2>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm ${
              msg.from === "user" ? "ml-auto bubble-user" : "bg-gray-100 bubble-bot"
            }`}
          >
            <pre className="whitespace-pre-wrap">{msg.text}</pre>
          </motion.div>
        ))}

        {typing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-[35%] px-4 py-3 rounded-2xl shadow-sm bg-gray-100"
          >
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white/70 backdrop-blur-lg rounded-b-3xl">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-faGreen-500"
            placeholder="Ask me about your crops or uploaded file..."
          />
          <button
            onClick={() => sendMessage()}
            className="bg-faGreen-500 text-white px-4 py-2 rounded-full"
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}
