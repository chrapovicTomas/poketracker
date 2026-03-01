export type ItemCategory = 'Single' | 'Booster Pack' | 'Elite Trainer Box' | 'Booster Bundle' | 'Other';

export interface TrackerItem {
    id: number;
    name: string;
    category: ItemCategory; // New property
    buyPrice: number;
    marketUrl: string; // TCGPlayer URL
    imageUrl?: string | null; // Product image
    currentPrice: number | null;
    lastUpdated: string | null;
    isUpdating: boolean;
    error?: string;
    priceHistory?: { price: number; date: string }[];
}
