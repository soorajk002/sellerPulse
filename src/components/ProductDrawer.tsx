"use client";

import { useEffect, useRef } from "react";
import { Product } from "@/types";
import Ring from "./Ring";
import { formatRevenue, formatNumber, competitionClass, scoreRating, parseSparkline } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useMarketplace } from "@/context/MarketplaceContext";

interface ProductDrawerProps {
  product: Product | null;
  onClose: () => void;
  onTrack: (productId: string) => void;
  isTracked: boolean;
}

function Sparkline({ data }: { data: number[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-16 text-txt-3 text-sm">
        No BSR history available
      </div>
    );
  }
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 300;
  const h = 60;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const pathD = `M${pts.join("L")}`;
  const areaD = `M${pts[0]}L${pts.join("L")}L${w},${h}L0,${h}Z`;
  const last = data[data.length - 1];
  const first = data[0];
  const isUp = last >= first;
  const color = isUp ? "#1e7e34" : "#c0392b";
  const fillColor = isUp ? "#e8f5e9" : "#fdecea";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 60 }}>
      <path d={areaD} fill={fillColor} opacity="0.6"/>
      <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v, i) => (
        <circle
          key={i}
          cx={(i / (data.length - 1)) * w}
          cy={h - ((v - min) / range) * h}
          r="2"
          fill={color}
          opacity={i === data.length - 1 ? 1 : 0}
        />
      ))}
    </svg>
  );
}

function getAIInsight(product: Product): string {
  const { score, competition, trend, margin, revenue, reviews } = product;

  if (score >= 9) {
    return `This product is an exceptional opportunity. With a ${score} score, low competition, and strong upward trend, it's perfectly positioned for a new seller. The ${margin}% margin gives excellent room for PPC spending while remaining profitable.`;
  }
  if (score >= 8.5 && competition === "Low") {
    return `Strong buy signal. Low competition means you can rank organically within 30-60 days with a well-optimized listing. Revenue of ${formatRevenue(revenue)}/month suggests healthy demand, and ${reviews} reviews on top listings means the barrier to entry is still manageable.`;
  }
  if (score >= 8) {
    return `Good opportunity with solid fundamentals. The ${margin}% margin is above average for this category. Focus on product differentiation and strong imagery to compete. Consider bundling to justify a higher price point.`;
  }
  if (competition === "High") {
    return `This product has strong demand (${ formatRevenue(revenue)}/mo) but high competition means you'll need a significant PPC budget ($1,500+/mo) and a differentiated product to succeed. Only pursue if you can offer something unique.`;
  }
  if (trend === "down") {
    return `Declining trend detected. BSR has been worsening over the past 15 data points. This may be seasonal or indicate a saturating market. Consider waiting 30 days to see if the trend reverses before sourcing.`;
  }
  return `Moderate opportunity. Revenue of ${formatRevenue(revenue)}/month with ${margin}% margins is acceptable. The medium competition level means you'll need a focused keyword strategy. Consider targeting long-tail keywords to build initial rank velocity.`;
}

export default function ProductDrawer({ product, onClose, onTrack, isTracked }: ProductDrawerProps) {
  const router = useRouter();
  const drawerRef = useRef<HTMLDivElement>(null);
  const { currency } = useMarketplace();

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  useEffect(() => {
    if (product) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [product]);

  if (!product) return null;

  const sparklineData = parseSparkline(product.sparkline);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-lg bg-white z-50 shadow-2xl overflow-y-auto"
        style={{ animation: "slideInRight 0.2s ease-out" }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-bd px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{product.emoji}</span>
            <div>
              <h2 className="font-bold text-txt text-sm leading-tight">{product.name}</h2>
              <p className="text-txt-3 text-xs font-mono">{product.asin}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-bg-2 text-txt-3 hover:text-txt transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Score + Key Stats */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center">
              <Ring score={product.score} size="lg" />
              <span className="text-xs text-txt-3 mt-1">{scoreRating(product.score)}</span>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3">
              <div className="bg-bg rounded-lg p-3">
                <p className="text-txt-3 text-xs mb-0.5">Monthly Revenue</p>
                <p className="font-bold text-txt">{formatRevenue(product.revenue, currency)}</p>
              </div>
              <div className="bg-bg rounded-lg p-3">
                <p className="text-txt-3 text-xs mb-0.5">BSR</p>
                <p className="font-bold text-txt font-mono">#{formatNumber(product.bsr)}</p>
              </div>
              <div className="bg-bg rounded-lg p-3">
                <p className="text-txt-3 text-xs mb-0.5">Price</p>
                <p className="font-bold text-txt">{currency}{product.price.toFixed(2)}</p>
              </div>
              <div className="bg-bg rounded-lg p-3">
                <p className="text-txt-3 text-xs mb-0.5">Margin</p>
                <p className="font-bold text-txt">{product.margin}%</p>
              </div>
            </div>
          </div>

          {/* BSR Sparkline */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-txt text-sm">BSR Trend (15 days)</h3>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                product.trend === "up" ? "bg-green-light text-green" :
                product.trend === "down" ? "bg-red-light text-red" :
                "bg-bg-2 text-txt-2"
              }`}>
                {product.trend === "up" ? "↑ Improving" : product.trend === "down" ? "↓ Declining" : "→ Stable"}
              </span>
            </div>
            <div className="bg-bg rounded-xl p-3">
              <Sparkline data={sparklineData} />
            </div>
          </div>

          {/* Details */}
          <div>
            <h3 className="font-semibold text-txt text-sm mb-3">Product Details</h3>
            <div className="space-y-2">
              {[
                { label: "Category", value: product.category },
                { label: "Reviews", value: formatNumber(product.reviews) },
                { label: "Competition", value: product.competition, badge: true },
                { label: "ASIN", value: product.asin, mono: true },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-bd last:border-0">
                  <span className="text-txt-3 text-sm">{row.label}</span>
                  {row.badge ? (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${competitionClass(row.value)}`}>
                      {row.value}
                    </span>
                  ) : (
                    <span className={`text-sm font-medium text-txt ${row.mono ? "font-mono" : ""}`}>
                      {row.value}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* AI Insight */}
          <div className="bg-orange-light border border-orange-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-orange text-sm">🤖</span>
              <h3 className="font-semibold text-orange text-sm">AI Market Insight</h3>
            </div>
            <p className="text-txt-2 text-sm leading-relaxed">{getAIInsight(product)}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onTrack(product.id)}
              disabled={isTracked}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors border flex items-center justify-center gap-2 ${
                isTracked
                  ? "bg-green-light border-green-border text-green cursor-default"
                  : "bg-white border-bd text-txt hover:bg-bg-2"
              }`}
            >
              {isTracked ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Tracked
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                  </svg>
                  Track Product
                </>
              )}
            </button>
            <button
              onClick={() => {
                onClose();
                router.push(`/calculator?price=${product.price.toFixed(2)}`);
              }}
              className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Calculate Profit
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
