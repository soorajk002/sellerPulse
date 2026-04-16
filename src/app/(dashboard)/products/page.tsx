"use client";

import { useState, useEffect } from "react";
import { Product, FilterState, SortField } from "@/types";
import ProductTable from "@/components/ProductTable";
import ProductDrawer from "@/components/ProductDrawer";
import Toast from "@/components/Toast";

const EMPTY_FILTERS: FilterState = {
  category: "",
  competition: "",
  trend: "",
  minRevenue: 0, maxRevenue: 0,
  minBSR: 0,     maxBSR: 0,
  minPrice: 0,   maxPrice: 0,
  minScore: 0,   maxScore: 0,
  maxReviews: 0,
  minMargin: 0,
  sortBy: "score",
  sortDir: "desc",
};

interface Preset {
  label: string;
  icon: string;
  tip: string;
  filters: Partial<FilterState>;
}

const PRESETS: Preset[] = [
  { label: "Quick Win",    icon: "🎯", tip: "Low comp · <300 reviews · score 7.5+",  filters: { competition: "Low", maxReviews: 300, minScore: 7.5 } },
  { label: "High Demand",  icon: "🔥", tip: "Revenue $5k+/mo · BSR < 50k",          filters: { minRevenue: 5000, maxBSR: 50000 } },
  { label: "Hidden Gem",   icon: "💎", tip: "Score 8+ · <150 reviews",               filters: { minScore: 8, maxReviews: 150 } },
  { label: "High Margin",  icon: "💰", tip: "35%+ margin · price $20+",             filters: { minMargin: 35, minPrice: 20 } },
  { label: "Trending Up",  icon: "📈", tip: "BSR improving over last 15 data pts",  filters: { trend: "up" } },
];

const CATEGORIES = ["Kitchen", "Pet", "Sports", "Beauty", "Office", "Baby", "Toys", "Clothing", "Electronics", "Books", "Other"];

function hasActiveFilters(f: FilterState) {
  const { sortBy: _s, sortDir: _d, ...rest } = f;
  return Object.values(rest).some((v) => v !== "" && v !== 0);
}

function RangeRow({ label, minKey, maxKey, filters, set, prefix = "", suffix = "" }: {
  label: string;
  minKey: keyof FilterState;
  maxKey: keyof FilterState;
  filters: FilterState;
  set: (k: keyof FilterState, v: number) => void;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-txt-2 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-3 text-xs pointer-events-none">{prefix}</span>}
          <input
            type="number" min={0}
            value={(filters[minKey] as number) || ""}
            onChange={(e) => set(minKey, parseFloat(e.target.value) || 0)}
            placeholder="Min"
            className={`input-field h-9 text-sm w-full ${prefix ? "pl-5" : ""}`}
          />
        </div>
        <span className="text-txt-3 text-xs">–</span>
        <div className="relative flex-1">
          {prefix && <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-txt-3 text-xs pointer-events-none">{prefix}</span>}
          <input
            type="number" min={0}
            value={(filters[maxKey] as number) || ""}
            onChange={(e) => set(maxKey, parseFloat(e.target.value) || 0)}
            placeholder="Max"
            className={`input-field h-9 text-sm w-full ${prefix ? "pl-5" : ""}${suffix ? " pr-7" : ""}`}
          />
          {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-3 text-xs pointer-events-none">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function ToggleGroup({ label, options, value, onChange }: {
  label: string;
  options: { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-txt-2 mb-1.5">{label}</p>
      <div className="flex gap-1.5 flex-wrap">
        {options.map(({ v, l }) => (
          <button
            key={v}
            onClick={() => onChange(value === v ? "" : v)}
            className={`px-3 h-9 rounded-lg text-sm font-medium border transition-colors ${
              value === v
                ? "bg-orange text-white border-orange"
                : "bg-white text-txt-2 border-bd hover:border-orange-border hover:text-orange"
            }`}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  const [importQuery, setImportQuery] = useState("");
  const [importing, setImporting] = useState(false);
  const [dbCount, setDbCount] = useState<number | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const PAGE_SIZE = 50;

  useEffect(() => {
    loadTrackedIds();
    // Check how many products are already in the DB
    fetch("/api/products?limit=1")
      .then((r) => r.json())
      .then((d) => setDbCount(d.total ?? 0))
      .catch(() => {});
  }, []);

  async function loadTrackedIds() {
    try {
      const res = await fetch("/api/tracker");
      if (res.ok) {
        const data = await res.json();
        setTrackedIds(new Set<string>(data.trackedProducts.map((tp: { productId: string }) => tp.productId)));
      }
    } catch { /* not signed in */ }
  }

  async function importProducts() {
    if (!importQuery.trim()) return;
    setImporting(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: importQuery.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Import failed", "error"); return; }
      const count = data.products?.length ?? 0;
      setDbCount((prev) => (prev ?? 0) + count);
      setImportQuery("");
      showToast(
        data.cached
          ? `Already have ${count} products for that niche`
          : `Imported ${count} products into your database`,
        "success"
      );
    } catch {
      showToast("Import failed — check your connection", "error");
    } finally {
      setImporting(false);
    }
  }

  function set(key: keyof FilterState, value: string | number) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function applyPreset(preset: Preset) {
    const isActive = Object.entries(preset.filters).every(
      ([k, v]) => filters[k as keyof FilterState] === v
    );
    setFilters(isActive ? EMPTY_FILTERS : { ...EMPTY_FILTERS, ...preset.filters });
  }

  function handleSort(field: SortField) {
    const newDir: "asc" | "desc" = filters.sortBy === field && filters.sortDir === "desc" ? "asc" : "desc";
    const next: FilterState = { ...filters, sortBy: field, sortDir: newDir };
    setFilters(next);
    if (hasQueried) fetchProducts(next);
  }

  async function fetchProducts(f: FilterState = filters) {
    setLoading(true);
    setPage(1);
    try {
      const p = new URLSearchParams();
      if (f.category)      p.set("category", f.category);
      if (f.competition)   p.set("competition", f.competition);
      if (f.trend)         p.set("trend", f.trend);
      if (f.minScore > 0)  p.set("minScore", String(f.minScore));
      if (f.maxScore > 0)  p.set("maxScore", String(f.maxScore));
      if (f.minRevenue > 0) p.set("minRevenue", String(f.minRevenue));
      if (f.maxRevenue > 0) p.set("maxRevenue", String(f.maxRevenue));
      if (f.minBSR > 0)    p.set("minBSR", String(f.minBSR));
      if (f.maxBSR > 0)    p.set("maxBSR", String(f.maxBSR));
      if (f.minPrice > 0)  p.set("minPrice", String(f.minPrice));
      if (f.maxPrice > 0)  p.set("maxPrice", String(f.maxPrice));
      if (f.maxReviews > 0) p.set("maxReviews", String(f.maxReviews));
      if (f.minMargin > 0) p.set("minMargin", String(f.minMargin));
      p.set("sortBy", f.sortBy);
      p.set("sortDir", f.sortDir);
      p.set("limit", "100");

      const res = await fetch(`/api/products?${p}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setProducts(data.products ?? []);
      setTotal(data.total ?? 0);
      setHasQueried(true);
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleTrack(productId: string) {
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (res.ok) {
        setTrackedIds((prev) => new Set([...prev, productId]));
        showToast("Added to tracker!", "success");
      } else if (res.status === 409) {
        showToast("Already in your tracker", "info");
      } else {
        showToast("Sign in to track products", "error");
      }
    } catch { showToast("Failed to track product", "error"); }
  }

  function showToast(message: string, type: "success" | "error" | "info") {
    setToast({ message, type });
  }

  const activePreset = PRESETS.find((p) =>
    Object.entries(p.filters).every(([k, v]) => filters[k as keyof FilterState] === v)
  );

  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginated = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const active = hasActiveFilters(filters);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-txt">Product Research</h1>
        <p className="text-txt-2 text-sm mt-0.5">
          {hasQueried
            ? `${products.length}${total && total > products.length ? ` of ${total}` : ""} products · ranked by SellerScore`
            : "Set your criteria below to discover winning products"}
        </p>
      </div>

      {/* ── Import banner (shown while DB is empty or being built) ── */}
      {dbCount !== null && dbCount < 20 && (
        <div className="bg-amber-light border border-amber-border rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">📥</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-txt text-sm">
                {dbCount === 0 ? "Your product database is empty" : `Only ${dbCount} products in your database`}
              </p>
              <p className="text-txt-2 text-xs mt-0.5 mb-3">
                Enter a niche keyword to fetch real Amazon products into your database. Do this a few times to build up inventory you can filter through.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importQuery}
                  onChange={(e) => setImportQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && importProducts()}
                  placeholder='e.g. "bamboo lunch box", "dog slow feeder"'
                  className="input-field h-9 text-sm flex-1"
                  disabled={importing}
                />
                <button
                  onClick={importProducts}
                  disabled={importing || !importQuery.trim()}
                  className="btn-primary h-9 px-4 text-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {importing ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Importing…
                    </>
                  ) : "Import"}
                </button>
              </div>
              <p className="text-xs text-txt-3 mt-2">
                Suggested niches: bamboo lunch box · dog slow feeder · yoga blocks · posture corrector · desk organizer
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter panel ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-bd mb-5 overflow-hidden">

        {/* Presets */}
        <div className="px-5 pt-4 pb-3 border-b border-bd">
          <p className="text-xs font-semibold text-txt-3 uppercase tracking-wider mb-2.5">Start with a preset</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const on = Object.entries(preset.filters).every(
                ([k, v]) => filters[k as keyof FilterState] === v
              );
              return (
                <button
                  key={preset.label}
                  onClick={() => applyPreset(preset)}
                  title={preset.tip}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold border transition-all ${
                    on
                      ? "bg-orange text-white border-orange shadow-sm"
                      : "bg-bg text-txt-2 border-bd hover:border-orange-border hover:text-orange hover:bg-orange-light"
                  }`}
                >
                  <span>{preset.icon}</span> {preset.label}
                </button>
              );
            })}
            {active && (
              <button
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="ml-auto text-xs text-txt-3 hover:text-red transition-colors flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Reset all
              </button>
            )}
          </div>
        </div>

        {/* Main filters grid */}
        <div className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-4">

          {/* Category */}
          <div>
            <p className="text-xs font-semibold text-txt-2 mb-1.5">Category</p>
            <select
              value={filters.category}
              onChange={(e) => set("category", e.target.value)}
              className="input-field h-9 text-sm w-full"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Competition */}
          <ToggleGroup
            label="Competition"
            value={filters.competition}
            onChange={(v) => set("competition", v)}
            options={[{ v: "Low", l: "Low" }, { v: "Medium", l: "Medium" }, { v: "High", l: "High" }]}
          />

          {/* BSR Trend */}
          <ToggleGroup
            label="BSR Trend"
            value={filters.trend}
            onChange={(v) => set("trend", v)}
            options={[{ v: "up", l: "↑ Improving" }, { v: "flat", l: "→ Stable" }, { v: "down", l: "↓ Declining" }]}
          />

          {/* Revenue */}
          <RangeRow label="Monthly Revenue" minKey="minRevenue" maxKey="maxRevenue" filters={filters} set={set} prefix="$" />

          {/* Price */}
          <RangeRow label="Selling Price" minKey="minPrice" maxKey="maxPrice" filters={filters} set={set} prefix="$" />

          {/* BSR */}
          <RangeRow label="Best Seller Rank" minKey="minBSR" maxKey="maxBSR" filters={filters} set={set} />

          {/* Reviews */}
          <div>
            <p className="text-xs font-semibold text-txt-2 mb-1.5">Max Reviews</p>
            <input
              type="number" min={0}
              value={filters.maxReviews || ""}
              onChange={(e) => set("maxReviews", parseInt(e.target.value) || 0)}
              placeholder="e.g. 300"
              className="input-field h-9 text-sm w-full"
            />
          </div>

          {/* SellerScore */}
          <RangeRow label="SellerScore" minKey="minScore" maxKey="maxScore" filters={filters} set={set} />

          {/* Margin */}
          <div>
            <p className="text-xs font-semibold text-txt-2 mb-1.5">Min Margin</p>
            <div className="relative">
              <input
                type="number" min={0} max={100}
                value={filters.minMargin || ""}
                onChange={(e) => set("minMargin", parseInt(e.target.value) || 0)}
                placeholder="e.g. 30"
                className="input-field h-9 text-sm w-full pr-7"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-txt-3 text-xs pointer-events-none">%</span>
            </div>
          </div>
        </div>

        {/* Find Products button */}
        <div className="px-5 py-4 border-t border-bd bg-bg/40 flex items-center gap-3">
          <button
            onClick={() => fetchProducts()}
            disabled={loading}
            className="btn-primary h-10 px-8 text-sm font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Finding products…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
                </svg>
                Find Products
              </>
            )}
          </button>
          {activePreset && (
            <p className="text-xs text-txt-3">
              {activePreset.icon} <span className="font-medium text-txt-2">{activePreset.label}</span> — {activePreset.tip}
            </p>
          )}
        </div>
      </div>

      {/* ── Results ─────────────────────────────────────────────────────── */}
      {!hasQueried && !loading && (
        <div className="text-center py-16 text-txt-3">
          <div className="w-12 h-12 bg-bg-2 rounded-xl flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-txt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
            </svg>
          </div>
          <p className="font-medium text-txt-2">Set your criteria and click Find Products</p>
          <p className="text-sm mt-1">Or pick a preset above to get started instantly</p>
        </div>
      )}

      {hasQueried && !loading && (
        <>
          {products.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-bd">
              <p className="text-txt-2 font-semibold">No products match your filters</p>
              <p className="text-txt-3 text-sm mt-1">Try loosening the criteria or resetting all filters</p>
              <button onClick={() => setFilters(EMPTY_FILTERS)} className="mt-3 text-orange text-sm hover:underline">
                Reset filters
              </button>
            </div>
          ) : (
            <>
              {/* Results toolbar */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-txt-3">
                  <span className="font-semibold text-txt">{products.length}</span> products found
                  {total && total > products.length ? `, showing top ${products.length}` : ""}
                </p>
                <div className="flex items-center bg-bg-2 rounded-lg p-0.5 border border-bd">
                  <button onClick={() => setViewMode("table")} className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-orange" : "text-txt-3 hover:text-txt"}`} title="Table view">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                    </svg>
                  </button>
                  <button onClick={() => setViewMode("cards")} className={`p-1.5 rounded-md transition-colors ${viewMode === "cards" ? "bg-white shadow-sm text-orange" : "text-txt-3 hover:text-txt"}`} title="Card view">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                    </svg>
                  </button>
                </div>
              </div>

              <ProductTable
                products={paginated}
                onRowClick={setSelectedProduct}
                trackedIds={trackedIds}
                selectedIds={selectedIds}
                onSelectAll={(checked) =>
                  setSelectedIds(checked ? new Set(paginated.map((p) => p.id)) : new Set())
                }
                onSelectOne={(id, checked) => {
                  const next = new Set(selectedIds);
                  checked ? next.add(id) : next.delete(id);
                  setSelectedIds(next);
                }}
                viewMode={viewMode}
                sortBy={filters.sortBy}
                sortDir={filters.sortDir}
                onSort={handleSort}
              />

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-txt-3">
                    Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, products.length)} of {products.length}
                  </p>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                      className="p-2 rounded-lg border border-bd hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                      </svg>
                    </button>
                    {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                      <button key={p} onClick={() => setPage(p)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === page ? "bg-orange text-white" : "border border-bd hover:bg-bg-2 text-txt-2"}`}>
                        {p}
                      </button>
                    ))}
                    <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                      className="p-2 rounded-lg border border-bd hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <ProductDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onTrack={handleTrack}
        isTracked={selectedProduct ? trackedIds.has(selectedProduct.id) : false}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
