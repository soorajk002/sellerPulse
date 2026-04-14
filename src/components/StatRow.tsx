"use client";

interface Stat {
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: string;
}

interface StatRowProps {
  stats: Stat[];
}

export default function StatRow({ stats }: StatRowProps) {
  const trendIcon = (trend?: string) => {
    if (trend === "up") return <span className="text-green text-xs ml-1">↑</span>;
    if (trend === "down") return <span className="text-red text-xs ml-1">↓</span>;
    return null;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white rounded-xl border border-bd p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-txt-3 text-xs font-medium uppercase tracking-wide">{stat.label}</span>
            {stat.icon && <span className="text-lg">{stat.icon}</span>}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-txt">{stat.value}</span>
            {trendIcon(stat.trend)}
          </div>
          {stat.sub && (
            <p className="text-txt-3 text-xs mt-0.5">{stat.sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
