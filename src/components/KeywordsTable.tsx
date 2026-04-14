"use client";

import { Keyword } from "@/types";
import { formatNumber } from "@/lib/utils";

interface KeywordsTableProps {
  keywords: Keyword[];
  trackedKeywords: Set<string>;
  onTrack: (keywordId: string) => void;
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles = {
    Low: "badge-low",
    Medium: "badge-medium",
    High: "badge-high",
  };
  return (
    <span className={styles[difficulty as keyof typeof styles] || "bg-bg-2 text-txt-2 text-xs font-semibold px-2 py-0.5 rounded-full"}>
      {difficulty}
    </span>
  );
}

export default function KeywordsTable({ keywords, trackedKeywords, onTrack }: KeywordsTableProps) {
  if (keywords.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-bd text-center py-16">
        <p className="text-2xl mb-2">🔍</p>
        <p className="text-txt-2 font-medium">No keywords found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-bd overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="bg-bg border-b border-bd">
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Keyword</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Volume</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">CPC</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Difficulty</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Trend</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Actions</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((kw) => (
            <tr key={kw.id} className="border-b border-bd last:border-0 hover:bg-bg/50 transition-colors">
              <td className="px-4 py-3">
                <span className="font-medium text-txt text-sm">{kw.keyword}</span>
              </td>
              <td className="px-4 py-3">
                <div>
                  <span className="font-semibold text-txt text-sm">{formatNumber(kw.volume)}</span>
                  <span className="text-txt-3 text-xs ml-1">searches/mo</span>
                </div>
                {/* Volume bar */}
                <div className="w-24 bg-bg-2 rounded-full h-1.5 mt-1">
                  <div
                    className="bg-orange h-1.5 rounded-full"
                    style={{ width: `${Math.min((kw.volume / 55000) * 100, 100)}%` }}
                  />
                </div>
              </td>
              <td className="px-4 py-3">
                <span className="font-mono text-sm text-txt">${kw.cpc.toFixed(2)}</span>
              </td>
              <td className="px-4 py-3">
                <DifficultyBadge difficulty={kw.difficulty} />
              </td>
              <td className="px-4 py-3">
                <span className={`text-sm font-bold ${kw.trend === "up" ? "text-green" : kw.trend === "down" ? "text-red" : "text-txt-3"}`}>
                  {kw.trend === "up" ? "↑ Rising" : kw.trend === "down" ? "↓ Falling" : "→ Stable"}
                </span>
              </td>
              <td className="px-4 py-3">
                {trackedKeywords.has(kw.id) ? (
                  <span className="text-green text-xs font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    Tracked
                  </span>
                ) : (
                  <button
                    onClick={() => onTrack(kw.id)}
                    className="text-xs text-orange border border-orange-border hover:bg-orange-light px-3 py-1 rounded-lg transition-colors font-medium"
                  >
                    Track
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
