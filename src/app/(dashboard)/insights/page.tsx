import InsightsGrid from "@/components/InsightsGrid";
import StatRow from "@/components/StatRow";

export default function InsightsPage() {
  const stats = [
    { label: "Market Opportunities", value: "12", icon: "🎯", trend: "up" as const },
    { label: "Trending Categories", value: "4", icon: "📈", trend: "up" as const },
    { label: "Avg Opportunity Score", value: "8.3", icon: "⭐" },
    { label: "Last Updated", value: "Today", icon: "🔄" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-txt">AI Market Insights</h1>
          <span className="bg-orange-light text-orange border border-orange-border text-xs font-semibold px-2.5 py-1 rounded-full">
            AI-Powered
          </span>
        </div>
        <p className="text-txt-2 text-sm mt-0.5">
          Data-driven insights to help you find the best Amazon opportunities
        </p>
      </div>

      {/* Stats */}
      <StatRow stats={stats} />

      {/* Insights Grid */}
      <InsightsGrid />

      {/* Bottom insight */}
      <div className="mt-6 bg-white rounded-xl border border-bd p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-orange-light rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
            🤖
          </div>
          <div>
            <h3 className="font-bold text-txt mb-2">Weekly Market Summary</h3>
            <p className="text-txt-2 text-sm leading-relaxed">
              This week&apos;s analysis shows strong momentum in health & wellness adjacent categories (Pet, Baby, Sports).
              Products with <strong>organic differentiation</strong> (bamboo materials, BPA-free, ergonomic design) are commanding
              premium prices while maintaining low competition. The sweet spot remains products priced $15–$30 with
              under 200 reviews, where new sellers can rank within 60 days using a focused PPC strategy.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Bamboo Products", "Pet Accessories", "Baby Safety", "Ergonomic Tools", "Self-Care"].map((tag) => (
                <span key={tag} className="text-xs bg-bg-2 text-txt-2 border border-bd px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
