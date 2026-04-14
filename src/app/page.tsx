import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/products");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-bd bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange rounded-lg flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
                  <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white"/>
                </svg>
              </div>
              <span className="font-bold text-lg text-txt">SellerPulse</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-txt-2 hover:text-txt text-sm font-medium transition-colors">Features</a>
              <a href="#pricing" className="text-txt-2 hover:text-txt text-sm font-medium transition-colors">Pricing</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-txt-2 hover:text-txt text-sm font-medium transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-24 bg-gradient-to-b from-orange-light to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-light border border-orange-border rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-orange rounded-full animate-pulse"></span>
            <span className="text-orange text-sm font-semibold">Live Amazon Data Updated Daily</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-txt mb-6 leading-tight">
            Find Winning Amazon
            <br />
            <span className="text-orange">Products in Minutes</span>
          </h1>
          <p className="text-xl text-txt-2 max-w-2xl mx-auto mb-10">
            SellerPulse analyzes millions of Amazon listings to surface high-margin,
            low-competition products that are trending right now. Stop guessing, start selling.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary text-base px-8 py-3 inline-block">
              Start Free Trial — No Credit Card
            </Link>
            <Link href="/login" className="btn-secondary text-base px-8 py-3 inline-block">
              Sign In to Dashboard
            </Link>
          </div>
          <p className="mt-4 text-sm text-txt-3">20 free searches per month on Starter plan</p>

          {/* Hero preview card */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl border border-bd shadow-xl overflow-hidden">
              <div className="bg-bg-2 px-4 py-3 border-b border-bd flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red"></div>
                <div className="w-3 h-3 rounded-full bg-amber"></div>
                <div className="w-3 h-3 rounded-full bg-green"></div>
                <span className="ml-3 text-xs text-txt-3 font-mono">sellerpulse.app/products</span>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-txt text-lg">Top Products</h3>
                    <p className="text-txt-3 text-sm">15 results found</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-orange-light text-orange border border-orange-border px-3 py-1 rounded-full font-medium">All Categories</span>
                    <span className="text-xs bg-bg-2 text-txt-3 border border-bd px-3 py-1 rounded-full font-medium">Score: Any</span>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    { e: "🫙", n: "Bamboo Fiber Lunch Box Set with Lid", score: 9.1, revenue: "$8.2k", competition: "Low", trend: "↑" },
                    { e: "🐕", n: "Slow Feeder Dog Bowl Anti-Bloat", score: 8.9, revenue: "$7.3k", competition: "Low", trend: "↑" },
                    { e: "💪", n: "Resistance Bands Set 5 Levels Premium", score: 8.7, revenue: "$6.9k", competition: "Low", trend: "↑" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-bd hover:bg-bg transition-colors">
                      <span className="text-2xl">{p.e}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-txt text-sm truncate">{p.n}</p>
                        <p className="text-txt-3 text-xs mt-0.5">Revenue: {p.revenue}/mo</p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-center">
                          <div className="w-8 h-8 rounded-full border-2 border-green flex items-center justify-center">
                            <span className="text-green font-bold text-xs">{p.score}</span>
                          </div>
                        </div>
                        <span className="text-xs bg-green-light text-green border border-green-border px-2 py-0.5 rounded-full font-medium">{p.competition}</span>
                        <span className="text-green font-bold">{p.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-txt mb-4">Everything You Need to Win on Amazon</h2>
            <p className="text-xl text-txt-2 max-w-2xl mx-auto">
              From product discovery to profit calculation, SellerPulse has every tool a serious Amazon seller needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "📊",
                title: "Product Research",
                description: "Discover thousands of products ranked by our proprietary SellerScore algorithm. Filter by category, revenue, competition, and more.",
              },
              {
                icon: "🔍",
                title: "Keyword Intelligence",
                description: "Find high-volume, low-competition keywords your competitors are missing. See search volume, CPC, and difficulty at a glance.",
              },
              {
                icon: "📈",
                title: "Rank Tracker",
                description: "Monitor BSR trends and score changes for your tracked products. Get alerts when rankings improve or drop.",
              },
              {
                icon: "💰",
                title: "Profit Calculator",
                description: "Calculate exact FBA fees, referral fees, and net margins before you source. Know your profit before you invest.",
              },
              {
                icon: "🤖",
                title: "AI Market Insights",
                description: "Get AI-powered insights about market trends, seasonality, and emerging opportunities tailored to your niche.",
              },
              {
                icon: "⚡",
                title: "Real-Time Data",
                description: "Data updated daily from Amazon's marketplace. Never make decisions based on stale information again.",
              },
            ].map((feature, i) => (
              <div key={i} className="p-6 rounded-xl border border-bd hover:border-orange-border hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-orange-light rounded-xl flex items-center justify-center text-2xl mb-4">
                  {feature.icon}
                </div>
                <h3 className="font-bold text-txt text-lg mb-2">{feature.title}</h3>
                <p className="text-txt-2 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-bg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "15,000+", label: "Products Analyzed" },
              { value: "$2.4M", label: "Revenue Tracked" },
              { value: "98%", label: "Data Accuracy" },
              { value: "4,200+", label: "Active Sellers" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-orange mb-1">{stat.value}</div>
                <div className="text-txt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-txt mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-txt-2 max-w-xl mx-auto">
              Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Starter */}
            <div className="p-8 rounded-2xl border border-bd">
              <div className="mb-6">
                <h3 className="font-bold text-txt text-xl mb-1">Starter</h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-bold text-txt">$15</span>
                  <span className="text-txt-2 pb-1">/month</span>
                </div>
                <p className="text-txt-2 text-sm">Perfect for new sellers exploring Amazon FBA</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "20 product searches/month",
                  "Basic keyword data",
                  "5 tracked products",
                  "Profit calculator",
                  "Email support",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-txt-2">
                    <svg className="w-4 h-4 text-green flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn-secondary text-sm w-full text-center block">
                Start Free Trial
              </Link>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-2xl border-2 border-orange bg-orange-light relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-orange text-white text-xs font-bold px-3 py-1 rounded-full">MOST POPULAR</span>
              </div>
              <div className="mb-6">
                <h3 className="font-bold text-txt text-xl mb-1">Pro</h3>
                <div className="flex items-end gap-1 mb-3">
                  <span className="text-4xl font-bold text-txt">$49</span>
                  <span className="text-txt-2 pb-1">/month</span>
                </div>
                <p className="text-txt-2 text-sm">For serious sellers scaling their Amazon business</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited product searches",
                  "Advanced keyword intelligence",
                  "Unlimited tracked products",
                  "AI market insights",
                  "BSR trend alerts",
                  "Priority support",
                  "Export to CSV",
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-txt-2">
                    <svg className="w-4 h-4 text-orange flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="btn-primary text-sm w-full text-center block">
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-orange">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Find Your Next Winning Product?
          </h2>
          <p className="text-xl text-orange-light mb-8 opacity-90">
            Join 4,200+ Amazon sellers already using SellerPulse to find profitable products.
          </p>
          <Link href="/register" className="inline-block bg-white text-orange font-bold px-10 py-4 rounded-xl hover:bg-orange-light transition-colors text-lg">
            Start Free Trial Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-txt py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-orange rounded-lg flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/>
                  <path d="M8 5L11 6.75V10.25L8 12L5 10.25V6.75L8 5Z" fill="white"/>
                </svg>
              </div>
              <span className="font-bold text-white">SellerPulse</span>
            </div>
            <p className="text-txt-3 text-sm">© 2026 SellerPulse. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-txt-3 hover:text-white text-sm transition-colors">Privacy</a>
              <a href="#" className="text-txt-3 hover:text-white text-sm transition-colors">Terms</a>
              <a href="#" className="text-txt-3 hover:text-white text-sm transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
