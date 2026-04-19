"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Marketplace {
  id: string;
  label: string;
  domain: string;
  currency: string;
  flag: string;
}

export const MARKETPLACES: Marketplace[] = [
  { id: "US", label: "Amazon.com",    domain: "amazon.com",    currency: "$",   flag: "🇺🇸" },
  { id: "UK", label: "Amazon.co.uk",  domain: "amazon.co.uk",  currency: "£",   flag: "🇬🇧" },
  { id: "CA", label: "Amazon.ca",     domain: "amazon.ca",     currency: "CA$", flag: "🇨🇦" },
  { id: "DE", label: "Amazon.de",     domain: "amazon.de",     currency: "€",   flag: "🇩🇪" },
  { id: "FR", label: "Amazon.fr",     domain: "amazon.fr",     currency: "€",   flag: "🇫🇷" },
  { id: "IT", label: "Amazon.it",     domain: "amazon.it",     currency: "€",   flag: "🇮🇹" },
  { id: "ES", label: "Amazon.es",     domain: "amazon.es",     currency: "€",   flag: "🇪🇸" },
  { id: "JP", label: "Amazon.co.jp",  domain: "amazon.co.jp",  currency: "¥",   flag: "🇯🇵" },
  { id: "AU", label: "Amazon.com.au", domain: "amazon.com.au", currency: "A$",  flag: "🇦🇺" },
  { id: "IN", label: "Amazon.in",     domain: "amazon.in",     currency: "₹",   flag: "🇮🇳" },
];

interface MarketplaceContextValue {
  marketplace: Marketplace;
  setMarketplace: (m: Marketplace) => void;
  currency: string;
}

const MarketplaceContext = createContext<MarketplaceContextValue>({
  marketplace: MARKETPLACES[0],
  setMarketplace: () => {},
  currency: "$",
});

export function MarketplaceProvider({ children }: { children: ReactNode }) {
  const [marketplace, setMarketplace] = useState<Marketplace>(MARKETPLACES[0]);

  return (
    <MarketplaceContext.Provider value={{ marketplace, setMarketplace, currency: marketplace.currency }}>
      {children}
    </MarketplaceContext.Provider>
  );
}

export function useMarketplace() {
  return useContext(MarketplaceContext);
}
