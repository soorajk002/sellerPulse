"use client";

import { Product, SortField } from "@/types";
import { formatRevenue, formatNumber, competitionClass, parseSparkline } from "@/lib/utils";

// ── Opportunity tag ──────────────────────────────────────────────────────────

interface Tag { label: string; cls: string }

function getOpportunityTag(p: Product): Tag | null {
  if (p.score >= 8.5 && p.competition === "Low" && p.reviews < 300)
    return { label: "Quick Win", cls: "bg-green-light text-green border border-green-border" };
  if (p.score >= 8 && p.reviews < 150 && p.competition !== "High")
    return { label: "Hidden Gem", cls: "bg-violet-50 text-violet-600 border border-violet-200" };
  if (p.trend === "up" && p.score >= 7)
    return { label: "Trending ↑", cls: "bg-sky-50 text-sky-600 border border-sky-200" };
  if (p.margin >= 35 && p.price >= 20)
    return { label: "High Margin", cls: "bg-amber-light text-amber border border-amber-border" };
  if (p.revenue >= 5000 && p.bsr < 50000)
    return { label: "High Demand", cls: "bg-orange-light text-orange border border-orange-border" };
  return null;
}

// ── Mini sparkline ────────────────────────────────────────────────────────────

function MiniSparkline({ data, trend }: { data: number[]; trend: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 56;
  const h = 22;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`);
  const color = trend === "up" ? "#1e7e34" : trend === "down" ? "#c0392b" : "#8a96a8";
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} className="flex-shrink-0">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8.5 ? "#1e7e34" : score >= 7 ? "#b45309" : "#c0392b";
  const bg    = score >= 8.5 ? "#e8f5e9" : score >= 7 ? "#fef3c7" : "#fdecea";
  return (
    <span
      className="inline-flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold border-2 flex-shrink-0"
      style={{ color, backgroundColor: bg, borderColor: color }}
    >
      {score.toFixed(1)}
    </span>
  );
}

// ── Sort header cell ──────────────────────────────────────────────────────────

interface SortHeaderProps {
  label: string;
  field: SortField;
  sortBy: SortField;
  sortDir: "asc" | "desc";
  onSort: (field: SortField) => void;
  className?: string;
}

function SortHeader({ label, field, sortBy, sortDir, onSort, className = "" }: SortHeaderProps) {
  const active = sortBy === field;
  return (
    <th
      className={`px-3 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide cursor-pointer select-none hover:text-txt transition-colors whitespace-nowrap ${className}`}
      onClick={() => onSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className={`text-[10px] ${active ? "opacity-100" : "opacity-30"}`}>
          {active && sortDir === "asc" ? "▲" : "▼"}
        </span>
      </span>
    </th>
  );
}

// ── Product image ─────────────────────────────────────────────────────────────

function ProductImage({ asin, emoji }: { asin: string; emoji: string }) {
  const src = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01._SL60_.jpg`;
  return (
    <div className="w-10 h-10 rounded-lg overflow-hidden bg-bg flex-shrink-0 flex items-center justify-center border border-bd">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="w-full h-full object-contain"
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = "none";
          if (el.parentElement) {
            el.parentElement.innerHTML = `<span class="text-xl">${emoji}</span>`;
          }
        }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface ProductTableProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  trackedIds: Set<string>;
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  viewMode: "table" | "cards";
  sortBy: SortField;
  sortDir: "asc" | "desc";
  onSort: (field: SortField) => void;
}

export default function ProductTable({
  products,
  onRowClick,
  trackedIds,
  selectedIds,
  onSelectAll,
  onSelectOne,
  viewMode,
  sortBy,
  sortDir,
  onSort,
}: ProductTableProps) {

  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => {
          const tag = getOpportunityTag(product);
          return (
            <div
              key={product.id}
              onClick={() => onRowClick(product)}
              className="bg-white rounded-xl border border-bd p-4 cursor-pointer hover:border-orange-border hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <ProductImage asin={product.asin} emoji={product.emoji} />
                  <div className="min-w-0">
                    <p className="font-semibold text-txt text-sm leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-txt-3 text-xs font-mono mt-0.5">{product.asin}</p>
                  </div>
                </div>
                <ScoreBadge score={product.score} />
              </div>

              {tag && (
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mb-2 ${tag.cls}`}>
                  {tag.label}
                </span>
              )}

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-bg rounded-lg p-2">
                  <p className="text-txt-3 text-xs">Revenue</p>
                  <p className="font-bold text-txt text-sm">{formatRevenue(product.revenue)}/mo</p>
                </div>
                <div className="bg-bg rounded-lg p-2">
                  <p className="text-txt-3 text-xs">BSR</p>
                  <p className="font-bold text-txt text-sm font-mono">#{formatNumber(product.bsr)}</p>
                </div>
                <div className="bg-bg rounded-lg p-2">
                  <p className="text-txt-3 text-xs">Price</p>
                  <p className="font-bold text-txt text-sm">${product.price.toFixed(2)}</p>
                </div>
                <div className="bg-bg rounded-lg p-2">
                  <p className="text-txt-3 text-xs">Margin</p>
                  <p className={`font-bold text-sm ${product.margin >= 35 ? "text-green" : product.margin >= 20 ? "text-amber" : "text-red"}`}>
                    {product.margin}%
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${competitionClass(product.competition)}`}>
                  {product.competition}
                </span>
                <div className="flex items-center gap-1.5">
                  <MiniSparkline data={parseSparkline(product.sparkline)} trend={product.trend} />
                  <span className={`text-xs font-bold ${product.trend === "up" ? "text-green" : product.trend === "down" ? "text-red" : "text-txt-3"}`}>
                    {product.trend === "up" ? "↑" : product.trend === "down" ? "↓" : "→"}
                  </span>
                </div>
              </div>

              {trackedIds.has(product.id) && (
                <div className="mt-2 pt-2 border-t border-bd flex items-center gap-1 text-green text-xs font-medium">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                  Tracked
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Table view ──────────────────────────────────────────────────────────────
  return (
    <div className="bg-white rounded-xl border border-bd overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg border-b border-bd">
              <th className="px-3 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === products.length && products.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-bd"
                />
              </th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Product</th>
              <SortHeader label="Score"    field="score"   sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Revenue"  field="revenue" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="BSR"      field="bsr"     sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Price"    field="price"   sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Reviews"  field="reviews" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <SortHeader label="Margin"   field="margin"  sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
              <th className="px-3 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Competition</th>
              <th className="px-3 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">BSR Trend</th>
              <th className="px-3 py-3 w-20"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const sparkData = parseSparkline(product.sparkline);
              const tag = getOpportunityTag(product);
              return (
                <tr
                  key={product.id}
                  onClick={() => onRowClick(product)}
                  className="border-b border-bd last:border-0 hover:bg-orange-light/30 cursor-pointer transition-colors"
                >
                  {/* Checkbox */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={(e) => onSelectOne(product.id, e.target.checked)}
                      className="rounded border-bd"
                    />
                  </td>

                  {/* Product */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage asin={product.asin} emoji={product.emoji} />
                      <div className="min-w-0">
                        <p className="font-semibold text-txt text-sm leading-tight truncate max-w-52">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-txt-3 text-xs font-mono">{product.asin}</span>
                          <span className="text-txt-3 text-xs">{product.category}</span>
                          {tag && (
                            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${tag.cls}`}>
                              {tag.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Score */}
                  <td className="px-3 py-3">
                    <ScoreBadge score={product.score} />
                  </td>

                  {/* Revenue */}
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="font-semibold text-txt text-sm">{formatRevenue(product.revenue)}</span>
                    <span className="text-txt-3 text-xs">/mo</span>
                  </td>

                  {/* BSR */}
                  <td className="px-3 py-3">
                    <span className="font-mono text-sm text-txt">#{formatNumber(product.bsr)}</span>
                  </td>

                  {/* Price */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-txt">${product.price.toFixed(2)}</span>
                  </td>

                  {/* Reviews */}
                  <td className="px-3 py-3">
                    <span className="text-sm text-txt">{formatNumber(product.reviews)}</span>
                  </td>

                  {/* Margin */}
                  <td className="px-3 py-3">
                    <span className={`text-sm font-semibold ${product.margin >= 35 ? "text-green" : product.margin >= 20 ? "text-amber" : "text-red"}`}>
                      {product.margin}%
                    </span>
                  </td>

                  {/* Competition */}
                  <td className="px-3 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${competitionClass(product.competition)}`}>
                      {product.competition}
                    </span>
                  </td>

                  {/* BSR Trend sparkline */}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1.5">
                      <MiniSparkline data={sparkData} trend={product.trend} />
                      <span className={`text-xs font-bold ${product.trend === "up" ? "text-green" : product.trend === "down" ? "text-red" : "text-txt-3"}`}>
                        {product.trend === "up" ? "↑" : product.trend === "down" ? "↓" : "→"}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    {trackedIds.has(product.id) ? (
                      <span className="text-green text-xs font-medium flex items-center gap-0.5">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        Tracked
                      </span>
                    ) : (
                      <button
                        onClick={() => onRowClick(product)}
                        className="text-xs text-txt-3 hover:text-orange border border-bd hover:border-orange-border px-2 py-1 rounded-lg transition-colors"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-txt-2 font-medium">No products match these filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
