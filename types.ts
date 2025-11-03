
export interface User {
  id: string;
  email: string;
}

export interface PriceEstimate {
  source: string; // e.g., 'eBay', 'Ricardo'
  currency: string; // e.g., 'USD', 'CHF'
  low: number;
  average: number;
  high: number;
}

export interface GameItem {
  id?: string; // Unique ID when saved to the collection
  sourceId?: string; // Temporary unique ID from a scan result for UI key purposes
  title: string;
  publisher: string;
  platform: string;
  releaseYear: number;
  itemType: 'Game' | 'Console' | 'Accessory';
  estimatedPrices: PriceEstimate[];
}
