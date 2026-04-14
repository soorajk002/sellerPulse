"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Product, FilterState } from "@/types";
import FilterBar from "@/components/FilterBar";
import ProductTable from "@/components/ProductTable";
import ProductDrawer from "@/components/ProductDrawer";
import Toast from "@/components/Toast";
import StatRow from "@/components/StatRow";
import { formatRevenue } from "@/lib/utils";

const PAGE_SIZE = 10;

type SearchMode = "demo" | "live";

export default function ProductsPage() {
  // ── Data state ─────────────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("demo");
  const [cachedResult, setCachedResult] = useState(false);

  // ── UI state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    category: "",
    minRevenue: 0,
    maxRevenue: 0,
    minScore: 0,
    competition: "",
    maxReviews: 0,
  });

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ── Load demo products + tracked ids on mount ──────────────────────────
  useEffect(() => {
    Promise.all([loadDemoProducts(), loadTrackedIds()]);
  }, []);

  async function loadDemoProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setAllProducts(data.products || []);
      setSearchMode("demo");
    } catch {
      showToast("Failed to load products", "error");
    } finally {
      setLoading(false);
    }
  }

  async function loadTrackedIds() {
    try {
      const res = await fetch("/api/tracker");
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>(
          data.trackedProducts.map((tp: { productId: string }) => tp.productId)
        );
        setTrackedIds(ids);
      }
    } catch {
      // unauthenticated or no tracked products
    }
  }

  // ── Real Amazon search ─────────────────────────────────────────────────
  async function handleSearch() {
    if (!searchQuery.trim()) {
      showToast("Enter a keyword to search Amazon", "info");
      searchInputRef.current?.focus();
      return;
    }

    setSearching(true);
    setCurrentPage(1);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Search failed", "error");
        return;
      }

      if (!data.products?.length) {
        showToast("No products found for that keyword", "info");
        return;
      }

      setAllProducts(data.products);
      setSearchMode("live");
      setCachedResult(!!data.cached);
      setFilters({
        search: "",
        category: "",
        minRevenue: 0,
        maxRevenue: 0,
        minScore: 0,
        competition: "",
        maxReviews: 0,
      });

      showToast(
        data.cached
          ? `✓ ${data.products.length} results (cached)`
          : `✓ Found ${data.products.length} products from Amazon`,
        "success"
      );
    } catch {
      showToast("Search failed — check your connection", "error");
    } finally {
      setSearching(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleSearch();
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchMode("demo");
    setCachedResult(false);
    loadDemoProducts();
    setFilters({ search: "", category: "", minRevenue: 0, maxRevenue: 0, minScore: 0, competition: "", maxReviews: 0 });
  }

  // ── Track product ──────────────────────────────────────────────────────
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
      } else if (res.status === 401) {
        showToast("Sign in to track products", "error");
      } else {
        showToast("Failed to track product", "error");
      }
    } catch {
      showToast("Failed to track product", "error");
    }
  }

  // ── Client-side filtering ──────────────────────────────────────────────
  const filtered = useCallback(() => {
    return allProducts.filter((p) => {
      const q = filters.search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) && !p.asin.toLowerCase().includes(q)) return false;
      if (filters.category && p.category !== filters.category) return false;
      if (filters.minScore > 0 && p.score < filters.minScore) return false;
      if (filters.competition && p.competition !== filters.competition) return false;
      if (filters.minRevenue > 0 && p.revenue < filters.minRevenue) return false;
      if (filters.maxRevenue > 0 && p.revenue > filters.maxRevenue) return false;
      if (filters.maxReviews > 0 && p.reviews > filters.maxReviews) return false;
      return true;
    });
  }, [allProducts, filters]);

  const filteredProducts = filtered();
  const categories = [...new Set(allProducts.map((p) => p.category))].sort();
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginated = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ── Stats ──────────────────────────────────────────────────────────────
  const avgScore = filteredProducts.length
    ? (filteredProducts.reduce((s, p) => s + p.score, 0) / filteredProducts.length).toFixed(1)
    : "0";
  const totalRevenue = filteredProducts.reduce((s, p) => s + p.revenue, 0);
  const lowComp = filteredProducts.filter((p) => p.competition === "Low").length;

  const stats = [
    { label: "Products Found", value: filteredProducts.length, icon: "📦" },
    { label: "Avg Score", value: avgScore, icon: "⭐", trend: "up" as const },
    { label: "Est. Combined Revenue", value: formatRevenue(totalRevenue), sub: "per month", icon: "💰" },
    { label: "Low Competition", value: `${lowComp} / ${filteredProducts.length}`, icon: "🎯" },
  ];

  function showToast(message: string, type: "success" | "error" | "info") {
    setToast({ message, type });
  }

  function handleFiltersChange(next: FilterState) {
    setFilters(next);
    setCurrentPage(1);
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-txt">Product Research</h1>
          <p className="text-txt-2 text-sm mt-0.5">
            {searchMode === "live"
              ? `Live Amazon data${cachedResult ? " (cached)" : ""} · sorted by SellerScore`
              : "Demo data · search Amazon to get live results"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Live / Demo badge */}
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            searchMode === "live"
              ? "bg-green-light text-green border-green-border"
              : "bg-bg-2 text-txt-3 border-bd"
          }`}>
            {searchMode === "live" ? "🟢 Live" : "⚪ Demo"}
          </span>

          {/* View toggle */}
          <div className="flex items-center bg-bg-2 rounded-lg p-0.5 border border-bd">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-orange" : "text-txt-3 hover:text-txt"}`}
              title="Table view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`p-1.5 rounded-md transition-colors ${viewMode === "cards" ? "bg-white shadow-sm text-orange" : "text-txt-3 hover:text-txt"}`}
              title="Card view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ── Amazon Search Bar ── */}
      <div className="bg-white rounded-xl border border-bd p-4 mb-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-3 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder='Search Amazon — e.g. "bamboo lunch box" or "dog slow feeder"'
              className="input-field pl-9 pr-4 h-11 text-base"
              disabled={searching}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-txt-3 hover:text-txt"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="btn-primary h-11 px-6 text-base disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 min-w-40 justify-center"
          >
            {searching ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Searching...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
                </svg>
                Search Amazon
              </>
            )}
          </button>
          {searchMode === "live" && (
            <button
              onClick={clearSearch}
              className="h-11 px-4 text-sm text-txt-2 hover:text-txt border border-bd rounded-lg hover:bg-bg-2 transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4l16 16M4 20L20 4"/>
              </svg>
              Clear
            </button>
          )}
        </div>
        <p className="text-xs text-txt-3 mt-2 ml-1">
          Results are cached for 24h to save API credits · Powered by Rainforest + Keepa
        </p>
      </div>

      {/* ── Stats ── */}
      <StatRow stats={stats} />

      {/* ── Filter bar ── */}
      <FilterBar
        filters={filters}
        onChange={handleFiltersChange}
        categories={categories}
      />

      {/* ── Results ── */}
      {loading || searching ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <svg className="animate-spin h-10 w-10 text-orange" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <div className="text-center">
            <p className="text-txt-2 font-semibold">
              {searching ? "Searching Amazon…" : "Loading products…"}
            </p>
            {searching && (
              <p className="text-txt-3 text-sm mt-1">
                Fetching live data from Rainforest + Keepa — this takes 5–15s
              </p>
            )}
          </div>
        </div>
      ) : (
        <>
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
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-txt-3">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filteredProducts.length)} of{" "}
                {filteredProducts.length} products
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-bd hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? "bg-orange text-white"
                        : "border border-bd hover:bg-bg-2 text-txt-2"
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-bd hover:bg-bg-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drawer + Toast */}
      <ProductDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onTrack={handleTrack}
        isTracked={selectedProduct ? trackedIds.has(selectedProduct.id) : false}
      />
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
