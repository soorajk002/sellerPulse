/** Client-facing product shape — sparkline is already parsed to number[] */
export interface Product {
  id: string;
  emoji: string;
  name: string;
  asin: string;
  category: string;
  revenue: number;
  bsr: number;
  price: number;
  reviews: number;
  score: number;
  competition: string;
  trend: string;
  margin: number;
  sparkline: number[];
  createdAt?: string;
  isTracked?: boolean;
}

/** Shape used when inserting/updating the DB — sparkline is a JSON string */
export interface ProductInsert {
  emoji: string;
  name: string;
  asin: string;
  category: string;
  revenue: number;
  bsr: number;
  price: number;
  reviews: number;
  score: number;
  competition: string;
  trend: string;
  margin: number;
  sparkline: string;
}

export interface Keyword {
  id: string;
  keyword: string;
  volume: number;
  cpc: number;
  difficulty: string;
  trend: string;
}

export interface TrackedProduct {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product: Product;
}

export interface User {
  id: string;
  email: string;
  name?: string | null;
  plan: string;
  searches: number;
  maxSearches: number;
}

export type SortField = "score" | "revenue" | "bsr" | "price" | "reviews" | "margin";

export interface FilterState {
  category: string;
  competition: string;
  trend: string;
  minRevenue: number;
  maxRevenue: number;
  minBSR: number;
  maxBSR: number;
  minPrice: number;
  maxPrice: number;
  minScore: number;
  maxScore: number;
  maxReviews: number;
  minMargin: number;
  sortBy: SortField;
  sortDir: "asc" | "desc";
}
