"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import { useMarketplace } from "@/components/MarketplaceContext";
import { MARKETPLACES } from "@/lib/marketplaces";

export default function TopNav() {
  const { data: session } = useSession();
  const { marketplace, setMarketplace } = useMarketplace();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);

  const initials = session?.user?.name
    ? session.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : session?.user?.email?.[0]?.toUpperCase() || "U";

  return (
    <header className="bg-white border-b border-bd sticky top-0 z-30 h-14">
      <div className="flex items-center h-full px-4 gap-4">
        {/* Logo */}
        <Link href="/products" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 bg-orange rounded-lg flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
              <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white"/>
            </svg>
          </div>
          <span className="font-bold text-txt hidden sm:block">SellerPulse</span>
        </Link>

        {/* Marketplace selector */}
        <div className="relative">
          <button
            onClick={() => setMarketplaceOpen(!marketplaceOpen)}
            className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-bd bg-bg hover:bg-bg-2 hover:border-orange-border transition-colors text-sm font-medium text-txt-2"
          >
            <span className="text-base leading-none">{marketplace.flag}</span>
            <span className="hidden sm:block">{marketplace.name}</span>
            <span className="sm:hidden font-semibold">{marketplace.id}</span>
            <svg className="w-3.5 h-3.5 text-txt-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
            </svg>
          </button>

          {marketplaceOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMarketplaceOpen(false)} />
              <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl border border-bd shadow-lg z-20 py-1 max-h-72 overflow-y-auto">
                {MARKETPLACES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => { setMarketplace(m); setMarketplaceOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2.5 transition-colors ${
                      m.id === marketplace.id
                        ? "bg-orange-light text-orange font-semibold"
                        : "text-txt-2 hover:bg-bg hover:text-txt"
                    }`}
                  >
                    <span className="text-base">{m.flag}</span>
                    <span className="flex-1">{m.name}</span>
                    <span className="text-xs text-txt-3">{m.currency}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2 ml-auto">
          {/* Upgrade button */}
          {session?.user?.plan === "starter" && (
            <button className="hidden sm:flex items-center gap-1.5 bg-orange text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-orange-hover transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18"/>
              </svg>
              Upgrade Plan
            </button>
          )}

          {/* User avatar */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-8 h-8 bg-orange rounded-full flex items-center justify-center text-white text-sm font-bold hover:bg-orange-hover transition-colors"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-bd shadow-lg z-20 py-1">
                  <div className="px-4 py-2 border-b border-bd">
                    <p className="text-sm font-semibold text-txt truncate">{session?.user?.name || "User"}</p>
                    <p className="text-xs text-txt-3 truncate">{session?.user?.email}</p>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                      session?.user?.plan === "pro"
                        ? "bg-orange-light text-orange border border-orange-border"
                        : "bg-bg-2 text-txt-2 border border-bd"
                    }`}>
                      {session?.user?.plan === "pro" ? "Pro Plan" : "Starter Plan"}
                    </span>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="w-full text-left px-4 py-2 text-sm text-txt-2 hover:bg-bg hover:text-txt transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
