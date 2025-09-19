// src/components/RightPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MenuItemMotion from "./MenuItemMotion";
import FertilizersPage from "../pages/FertilizersPage";
import GovernmentSchemesPage from "../pages/GovernmentSchemesPage";

export default function RightPanel({ uploadedFile, setUploadedFile }) {
  const [active, setActive] = useState(null); // 'live','file','fert','schemes'
  const [openFert, setOpenFert] = useState(false);
  const [openSchemes, setOpenSchemes] = useState(false);

  const [widthPct, setWidthPct] = useState(50);
  const draggingRef = useRef(false);

  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  useEffect(() => {
    function onMove(e) {
      if (!draggingRef.current) return;
      const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
      if (clientX == null) return;
      const vw = window.innerWidth || document.documentElement.clientWidth;
      let newPct = ((vw - clientX) / vw) * 100;
      if (newPct < 35) newPct = 35;
      if (newPct > 100) newPct = 100;
      setWidthPct(Number(newPct.toFixed(2)));
    }
    function onUp() {
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, []);

  function startDrag(e) {
    if (isMobile) return;
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result;
      setUploadedFile({ name: file.name, content: String(text), type: file.type });
      alert("File uploaded and available to the chat.");
    };

    if (file.type === "text/plain" || (file.name && file.name.endsWith(".md"))) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
      reader.onload = () => {
        setUploadedFile({ name: file.name, content: null, type: file.type });
        alert("File uploaded. PDF/complex files are saved - send to backend for extraction.");
      };
    }
  }

  function switchTo(section) {
    setActive((s) => (s === section ? null : section));
    if (section !== "fert") setOpenFert(false);
    if (section !== "schemes") setOpenSchemes(false);
  }

  const overlayStyle = isMobile
    ? { width: "100vw", right: 0, top: 0, bottom: 0 }
    : { width: `${widthPct}vw`, right: 0, top: 0, bottom: 0 };

  return (
    <>
      {/* Right Tools column (desktop). Add overflow-visible so MenuItemMotion outline isn't clipped */}
      <aside className="w-72 hidden lg:flex flex-col bg-white/90 border-l border-faGray-200 overflow-visible">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-faGreen-700">Tools</h3>
        </div>

        <nav className="p-4 space-y-3 relative z-10">
          <MenuItemMotion
            icon="🎥"
            label="Live pest detection"
            onClick={() => switchTo("live")}
            className={active === "live" ? "bg-faGreen-50" : ""}
          />

          <MenuItemMotion
            icon="📄"
            label="File summarizer & Q/A"
            onClick={() => switchTo("file")}
            className={active === "file" ? "bg-faGreen-50" : ""}
          />

          <MenuItemMotion
            icon="🌿"
            label="Fertilizers & Pesticides"
            onClick={() => {
              switchTo("fert");
              setOpenFert(true);
            }}
            className={active === "fert" ? "bg-faGreen-50" : ""}
          />

          <MenuItemMotion
            icon="🏛️"
            label="Government schemes"
            onClick={() => {
              switchTo("schemes");
              setOpenSchemes(true);
            }}
            className={active === "schemes" ? "bg-faGreen-50" : ""}
          />
        </nav>

        <div className="p-4 border-t overflow-y-auto flex-1">
          {active === "live" && (
            <div>
              <h4 className="font-semibold text-faGreen-700 mb-2">Live Pest Detection</h4>
              <p className="text-sm text-gray-600">Use your camera for quick pest checks. (Coming soon)</p>
              <div className="mt-3">
                <button className="px-3 py-2 rounded-md bg-faGreen-500 text-white" disabled>
                  Start
                </button>
              </div>
            </div>
          )}

          {active === "file" && (
            <div>
              <h4 className="font-semibold text-faGreen-700 mb-2">Upload file to summarize</h4>
              <input type="file" accept=".txt,.md,.pdf" onChange={handleFile} className="mt-3" />
              {uploadedFile ? (
                <div className="mt-3 p-3 rounded-md bg-faGray-50 text-sm">
                  <div className="font-semibold">{uploadedFile.name}</div>
                  <div className="text-xs text-gray-500">
                    {uploadedFile.content
                      ? `${String(uploadedFile.content).slice(0, 200)}...`
                      : "PDF/complex file uploaded. Will be parsed by backend."}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-sm text-gray-500">No file uploaded yet.</div>
              )}
            </div>
          )}

          {!active && <div className="text-sm text-gray-500">Select a tool to see details</div>}
        </div>
      </aside>

      {/* Sliding overlays */}
      <AnimatePresence>
        {openFert && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed z-50"
            style={overlayStyle}
          >
            {!isMobile && (
              <div
                onMouseDown={startDrag}
                onTouchStart={startDrag}
                className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-50"
                title="Drag to resize"
              />
            )}

            <div className="h-full bg-white shadow-2xl overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-40">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🌿</span>
                  <h3 className="text-lg font-semibold text-faGreen-700">Fertilizers & Pesticides</h3>
                </div>
                <button
                  onClick={() => setOpenFert(false)}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-6">
                <FertilizersPage onClose={() => setOpenFert(false)} />
              </div>
            </div>
          </motion.div>
        )}

        {openSchemes && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35 }}
            className="fixed z-50"
            style={overlayStyle}
          >
            {!isMobile && (
              <div
                onMouseDown={startDrag}
                onTouchStart={startDrag}
                className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-50"
                title="Drag to resize"
              />
            )}

            <div className="h-full bg-white shadow-2xl overflow-y-auto">
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-40">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🏛️</span>
                  <h3 className="text-lg font-semibold text-faGreen-700">Government Schemes</h3>
                </div>
                <button
                  onClick={() => setOpenSchemes(false)}
                  className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
                >
                  ✕ Close
                </button>
              </div>

              <div className="p-6">
                <GovernmentSchemesPage onClose={() => setOpenSchemes(false)} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
