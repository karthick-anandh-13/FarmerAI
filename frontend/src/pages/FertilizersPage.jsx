import React, { useMemo, useState } from "react";

/*
  FertilizersPage.jsx
  - Ready-to-use client-side page for Fertilizers & Pesticides information
  - Features:
    - Header + short intro
    - Searchable FAQs
    - Crop selector -> recommended fertilizers & dosage table
    - Pesticide safety & application best practices
    - Simple dosage calculator (input area, suggested dose)
    - Downloadable guideline (client-side generated text file)
    - Clean, responsive layout suitable for embedding in RightPanel or a modal
*/

const SAMPLE_RECOMMENDATIONS = {
  "Rice": {
    fertilizers: [
      { name: "Urea (46% N)", timing: "Split: Basal + Tillering + Panicle", doseKgPerHa: 100 },
      { name: "Single Super Phosphate (SSP) (16% P2O5)", timing: "Basal", doseKgPerHa: 150 },
      { name: "Muriate of Potash (MOP) (60% K2O)", timing: "At panicle initiation", doseKgPerHa: 50 },
    ],
    notes: "Ensure proper puddling and balance NPK depending on soil test results."
  },
  "Wheat": {
    fertilizers: [
      { name: "DAP (18-46-0)", timing: "Basal (sowing)", doseKgPerHa: 120 },
      { name: "Urea (46% N)", timing: "Top dressing at tillering", doseKgPerHa: 80 },
      { name: "MOP", timing: "If potassium deficient", doseKgPerHa: 40 },
    ],
    notes: "Split N application: some at sowing and remaining at tillering for higher yield stability."
  },
  "Tomato": {
    fertilizers: [
      { name: "Compost or FYM", timing: "Basal, incorporate into soil", doseKgPerHa: 10_000 },
      { name: "Single Super Phosphate (SSP)", timing: "Basal", doseKgPerHa: 200 },
      { name: "MOP / Potash", timing: "Flowering", doseKgPerHa: 80 },
    ],
    notes: "Tomato prefers slightly acidic to neutral soils; monitor Ca/Mg for blossom-end rot."
  },
  "Maize": {
    fertilizers: [
      { name: "DAP", timing: "Basal", doseKgPerHa: 150 },
      { name: "Urea", timing: "Split application", doseKgPerHa: 120 },
      { name: "MOP", timing: "During vegetative growth", doseKgPerHa: 40 },
    ],
    notes: "N management is critical; consider nitrification inhibitors for long-duration crops."
  }
};

const FAQ = [
  { q: "When should I apply nitrogen?", a: "Apply nitrogen in splits: part at baseline and remaining during active vegetative growth to reduce losses." },
  { q: "How to avoid fertilizer burn?", a: "Mix fertilizers into soil and avoid placing near seed/young roots. Use recommended dosages." },
  { q: "Can I mix pesticides and fertilizers in the same spray?", a: "Only mix if product labels explicitly allow. Always perform a jar test before tank mixing." },
  { q: "How to store pesticides safely?", a: "Keep in labeled, original containers in a locked, ventilated room away from food/feed." },
];

function downloadGuideline(text, filename = "fertilizer_guideline.txt") {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function FertilizersPage({ onClose }) {
  const [crop, setCrop] = useState("Rice");
  const [areaHa, setAreaHa] = useState(1); // hectares
  const [faqQuery, setFaqQuery] = useState("");
  const rec = SAMPLE_RECOMMENDATIONS[crop];

  const filteredFaq = useMemo(() => {
    if (!faqQuery.trim()) return FAQ;
    const q = faqQuery.toLowerCase();
    return FAQ.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
  }, [faqQuery]);

  function handleDownloadRecommendations() {
    const text = [
      `Recommendations for ${crop}`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Fertilizers:`,
      ...rec.fertilizers.map(f => ` - ${f.name} | Timing: ${f.timing} | Dose: ${f.doseKgPerHa} kg/ha`),
      ``,
      `Notes:`,
      ` ${rec.notes}`,
    ].join("\n");
    downloadGuideline(text, `${crop}_fertilizer_guide.txt`);
  }

  function calcDose(dosePerHa) {
    const d = Number(dosePerHa || 0) * Number(areaHa || 0);
    return Math.round(d * 100) / 100;
  }

  return (
    <div className="w-full bg-white rounded-md p-6 glass-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-faGreen-800">🌾 Fertilizers & Pesticides</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-xl">
            Practical recommendations and safety guidance for balanced fertilization, responsible pesticide use, and dosage planning.
            Use soil tests for precise nutrient management — below suggestions are general best-practices.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={onClose} className="px-3 py-2 bg-gray-100 rounded">Close</button>
          <button onClick={handleDownloadRecommendations} className="px-3 py-2 bg-faGreen-600 text-white rounded">Download Guide</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: crop selector + recommendations */}
        <section className="col-span-2 space-y-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm text-gray-600">Select crop</label>
              <select value={crop} onChange={(e) => setCrop(e.target.value)} className="border px-3 py-2 rounded">
                {Object.keys(SAMPLE_RECOMMENDATIONS).map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label className="text-sm text-gray-600 ml-4">Area (ha)</label>
              <input type="number" min="0.01" step="0.01" value={areaHa} onChange={(e) => setAreaHa(e.target.value)} className="w-24 border px-2 py-1 rounded" />
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-semibold text-faGreen-700">Recommended fertilizers for {crop}</h3>
            <p className="text-sm text-gray-600 mt-1">{rec.notes}</p>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full table-auto text-sm">
                <thead className="text-left text-xs text-gray-500">
                  <tr>
                    <th className="px-2 py-2">Fertilizer</th>
                    <th className="px-2 py-2">Timing</th>
                    <th className="px-2 py-2">Dose (kg/ha)</th>
                    <th className="px-2 py-2">Dose for area (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.fertilizers.map((f) => (
                    <tr key={f.name} className="border-t">
                      <td className="px-2 py-3 font-medium">{f.name}</td>
                      <td className="px-2 py-3 text-gray-600">{f.timing}</td>
                      <td className="px-2 py-3">{f.doseKgPerHa}</td>
                      <td className="px-2 py-3">{calcDose(f.doseKgPerHa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex gap-3">
              <button onClick={handleDownloadRecommendations} className="px-4 py-2 bg-faGreen-600 text-white rounded">Download</button>
              <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(rec))} className="px-4 py-2 bg-gray-100 rounded">Copy JSON</button>
            </div>
          </div>

          {/* Pesticide quick selection */}
          <div className="glass-card p-4">
            <h3 className="font-semibold text-faGreen-700">Pesticide safety & selection</h3>
            <ul className="mt-2 space-y-2 text-sm text-gray-700">
              <li>• Always follow label instructions and authorized use per crop.</li>
              <li>• Wear PPE: gloves, mask, eye protection when handling pesticides.</li>
              <li>• Do not spray during windy conditions; avoid drift to nearby crops or water bodies.</li>
              <li>• Observe pre-harvest interval (PHI) before harvesting produce for consumption.</li>
              <li>• For integrated pest management (IPM), prefer biopesticides where effective.</li>
            </ul>
          </div>
        </section>

        {/* Right column: FAQs + Calculator */}
        <aside className="space-y-4">
          <div className="glass-card p-4">
            <h4 className="font-semibold text-faGreen-700">Dosage calculator</h4>
            <p className="text-sm text-gray-600 mt-1">Calculate total fertilizer requirement for your area</p>

            <div className="mt-3">
              <label className="text-xs text-gray-600">Dose per ha (kg)</label>
              <input type="number" className="w-full border px-3 py-2 rounded mt-1" placeholder="Enter dose per ha" id="dosePerHa" />
              <div className="mt-2 flex gap-2">
                <button className="px-3 py-2 bg-faGreen-600 text-white rounded" onClick={() => {
                  const val = Number(document.getElementById("dosePerHa").value || 0);
                  const total = Math.round(val * Number(areaHa || 0) * 100) / 100;
                  alert(`Total required: ${total} kg for ${areaHa} ha`);
                }}>Calculate</button>
                <button className="px-3 py-2 bg-gray-100 rounded" onClick={() => {
                  document.getElementById("dosePerHa").value = "";
                }}>Reset</button>
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <h4 className="font-semibold text-faGreen-700">Frequently Asked</h4>
            <input value={faqQuery} onChange={(e) => setFaqQuery(e.target.value)} placeholder="Search FAQs..." className="w-full border px-3 py-2 rounded mt-2" />
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              {filteredFaq.map((f,i) => (
                <details key={i} className="bg-faGray-50 p-2 rounded">
                  <summary className="font-medium">{f.q}</summary>
                  <div className="mt-1 text-sm text-gray-600">{f.a}</div>
                </details>
              ))}
            </div>
          </div>

          <div className="glass-card p-4 text-sm text-gray-700">
            <h4 className="font-semibold text-faGreen-700">Safety reminder</h4>
            <p className="mt-2">Store in original containers, away from food and children. Dispose of empty pesticide containers per local rules.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
