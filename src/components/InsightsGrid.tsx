"use client";

interface InsightCard {
  title: string;
  emoji: string;
  insight: string;
  data: { label: string; value: number; max?: number }[];
  color: string;
  badge?: string;
  badgeColor?: string;
}

function MiniBarChart({ data, color }: { data: { label: string; value: number; max?: number }[]; color: string }) {
  const max = Math.max(...data.map((d) => d.max || d.value), 1);
  return (
    <div className="space-y-2">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between items-center mb-0.5">
            <span className="text-xs text-txt-2">{d.label}</span>
            <span className="text-xs font-semibold text-txt">{d.value.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-bg-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${((d.max || d.value) / max) * 100}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const insightCards: InsightCard[] = [
  {
    title: "Top Performing Categories",
    emoji: "📊",
    badge: "Trending",
    badgeColor: "bg-green-light text-green border-green-border",
    insight: "Kitchen and Pet categories are showing the strongest growth momentum with low competition scores. Kitchen has 3 products scoring 8.5+ with upward BSR trends.",
    data: [
      { label: "Kitchen", value: 3, max: 3 },
      { label: "Pet", value: 2, max: 3 },
      { label: "Beauty", value: 2, max: 3 },
      { label: "Sports", value: 2, max: 3 },
      { label: "Baby", value: 3, max: 3 },
    ],
    color: "#f26522",
  },
  {
    title: "Market Opportunity Score",
    emoji: "🎯",
    badge: "AI Analysis",
    badgeColor: "bg-orange-light text-orange border-orange-border",
    insight: "80% of our database products show low competition, creating significant first-mover advantages. Products with scores 8.5+ have an average 47% margin.",
    data: [
      { label: "Low Competition", value: 80, max: 100 },
      { label: "Upward Trend", value: 73, max: 100 },
      { label: "Score 8+", value: 60, max: 100 },
      { label: "High Margin (35%+)", value: 67, max: 100 },
    ],
    color: "#1e7e34",
  },
  {
    title: "Keyword Volume Leaders",
    emoji: "🔍",
    badge: "High Volume",
    badgeColor: "bg-amber-light text-amber border-amber-border",
    insight: "Resistance bands (54k/mo) and ergonomic pens (28k/mo) dominate search volume. Low CPC keywords like magnetic clips ($0.48) offer excellent paid traffic ROI.",
    data: [
      { label: "resistance bands set", value: 54200 },
      { label: "ergonomic gel pen set", value: 28400 },
      { label: "bamboo lunch box", value: 22400 },
      { label: "magnetic cable clips", value: 19800 },
      { label: "slow feeder dog bowl", value: 18700 },
    ],
    color: "#f26522",
  },
  {
    title: "Revenue Distribution",
    emoji: "💰",
    badge: "This Month",
    badgeColor: "bg-green-light text-green border-green-border",
    insight: "The top 3 products generate 35% of total tracked revenue. Insulated Travel Mug leads at $9.1k/mo despite high competition, proving demand exists in saturated niches.",
    data: [
      { label: "Insulated Travel Mug", value: 9100 },
      { label: "Bamboo Lunch Box", value: 8240 },
      { label: "Slow Feeder Bowl", value: 7340 },
      { label: "Resistance Bands", value: 6890 },
      { label: "Vitamin C Eye Cream", value: 6120 },
    ],
    color: "#b45309",
  },
];

export default function InsightsGrid() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {insightCards.map((card, i) => (
        <div key={i} className="bg-white rounded-xl border border-bd p-6 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-light rounded-xl flex items-center justify-center text-xl">
                {card.emoji}
              </div>
              <div>
                <h3 className="font-bold text-txt text-sm">{card.title}</h3>
                {card.badge && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border mt-1 inline-block ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="mb-4">
            <MiniBarChart data={card.data} color={card.color} />
          </div>

          {/* AI Insight */}
          <div className="bg-bg rounded-lg p-3 border border-bd">
            <div className="flex items-start gap-2">
              <span className="text-xs">🤖</span>
              <p className="text-txt-2 text-xs leading-relaxed">{card.insight}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
