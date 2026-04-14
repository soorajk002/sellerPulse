"use client";

import { useState, useEffect, useCallback } from "react";
import { Product, FilterState } from "@/types";
import FilterBar from "@/components/FilterBar";
import ProductTable from "@/components/ProductTable";
import ProductDrawer from "@/components/ProductDrawer";
import Toast from "@/components/Toast";
import StatRow from "@/components/StatRow";
import { formatRevenue, formatNumber } from "@/lib/utils";

const PAGE_SIZE = 10;

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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

  const fetchTracked = useCallback(async () => {
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
      // Not authenticated or error — no tracked products
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("q", filters.search);
      if (filters.category) params.set("category", filters.category);
      if (filters.minScore > 0) params.set("minScore", filters.minScore.toString());
      if (filters.competition) params.set("competition", filters.competition);
      if (filters.minRevenue > 0) params.set("minRevenue", filters.minRevenue.toString());
      if (filters.maxRevenue > 0) params.set("maxRevenue", filters.maxRevenue.toString());
      if (filters.maxReviews > 0) params.set("maxReviews", filters.maxReviews.toString());

      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setCurrentPage(1);
    } catch {
      setToast({ message: "Failed to load products", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchTracked();
  }, [fetchTracked]);

  async function handleTrack(productId: string) {
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        setTrackedIds((prev) => new Set([...prev, productId]));
        setToast({ message: "Product added to tracker!", type: "success" });
      } else if (res.status === 409) {
        setToast({ message: "Product already in tracker", type: "info" });
      } else if (res.status === 401) {
        setToast({ message: "Please sign in to track products", type: "error" });
      } else {
        setToast({ message: "Failed to track product", type: "error" });
      }
    } catch {
      setToast({ message: "Failed to track product", type: "error" });
    }
  }

  // Unique categories
  const categories = [...new Set(products.map((p) => p.category))].sort();

  // Pagination
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const paginated = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Stats
  const avgScore = products.length > 0
    ? (products.reduce((sum, p) => sum + p.score, 0) / products.length).toFixed(1)
    : "0";
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  const lowCompCount = products.filter((p) => p.competition === "Low").length;

  const stats = [
    { label: "Products Found", value: products.length, icon: "📦" },
    { label: "Avg Score", value: avgScore, icon: "⭐", trend: "up" as const },
    { label: "Total Revenue", value: formatRevenue(totalRevenue), sub: "combined monthly", icon: "💰" },
    { label: "Low Competition", value: `${lowCompCount} of ${products.length}`, icon: "🎯" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-txt">Product Research</h1>
          <p className="text-txt-2 text-sm mt-0.5">
            {loading ? "Loading..." : `${products.length} products • Sorted by SellerScore`}
          </p>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Stats */}
      <StatRow stats={stats} />

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        categories={categories}
      />

      {/* Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-orange" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-txt-2 text-sm">Loading products...</p>
          </div>
        </div>
      ) : (
        <>
          <ProductTable
            products={paginated}
            onRowClick={setSelectedProduct}
            trackedIds={trackedIds}
            selectedIds={selectedIds}
            onSelectAll={(checked) => {
              if (checked) {
                setSelectedIds(new Set(paginated.map((p) => p.id)));
              } else {
                setSelectedIds(new Set());
              }
            }}
            onSelectOne={(id, checked) => {
              const next = new Set(selectedIds);
              if (checked) next.add(id);
              else next.delete(id);
              setSelectedIds(next);
            }}
            viewMode={viewMode}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-txt-3">
                Showing {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, products.length)} of {products.length} products
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

      {/* Product Drawer */}
      <ProductDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onTrack={handleTrack}
        isTracked={selectedProduct ? trackedIds.has(selectedProduct.id) : false}
      />

      {/* Toast */}
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
