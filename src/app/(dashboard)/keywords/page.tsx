"use client";

import { useState, useEffect } from "react";
import { Keyword } from "@/types";
import KeywordsTable from "@/components/KeywordsTable";
import StatRow from "@/components/StatRow";
import Toast from "@/components/Toast";
import { formatNumber } from "@/lib/utils";

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackedKeywords, setTrackedKeywords] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products?type=keywords");
        const data = await res.json();
        setKeywords(data.keywords || []);
      } catch {
        setToast({ message: "Failed to load keywords", type: "error" });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleTrack(keywordId: string) {
    setTrackedKeywords((prev) => {
      const next = new Set(prev);
      next.add(keywordId);
      return next;
    });
    setToast({ message: "Keyword added to tracking!", type: "success" });
  }

  const filtered = keywords.filter((kw) =>
    !search || kw.keyword.toLowerCase().includes(search.toLowerCase())
  );

  const avgVolume = keywords.length > 0
    ? Math.round(keywords.reduce((sum, k) => sum + k.volume, 0) / keywords.length)
    : 0;

  const avgCPC = keywords.length > 0
    ? (keywords.reduce((sum, k) => sum + k.cpc, 0) / keywords.length).toFixed(2)
    : "0.00";

  const lowCompCount = keywords.filter((k) => k.difficulty === "Low").length;

  const stats = [
    { label: "Total Keywords", value: keywords.length, icon: "🔍" },
    { label: "Avg Monthly Volume", value: formatNumber(avgVolume), icon: "📊", trend: "up" as const },
    { label: "Low Difficulty", value: `${lowCompCount} keywords`, icon: "🎯" },
    { label: "Avg CPC", value: `$${avgCPC}`, icon: "💰" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-txt">Keyword Intelligence</h1>
          <p className="text-txt-2 text-sm mt-0.5">
            {loading ? "Loading..." : `${keywords.length} keywords tracked • Sorted by volume`}
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatRow stats={stats} />

      {/* Search */}
      <div className="bg-white rounded-xl border border-bd p-4 mb-6">
        <div className="relative max-w-md">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search keywords..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-orange" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-txt-2 text-sm">Loading keywords...</p>
          </div>
        </div>
      ) : (
        <KeywordsTable
          keywords={filtered}
          trackedKeywords={trackedKeywords}
          onTrack={handleTrack}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
