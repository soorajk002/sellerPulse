"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

const navItems = [
  {
    href: "/products",
    label: "Products",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
      </svg>
    ),
  },
  {
    href: "/keywords",
    label: "Keywords",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
      </svg>
    ),
  },
  {
    href: "/tracker",
    label: "Tracker",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
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
  {
    href: "/insights",
    label: "AI Insights",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const plan = session?.user?.plan || "starter";
  const isPro = plan === "pro";

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-bd h-full flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
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
