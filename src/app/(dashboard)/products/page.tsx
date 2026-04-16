"use client";

import { useState, useEffect, useRef } from "react";
import { Product, FilterState } from "@/types";
import ProductTable from "@/components/ProductTable";
import ProductDrawer from "@/components/ProductDrawer";
import Toast from "@/components/Toast";

const PAGE_SIZE = 10;

const SUGGESTED_SEARCHES = [
  "bamboo lunch box",
  "dog slow feeder",
  "silicone baking mat",
  "posture corrector",
  "desk cable organizer",
  "yoga blocks",
  "water bottle with straw",
  "cat toy interactive",
];

const EMPTY_FILTERS: FilterState = {
  search: "",
  category: "",
  minRevenue: 0,
  maxRevenue: 0,
  minScore: 0,
  competition: "",
  maxReviews: 0,
};

export default function ProductsPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searching, setSearching] = useState(false);
  const [cachedResult, setCachedResult] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [trackedIds, setTrackedIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [currentPage, setCurrentPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTrackedIds();
    searchInputRef.current?.focus();
  }, []);

  async function loadTrackedIds() {
    try {
      const res = await fetch("/api/tracker");
      if (res.ok) {
        const data = await res.json();
        setTrackedIds(new Set<string>(
          data.trackedProducts.map((tp: { productId: string }) => tp.productId)
        ));
      }
    } catch { /* not signed in */ }
  }

  async function handleSearch(query?: string) {
    const q = (query ?? searchQuery).trim();
    if (!q) {
      searchInputRef.current?.focus();
      return;
    }

    if (query) setSearchQuery(query);
    setSearching(true);
    setCurrentPage(1);
    setFilters(EMPTY_FILTERS);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Search failed", "error");
        return;
      }

      if (!data.products?.length) {
        showToast("No products found for that keyword", "info");
        setHasSearched(true);
        setAllProducts([]);
        setLastQuery(q);
        return;
      }

      setAllProducts(data.products);
      setHasSearched(true);
      setCachedResult(!!data.cached);
      setLastQuery(q);
    } catch {
      showToast("Search failed — check your connection", "error");
    } finally {
      setSearching(false);
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
      } else if (res.status === 401) {
        showToast("Sign in to track products", "error");
      } else {
        showToast("Failed to track product", "error");
      }
    } catch {
      showToast("Failed to track product", "error");
    }
  }

  function updateFilter(key: keyof FilterState, value: string | number) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }

  function resetFilters() {
    setFilters(EMPTY_FILTERS);
    setCurrentPage(1);
  }

  function newSearch() {
    setAllProducts([]);
    setHasSearched(false);
    setLastQuery("");
    setFilters(EMPTY_FILTERS);
    setSearchQuery("");
    setTimeout(() => searchInputRef.current?.focus(), 0);
  }

  function showToast(message: string, type: "success" | "error" | "info") {
    setToast({ message, type });
  }

  // Client-side filtering
  const filteredProducts = allProducts.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.minScore > 0 && p.score < filters.minScore) return false;
    if (filters.competition && p.competition !== filters.competition) return false;
    if (filters.minRevenue > 0 && p.revenue < filters.minRevenue) return false;
    if (filters.maxRevenue > 0 && p.revenue > filters.maxRevenue) return false;
    if (filters.maxReviews > 0 && p.reviews > filters.maxReviews) return false;
    return true;
  });

  const categories = [...new Set(allProducts.map((p) => p.category))].sort();
  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginated = filteredProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const hasFilters = filters.category || filters.minScore > 0 ||
    filters.competition || filters.minRevenue > 0 || filters.maxReviews > 0;

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-txt">Product Research</h1>
        <p className="text-txt-2 text-sm mt-0.5">
          {hasSearched && allProducts.length > 0
            ? `${allProducts.length} products for "${lastQuery}"${cachedResult ? " · cached" : " · live"} · ranked by SellerScore`
            : "Search any niche to find winning Amazon products"}
        </p>
      </div>

      {/* ── Search bar ── */}
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
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder='e.g. "bamboo lunch box", "dog slow feeder", "posture corrector"'
              className="input-field pl-9 pr-4 h-10 text-sm"
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
            onClick={() => handleSearch()}
            disabled={searching}
            className="btn-primary h-10 px-5 text-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {searching ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Searching…
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
          {hasSearched && (
            <button
              onClick={newSearch}
              className="h-10 px-3 text-sm text-txt-2 hover:text-txt border border-bd rounded-lg hover:bg-bg-2 transition-colors"
            >
              New search
            </button>
          )}
        </div>
      </div>

      {/* ── Empty state ── */}
      {!hasSearched && !searching && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-orange-light rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
          </div>
          <h2 className="text-lg font-bold text-txt mb-1">Find your next winning product</h2>
          <p className="text-txt-3 text-sm mb-6 max-w-md mx-auto">
            Enter any keyword to get real Amazon data — BSR history, estimated revenue, competition level, and a SellerScore ranking each opportunity.
          </p>

          {/* Suggested searches */}
          <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
            {SUGGESTED_SEARCHES.map((term) => (
              <button
                key={term}
                onClick={() => handleSearch(term)}
                className="px-3 py-1.5 text-sm bg-white border border-bd rounded-full text-txt-2 hover:text-orange hover:border-orange-border hover:bg-orange-light transition-colors"
              >
                {term}
              </button>
            ))}
          </div>

          <p className="text-xs text-txt-3 mt-8">
            Results cached for 24 hours · Powered by Rainforest + Keepa
          </p>
        </div>
      )}

      {/* ── Searching spinner ── */}
      {searching && (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <svg className="animate-spin h-10 w-10 text-orange" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <div className="text-center">
            <p className="text-txt-2 font-semibold">Searching Amazon for &ldquo;{searchQuery}&rdquo;…</p>
            <p className="text-txt-3 text-sm mt-1">Pulling live data from Rainforest + Keepa — usually 5–15s</p>
          </div>
        </div>
      )}

      {/* ── Results ── */}
      {hasSearched && !searching && (
        <>
          {allProducts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-2xl mb-2">🔍</p>
              <p className="text-txt-2 font-semibold">No products found</p>
              <p className="text-txt-3 text-sm mt-1">Try a different keyword or check the spelling</p>
            </div>
          ) : (
            <>
              {/* Filter bar — only shown when results exist */}
              <div className="bg-white rounded-xl border border-bd px-4 py-3 mb-4 flex flex-wrap items-center gap-2">
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="input-field h-8 text-xs w-auto"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select
                  value={filters.competition}
                  onChange={(e) => updateFilter("competition", e.target.value)}
                  className="input-field h-8 text-xs w-auto"
                >
                  <option value="">Any Competition</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>

                <select
                  value={filters.minScore}
                  onChange={(e) => updateFilter("minScore", parseFloat(e.target.value))}
                  className="input-field h-8 text-xs w-auto"
                >
                  <option value={0}>Any Score</option>
                  <option value={7}>Score 7+</option>
                  <option value={8}>Score 8+</option>
                  <option value={8.5}>Score 8.5+</option>
                  <option value={9}>Score 9+</option>
                </select>

                <select
                  value={filters.minRevenue}
                  onChange={(e) => updateFilter("minRevenue", parseInt(e.target.value))}
                  className="input-field h-8 text-xs w-auto"
                >
                  <option value={0}>Any Revenue</option>
                  <option value={2000}>$2k+/mo</option>
                  <option value={3000}>$3k+/mo</option>
                  <option value={5000}>$5k+/mo</option>
                  <option value={7000}>$7k+/mo</option>
                </select>

                <select
                  value={filters.maxReviews}
                  onChange={(e) => updateFilter("maxReviews", parseInt(e.target.value))}
                  className="input-field h-8 text-xs w-auto"
                >
                  <option value={0}>Any Reviews</option>
                  <option value={100}>Under 100</option>
                  <option value={200}>Under 200</option>
                  <option value={500}>Under 500</option>
                </select>

                {hasFilters && (
                  <button
                    onClick={resetFilters}
                    className="h-8 px-2.5 text-xs text-txt-2 hover:text-txt border border-bd rounded-lg hover:bg-bg-2 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                    Reset
                  </button>
                )}

                <div className="flex-1" />

                <span className="text-xs text-txt-3 whitespace-nowrap">
                  {filteredProducts.length} of {allProducts.length}
                </span>

                <div className="flex items-center bg-bg-2 rounded-lg p-0.5 border border-bd">
                  <button
                    onClick={() => setViewMode("table")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "table" ? "bg-white shadow-sm text-orange" : "text-txt-3 hover:text-txt"}`}
                    title="Table view"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "cards" ? "bg-white shadow-sm text-orange" : "text-txt-3 hover:text-txt"}`}
                    title="Card view"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"/>
                    </svg>
                  </button>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-txt-2 font-medium">No products match these filters</p>
                  <button onClick={resetFilters} className="text-orange text-sm mt-2 hover:underline">
                    Clear filters
                  </button>
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
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}
