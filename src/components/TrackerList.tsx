"use client";

import { TrackedProduct } from "@/types";
import Ring from "./Ring";
import { formatRevenue, formatNumber } from "@/lib/utils";

interface TrackerListProps {
  trackedProducts: TrackedProduct[];
  onRemove: (productId: string) => void;
  onView: (tracked: TrackedProduct) => void;
}

function MiniSparkline({ data, trend }: { data: number[]; trend: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const color = trend === "up" ? "#1e7e34" : trend === "down" ? "#c0392b" : "#8a96a8";
  const fillColor = trend === "up" ? "#e8f5e9" : trend === "down" ? "#fdecea" : "#f0f2f5";
  const areaD = `M${pts[0]}L${pts.join("L")}L${w},${h}L0,${h}Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={areaD} fill={fillColor} opacity="0.7"/>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default function TrackerList({ trackedProducts, onRemove, onView }: TrackerListProps) {
  if (trackedProducts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-bd text-center py-16">
        <p className="text-4xl mb-3">📈</p>
        <p className="text-txt font-semibold text-lg mb-1">No tracked products yet</p>
        <p className="text-txt-2 text-sm max-w-xs mx-auto">
          Go to Products and click &quot;Track Product&quot; on any product to monitor its performance here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {trackedProducts.map((tp) => {
        const product = tp.product;
        const sparkData = Array.isArray(product.sparkline)
          ? product.sparkline
          : JSON.parse(product.sparkline as unknown as string);

        const recentData = sparkData.slice(-7);
        const scoreChange = recentData.length >= 2
          ? ((recentData[recentData.length - 1] - recentData[0]) / recentData[0] * 100)
          : 0;

        return (
          <div
            key={tp.id}
            className="bg-white rounded-xl border border-bd p-4 hover:border-orange-border hover:shadow-sm transition-all"
          >
            <div className="flex items-center gap-4">
              {/* Emoji + Name */}
              <div
                className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                onClick={() => onView(tp)}
              >
                <span className="text-3xl flex-shrink-0">{product.emoji}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-txt text-sm leading-tight truncate">{product.name}</p>
                  <p className="text-txt-3 text-xs font-mono mt-0.5">{product.asin}</p>
                  <p className="text-txt-3 text-xs">{product.category}</p>
                </div>
              </div>

              {/* Score */}
              <div className="flex flex-col items-center flex-shrink-0">
                <Ring score={product.score} size="sm" />
              </div>

              {/* Stats */}
              <div className="hidden md:grid grid-cols-3 gap-4 flex-shrink-0">
                <div className="text-center">
                  <p className="text-txt-3 text-xs">Revenue</p>
                  <p className="font-semibold text-txt text-sm">{formatRevenue(product.revenue)}</p>
                </div>
                <div className="text-center">
                  <p className="text-txt-3 text-xs">BSR</p>
                  <p className="font-semibold text-txt text-sm font-mono">#{formatNumber(product.bsr)}</p>
                </div>
                <div className="text-center">
                  <p className="text-txt-3 text-xs">Margin</p>
                  <p className="font-semibold text-txt text-sm">{product.margin}%</p>
                </div>
              </div>

              {/* Sparkline + Change */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                <MiniSparkline data={sparkData} trend={product.trend} />
                <div className="text-center min-w-12">
                  <p className="text-txt-3 text-xs">7-day</p>
                  <span className={`text-xs font-bold ${scoreChange > 0 ? "text-green" : scoreChange < 0 ? "text-red" : "text-txt-3"}`}>
                    {scoreChange > 0 ? "+" : ""}{scoreChange.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Trend arrow */}
              <div className="flex-shrink-0">
                <span className={`text-lg font-bold ${
                  product.trend === "up" ? "text-green" :
                  product.trend === "down" ? "text-red" :
                  "text-txt-3"
                }`}>
                  {product.trend === "up" ? "↑" : product.trend === "down" ? "↓" : "→"}
                </span>
              </div>

              {/* Remove button */}
              <button
                onClick={() => onRemove(product.id)}
                className="flex-shrink-0 p-1.5 text-txt-3 hover:text-red hover:bg-red-light rounded-lg transition-colors"
                title="Remove from tracker"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
