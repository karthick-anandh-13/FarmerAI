import React, { useMemo, useState } from "react";

/*
  GovernmentSchemesPage.jsx
  Features:
   - List of schemes (sample data included)
   - Search bar
   - Filters (sector, beneficiary, state)
   - Expand/collapse scheme cards
   - Download as text or copy JSON
   - Responsive & styled
*/

// Sample schemes database
const SCHEMES = [
  {
    id: "pm-kisan",
    title: "PM-Kisan Samman Nidhi",
    sector: "Income Support",
    state: "National",
    beneficiaries: "Small & Marginal Farmers",
    eligibility: "All landholding small & marginal farmers, up to 2 hectares.",
    benefits: "₹6,000 per year in three installments directly to bank accounts.",
    link: "https://pmkisan.gov.in",
  },
  {
    id: "soil-health",
    title: "Soil Health Card Scheme",
    sector: "Soil Management",
    state: "National",
    beneficiaries: "All Farmers",
    eligibility: "All farmers eligible via local agriculture departments.",
    benefits: "Free soil testing & soil health cards with crop-wise nutrient recommendations.",
    link: "https://soilhealth.dac.gov.in",
  },
  {
    id: "pmfby",
    title: "Pradhan Mantri Fasal Bima Yojana (PMFBY)",
    sector: "Insurance",
    state: "National",
    beneficiaries: "All Farmers",
    eligibility: "Farmers with insurable crops notified by state governments.",
    benefits: "Crop insurance coverage for natural calamities, pests, and diseases.",
    link: "https://pmfby.gov.in",
  },
  {
    id: "kerala-rice",
    title: "Kerala Paddy Cultivation Incentive",
    sector: "Crop Incentive",
    state: "Kerala",
    beneficiaries: "Paddy Farmers",
    eligibility: "Registered paddy farmers in Kerala.",
    benefits: "Financial support per acre cultivated under rice.",
    link: "https://keralaagriculture.gov.in",
  },
  {
    id: "maharashtra-drip",
    title: "Maharashtra Drip Irrigation Subsidy",
    sector: "Irrigation",
    state: "Maharashtra",
    beneficiaries: "All Farmers",
    eligibility: "Farmers installing drip irrigation systems.",
    benefits: "Subsidy up to 70% for micro-irrigation equipment.",
    link: "https://maharashtra.gov.in",
  },
];

// Download helper
function downloadFile(text, filename = "schemes.txt") {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function GovernmentSchemesPage({ onClose }) {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("All");
  const [state, setState] = useState("All");

  const sectors = Array.from(new Set(SCHEMES.map((s) => s.sector)));
  const states = Array.from(new Set(SCHEMES.map((s) => s.state)));

  const filtered = useMemo(() => {
    return SCHEMES.filter((s) => {
      const q = query.toLowerCase();
      const matchesQuery =
        s.title.toLowerCase().includes(q) ||
        s.benefits.toLowerCase().includes(q) ||
        s.eligibility.toLowerCase().includes(q);
      const matchesSector = sector === "All" || s.sector === sector;
      const matchesState = state === "All" || s.state === state;
      return matchesQuery && matchesSector && matchesState;
    });
  }, [query, sector, state]);

  function handleDownload() {
    const text = filtered
      .map(
        (s) =>
          `${s.title}\nSector: ${s.sector}\nState: ${s.state}\nBeneficiaries: ${s.beneficiaries}\nEligibility: ${s.eligibility}\nBenefits: ${s.benefits}\nLink: ${s.link}\n`
      )
      .join("\n-----------------\n\n");
    downloadFile(text, "government_schemes.txt");
  }

  function handleCopy() {
    navigator.clipboard.writeText(JSON.stringify(filtered, null, 2));
    alert("Copied filtered schemes as JSON to clipboard");
  }

  return (
    <div className="w-full bg-white rounded-md p-6 glass-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-faGreen-800">🏛️ Government Schemes</h2>
          <p className="text-sm text-gray-600 mt-1 max-w-xl">
            Browse central and state-level agricultural schemes. Search or filter to find relevant programs for your needs.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <button onClick={onClose} className="px-3 py-2 bg-gray-100 rounded">Close</button>
          <button onClick={handleDownload} className="px-3 py-2 bg-faGreen-600 text-white rounded">Download</button>
          <button onClick={handleCopy} className="px-3 py-2 bg-gray-100 rounded">Copy JSON</button>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-4 items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search schemes..."
          className="border px-3 py-2 rounded flex-1"
        />
        <select value={sector} onChange={(e) => setSector(e.target.value)} className="border px-3 py-2 rounded">
          <option>All</option>
          {sectors.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={state} onChange={(e) => setState(e.target.value)} className="border px-3 py-2 rounded">
          <option>All</option>
          {states.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Schemes list */}
      <div className="mt-6 space-y-4 max-h-[65vh] overflow-y-auto">
        {filtered.length === 0 && (
          <div className="text-sm text-gray-500">No schemes match your criteria.</div>
        )}
        {filtered.map((s) => (
          <details
            key={s.id}
            className="glass-card p-4 cursor-pointer"
          >
            <summary className="font-semibold text-faGreen-700">{s.title}</summary>
            <div className="mt-2 text-sm text-gray-700">
              <p><strong>Sector:</strong> {s.sector}</p>
              <p><strong>State:</strong> {s.state}</p>
              <p><strong>Beneficiaries:</strong> {s.beneficiaries}</p>
              <p><strong>Eligibility:</strong> {s.eligibility}</p>
              <p><strong>Benefits:</strong> {s.benefits}</p>
              <a
                href={s.link}
                target="_blank"
                rel="noreferrer"
                className="text-faGreen-600 underline mt-2 inline-block"
              >
                Visit official site
              </a>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
