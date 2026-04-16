"use client";

import { Product } from "@/types";
import Ring from "./Ring";
import { formatRevenue, formatNumber, competitionClass, parseSparkline } from "@/lib/utils";

function MiniSparkline({ data, trend }: { data: number[]; trend: string }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  });
  const color = trend === "up" ? "#1e7e34" : trend === "down" ? "#c0392b" : "#8a96a8";

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

interface ProductTableProps {
  products: Product[];
  onRowClick: (product: Product) => void;
  trackedIds: Set<string>;
  selectedIds: Set<string>;
  onSelectAll: (checked: boolean) => void;
  onSelectOne: (id: string, checked: boolean) => void;
  viewMode: "table" | "cards";
}

export default function ProductTable({
  products,
  onRowClick,
  trackedIds,
  selectedIds,
  onSelectAll,
  onSelectOne,
  viewMode,
}: ProductTableProps) {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product) => (
          <div
            key={product.id}
            onClick={() => onRowClick(product)}
            className="bg-white rounded-xl border border-bd p-4 cursor-pointer hover:border-orange-border hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{product.emoji}</span>
                <div>
                  <p className="font-semibold text-txt text-sm leading-tight">{product.name}</p>
                  <p className="text-txt-3 text-xs font-mono mt-0.5">{product.asin}</p>
                </div>
              </div>
              <Ring score={product.score} size="sm" />
            </div>
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
                <p className="font-bold text-txt text-sm">{product.margin}%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${competitionClass(product.competition)}`}>
                {product.competition}
              </span>
              <div className="flex items-center gap-2">
                <MiniSparkline data={parseSparkline(product.sparkline)} trend={product.trend} />
                <span className={`text-sm font-bold ${product.trend === "up" ? "text-green" : product.trend === "down" ? "text-red" : "text-txt-3"}`}>
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
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-bd overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-bg border-b border-bd">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === products.length && products.length > 0}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-bd"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Product</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Score</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Revenue</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">BSR</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Price</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Reviews</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Competition</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Trend</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-txt-3 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const sparkData = parseSparkline(product.sparkline);

              return (
                <tr
                  key={product.id}
                  onClick={() => onRowClick(product)}
                  className="border-b border-bd last:border-0 hover:bg-orange-light/30 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(product.id)}
                      onChange={(e) => onSelectOne(product.id, e.target.checked)}
                      className="rounded border-bd"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{product.emoji}</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-txt text-sm leading-tight truncate max-w-48">{product.name}</p>
                        <p className="text-txt-3 text-xs font-mono">{product.asin}</p>
                        <p className="text-txt-3 text-xs">{product.category}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Ring score={product.score} size="sm" />
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-txt text-sm">{formatRevenue(product.revenue)}</span>
                    <span className="text-txt-3 text-xs">/mo</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm text-txt">#{formatNumber(product.bsr)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-txt">${product.price.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-txt">{formatNumber(product.reviews)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${competitionClass(product.competition)}`}>
                      {product.competition}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MiniSparkline data={sparkData} trend={product.trend} />
                      <span className={`text-sm font-bold ${product.trend === "up" ? "text-green" : product.trend === "down" ? "text-red" : "text-txt-3"}`}>
                        {product.trend === "up" ? "↑" : product.trend === "down" ? "↓" : "→"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {products.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl mb-2">🔍</p>
            <p className="text-txt-2 font-medium">No products found</p>
            <p className="text-txt-3 text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}
