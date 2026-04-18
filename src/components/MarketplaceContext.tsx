"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Marketplace, MARKETPLACES, DEFAULT_MARKETPLACE } from "@/lib/marketplaces";

interface MarketplaceContextType {
  marketplace: Marketplace;
  setMarketplace: (m: Marketplace) => void;
}

const MarketplaceContext = createContext<MarketplaceContextType>({
  marketplace: DEFAULT_MARKETPLACE,
  setMarketplace: () => {},
});

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [marketplace, setMarketplaceState] = useState<Marketplace>(DEFAULT_MARKETPLACE);

  useEffect(() => {
    const saved = localStorage.getItem("marketplace");
    if (saved) {
      const found = MARKETPLACES.find((m) => m.id === saved);
      if (found) setMarketplaceState(found);
    }
  }, []);

  function setMarketplace(m: Marketplace) {
    setMarketplaceState(m);
    localStorage.setItem("marketplace", m.id);
  }

  return (
    <MarketplaceContext.Provider value={{ marketplace, setMarketplace }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  return useContext(MarketplaceContext);
}
