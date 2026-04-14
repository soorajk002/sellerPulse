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

export interface FilterState {
  search: string;
  category: string;
  minRevenue: number;
  maxRevenue: number;
  minScore: number;
  competition: string;
  maxReviews: number;
}
