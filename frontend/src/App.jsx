import React, { useState } from "react";
import { AnimatePresence } from "framer-motion";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import Chatbot from "./components/Chatbot";
import RightPanel from "./components/RightPanel";
import FeedbackButton from "./components/FeedbackButton";
import FarmerHub from "./components/FarmerHub";

function AppInner() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    { from: "bot", text: "👋 Welcome to FarmerAI! How can I help you today?" },
  ]);

  const [hubOpen, setHubOpen] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  // responsive drawer states (mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  function handleQuickAction(action) {
    setMessages((prev) => [...prev, { from: "user", text: action }]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: `🤖 Quick help: here's a short tip on "${action}".` },
      ]);
    }, 900);
  }

  function handleNewChat() {
    setMessages([{ from: "bot", text: "👋 New conversation started. How can I help?" }]);
    setUploadedFile(null);
  }

  if (!user) return <LoginPage />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-faGrayLight to-faGreen-50 relative">
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="px-3 py-2 rounded-md bg-faGreen-600 text-white font-medium"
              aria-label="Open menu"
            >
              ☰
            </button>
            <div className="text-sm font-semibold text-faGreen-700">FarmerAI</div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRightOpen(true)}
              className="px-3 py-2 rounded-md bg-faGreen-100 text-faGreen-700"
              aria-label="Open tools"
            >
              ⚙️ Tools
            </button>

            <button
              onClick={() => setHubOpen(true)}
              className="px-3 py-2 rounded-md bg-faGreen-600 text-white"
              aria-label="Open FarmerHub"
            >
              👥 Hub
            </button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile drawers */}
      {(sidebarOpen || rightOpen) && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={() => {
            setSidebarOpen(false);
            setRightOpen(false);
          }}
        />
      )}

      {/* Grid layout on lg+: sidebar | chat | tools */}
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-6 pt-14 lg:pt-6">
        <div className="lg:grid lg:grid-cols-[280px_1fr_280px] lg:gap-6 items-start">
          {/* SIDEBAR */}
          {!hubOpen && (
            <aside
              className={
                /* mobile: fixed off-canvas, lg: static and in-grid */
                `fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
                 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                 lg:translate-x-0 lg:static lg:block lg:col-start-1`
              }
              aria-hidden={!sidebarOpen && "true"}
            >
              {/* prevent backdrop intercept on desktop: when lg, it's static so no overlap */}
              <div className="h-full bg-white rounded-lg shadow-md overflow-y-auto">
                <Sidebar
                  onQuickAction={(a) => {
                    handleQuickAction(a);
                    setSidebarOpen(false);
                  }}
                  onNewChat={() => {
                    handleNewChat();
                    setSidebarOpen(false);
                  }}
                />
              </div>
            </aside>
          )}

          {/* MAIN Chat */}
          <main className="lg:col-start-2">
            <div className="lg:mx-0 mx-auto max-w-[820px]">
              <div className="lg:hidden h-14" /> {/* spacer for mobile topbar */}
              <div className="py-6">
                {!hubOpen && (
                  <Chatbot
                    messages={messages}
                    setMessages={setMessages}
                    onNewChat={handleNewChat}
                    uploadedFile={uploadedFile}
                  />
                )}
              </div>
            </div>
          </main>

          {/* RIGHT TOOLS */}
          {!hubOpen && (
            <aside
              className={
                `fixed inset-y-0 right-0 z-50 w-72 transform transition-transform duration-300 ease-in-out
                 ${rightOpen ? 'translate-x-0' : 'translate-x-full'}
                 lg:translate-x-0 lg:static lg:block lg:col-start-3`
              }
              aria-hidden={!rightOpen && "true"}
            >
              <div className="h-full bg-white rounded-lg shadow-md overflow-y-auto">
                <RightPanel
                  uploadedFile={uploadedFile}
                  setUploadedFile={(f) => {
                    setUploadedFile(f);
                    if (f && window.innerWidth < 1024) setRightOpen(false);
                  }}
                />
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* FarmerHub full screen modal */}
      <AnimatePresence>
        {hubOpen && (
          <FarmerHub
            onClose={() => {
              setHubOpen(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Floating FarmerHub & Feedback buttons (hide when hubOpen) */}
      {!hubOpen && (
        <>
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <button
              onClick={() => setHubOpen(true)}
              className="px-6 py-3 bg-white/80 backdrop-blur-md border border-faGreen-600 text-faGreen-700 font-semibold rounded-[30px] shadow-xl hover:scale-105 transition-all"
              style={{
                boxShadow: "0 8px 20px rgba(0,0,0,0.15), inset 0 0 15px rgba(34,197,94,0.12)",
              }}
            >
              👥 FarmerHub
            </button>
          </div>

          <FeedbackButton />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
