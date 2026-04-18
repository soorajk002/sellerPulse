export interface Marketplace {
  id: string;
  name: string;
  flag: string;
  domain: string;
  currency: string;
}

export const MARKETPLACES: Marketplace[] = [
  { id: "US", name: "United States", flag: "🇺🇸", domain: "amazon.com",    currency: "USD" },
  { id: "GB", name: "United Kingdom", flag: "🇬🇧", domain: "amazon.co.uk", currency: "GBP" },
  { id: "DE", name: "Germany",        flag: "🇩🇪", domain: "amazon.de",    currency: "EUR" },
  { id: "FR", name: "France",         flag: "🇫🇷", domain: "amazon.fr",    currency: "EUR" },
  { id: "CA", name: "Canada",         flag: "🇨🇦", domain: "amazon.ca",    currency: "CAD" },
  { id: "JP", name: "Japan",          flag: "🇯🇵", domain: "amazon.co.jp", currency: "JPY" },
  { id: "IT", name: "Italy",          flag: "🇮🇹", domain: "amazon.it",    currency: "EUR" },
  { id: "ES", name: "Spain",          flag: "🇪🇸", domain: "amazon.es",    currency: "EUR" },
  { id: "AU", name: "Australia",      flag: "🇦🇺", domain: "amazon.com.au",currency: "AUD" },
  { id: "IN", name: "India",          flag: "🇮🇳", domain: "amazon.in",    currency: "INR" },
  { id: "MX", name: "Mexico",         flag: "🇲🇽", domain: "amazon.com.mx",currency: "MXN" },
];

export const DEFAULT_MARKETPLACE = MARKETPLACES[0];
