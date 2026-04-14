"use client";

import { FilterState } from "@/types";

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  categories: string[];
}

export default function FilterBar({ filters, onChange, categories }: FilterBarProps) {
  function update(key: keyof FilterState, value: string | number) {
    onChange({ ...filters, [key]: value });
  }

  function reset() {
    onChange({
      search: "",
      category: "",
      minRevenue: 0,
      maxRevenue: 0,
      minScore: 0,
      competition: "",
      maxReviews: 0,
    });
  }

  const hasFilters = filters.search || filters.category || filters.minScore > 0 ||
    filters.competition || filters.minRevenue > 0 || filters.maxRevenue > 0 || filters.maxReviews > 0;

  return (
    <div className="bg-white rounded-xl border border-bd p-4 mb-6">
      <div className="flex flex-wrap gap-3">
        {/* Search */}
        <div className="flex-1 min-w-48">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0"/>
            </svg>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => update("search", e.target.value)}
              placeholder="Search products or ASIN..."
              className="input-field pl-9"
            />
          </div>
        </div>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => update("category", e.target.value)}
          className="input-field w-auto min-w-32"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Competition */}
        <select
          value={filters.competition}
          onChange={(e) => update("competition", e.target.value)}
          className="input-field w-auto min-w-36"
        >
          <option value="">Any Competition</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>

        {/* Min Score */}
        <select
          value={filters.minScore}
          onChange={(e) => update("minScore", parseFloat(e.target.value))}
          className="input-field w-auto min-w-32"
        >
          <option value={0}>Any Score</option>
          <option value={7}>Score 7+</option>
          <option value={8}>Score 8+</option>
          <option value={8.5}>Score 8.5+</option>
          <option value={9}>Score 9+</option>
        </select>

        {/* Min Revenue */}
        <select
          value={filters.minRevenue}
          onChange={(e) => update("minRevenue", parseInt(e.target.value))}
          className="input-field w-auto min-w-36"
        >
          <option value={0}>Any Revenue</option>
          <option value={2000}>$2k+/mo</option>
          <option value={3000}>$3k+/mo</option>
          <option value={5000}>$5k+/mo</option>
          <option value={7000}>$7k+/mo</option>
        </select>

        {/* Max Reviews */}
        <select
          value={filters.maxReviews}
          onChange={(e) => update("maxReviews", parseInt(e.target.value))}
          className="input-field w-auto min-w-36"
        >
          <option value={0}>Any Reviews</option>
          <option value={100}>Under 100</option>
          <option value={200}>Under 200</option>
          <option value={500}>Under 500</option>
        </select>

        {/* Reset */}
        {hasFilters && (
          <button
            onClick={reset}
            className="px-3 py-2 text-sm text-txt-2 hover:text-txt border border-bd rounded-lg hover:bg-bg-2 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
