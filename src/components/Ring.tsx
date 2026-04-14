"use client";

import { scoreColor } from "@/lib/utils";

interface RingProps {
  score: number;
  size?: "sm" | "lg";
}

export default function Ring({ score, size = "sm" }: RingProps) {
  const isLg = size === "lg";
  const diameter = isLg ? 60 : 34;
  const radius = isLg ? 26 : 14;
  const strokeWidth = isLg ? 4 : 3;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const fontSize = isLg ? "12px" : "8px";
  const color = scoreColor(score);

  return (
    <svg
      width={diameter}
      height={diameter}
      viewBox={`0 0 ${diameter} ${diameter}`}
      style={{ display: "block" }}
    >
      {/* Background circle */}
      <circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={radius}
        fill="none"
        stroke="#e0e3e8"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <circle
        cx={diameter / 2}
        cy={diameter / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${progress} ${circumference}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${diameter / 2} ${diameter / 2})`}
      />
      {/* Score text */}
      <text
        x={diameter / 2}
        y={diameter / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        style={{
          fontSize,
          fontWeight: "700",
          fontFamily: "Source Sans 3, sans-serif",
        }}
      >
        {score.toFixed(1)}
      </text>
    </svg>
  );
}
