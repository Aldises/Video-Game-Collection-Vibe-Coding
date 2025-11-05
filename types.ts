export type SubscriptionTier = 'free' | 'lite' | 'premium';

export interface Profile {
  id: string;
  subscription_tier: SubscriptionTier;
  scans_used_this_month: number;
  scan_usage_reset_at: string;
}

export interface User {
  id: string;
  email: string | null;
  profile: Profile | null;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface SignInResult {
    user: User;
    mfaRequired: boolean;
    factorId?: string;
}

export interface PriceEstimate {
  source: string; // e.g., 'eBay', 'Ricardo'
  currency: string; // e.g., 'USD', 'CHF'
  low: number;
  average: number;
  high: number;
}

export interface GameItem {
  id?: number; // Unique ID when saved to the collection
  sourceId?: string; // Temporary unique ID from a scan result for UI key purposes
  title: string;
  publisher: string;
  platform: string;
  releaseYear: number;
  itemType: 'Game' | 'Console' | 'Accessory';
  condition: 'Boxed' | 'Loose' | 'Unknown';
  estimatedPrices: PriceEstimate[];
}