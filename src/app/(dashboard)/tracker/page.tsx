"use client";

import { useState, useEffect, useCallback } from "react";
import { TrackedProduct, Product } from "@/types";
import TrackerList from "@/components/TrackerList";
import ProductDrawer from "@/components/ProductDrawer";
import StatRow from "@/components/StatRow";
import Toast from "@/components/Toast";

export default function TrackerPage() {
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const fetchTracked = useCallback(async () => {
    try {
      const res = await fetch("/api/tracker");
      if (res.ok) {
        const data = await res.json();
        setTrackedProducts(data.trackedProducts || []);
      }
    } catch {
      setToast({ message: "Failed to load tracked products", type: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracked();
  }, [fetchTracked]);

  async function handleRemove(productId: string) {
    try {
      const res = await fetch("/api/tracker", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (res.ok) {
        setTrackedProducts((prev) => prev.filter((tp) => tp.productId !== productId));
        setToast({ message: "Product removed from tracker", type: "info" });
      }
    } catch {
      setToast({ message: "Failed to remove product", type: "error" });
    }
  }

  function handleView(tp: TrackedProduct) {
    setSelectedProduct(tp.product);
  }

  const trackedIds = new Set(trackedProducts.map((tp) => tp.productId));

  // Stats
  const avgScore = trackedProducts.length > 0
    ? (trackedProducts.reduce((sum, tp) => sum + tp.product.score, 0) / trackedProducts.length).toFixed(1)
    : "–";

  const improving = trackedProducts.filter((tp) => tp.product.trend === "up").length;

  const alerts = trackedProducts.filter((tp) => tp.product.trend === "down").length;

  const stats = [
    { label: "Products Tracked", value: trackedProducts.length, icon: "📦" },
    { label: "Avg Score", value: avgScore, icon: "⭐" },
    { label: "BSR Improving", value: `${improving} products`, icon: "📈", trend: improving > 0 ? "up" as const : undefined },
    { label: "Alerts", value: alerts > 0 ? `${alerts} declining` : "None", icon: "🔔", trend: alerts > 0 ? "down" as const : undefined },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-txt">Product Tracker</h1>
          <p className="text-txt-2 text-sm mt-0.5">
            Monitor your shortlisted products
          </p>
        </div>
      </div>

      {/* Stats */}
      <StatRow stats={stats} />

      {/* Tracked Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-orange" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            <p className="text-txt-2 text-sm">Loading tracked products...</p>
          </div>
        </div>
      ) : (
        <TrackerList
          trackedProducts={trackedProducts}
          onRemove={handleRemove}
          onView={handleView}
        />
      )}

      {/* Product Drawer */}
      <ProductDrawer
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onTrack={() => {}}
        isTracked={selectedProduct ? trackedIds.has(selectedProduct.id) : false}
      />

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
