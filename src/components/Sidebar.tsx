"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navItems = [
  {
    href: "/products",
    label: "Product Research",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
      </svg>
    ),
  },
  {
    href: "/calculator",
    label: "Profit Calculator",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z"/>
      </svg>
    ),
  },
];

const comingSoonItems = [
  { label: "Keyword Research", icon: "🔍" },
  { label: "Rank Tracker", icon: "📈" },
  { label: "AI Insights", icon: "🤖" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const plan = session?.user?.plan || "starter";
  const isPro = plan === "pro";

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-bd h-full flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
        {/* Active nav items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-orange-light text-orange border border-orange-border"
                  : "text-txt-2 hover:text-txt hover:bg-bg"
              }`}
            >
              <span className={isActive ? "text-orange" : "text-txt-3"}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* Coming soon */}
        <div className="pt-3 mt-3 border-t border-bd">
          <p className="px-3 mb-2 text-xs font-semibold text-txt-3 uppercase tracking-wider">Coming Soon</p>
          {comingSoonItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-txt-3 cursor-not-allowed select-none"
            >
              <div className="flex items-center gap-3 opacity-50">
                <span>{item.icon}</span>
                {item.label}
              </div>
              <span className="text-xs font-medium bg-bg-2 text-txt-3 border border-bd px-1.5 py-0.5 rounded-full">Soon</span>
            </div>
          ))}
        </div>
      </nav>

      {/* Plan widget */}
      <div className="p-3 border-t border-bd">
        <div className={`rounded-xl p-3 ${isPro ? "bg-orange-light border border-orange-border" : "bg-bg-2 border border-bd"}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{isPro ? "🚀" : "⚡"}</span>
            <span className={`text-xs font-bold uppercase ${isPro ? "text-orange" : "text-txt-2"}`}>
              {isPro ? "Pro Plan" : "Starter Plan"}
            </span>
          </div>

          {!isPro && (
            <>
              <div className="mb-2">
                <div className="flex justify-between text-xs text-txt-3 mb-1">
                  <span>Searches used</span>
                  <span className="font-medium">5 / 20</span>
                </div>
                <div className="h-1.5 bg-bg rounded-full">
                  <div className="h-1.5 bg-orange rounded-full" style={{ width: "25%" }}/>
                </div>
              </div>
              <button className="w-full text-xs font-semibold bg-orange text-white py-1.5 rounded-lg hover:bg-orange-hover transition-colors">
                Upgrade to Pro →
              </button>
            </>
          )}

          {isPro && (
            <div className="text-xs text-txt-2">
              <p className="font-medium">Unlimited searches</p>
              <p className="text-txt-3 mt-0.5">All features unlocked</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
