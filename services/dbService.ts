import { GameItem, PriceEstimate } from '../types';
import { supabase } from './supabaseClient';
import { fetchPriceForItem } from './geminiService';

// Type helper for Supabase returns
type DbPriceEstimate = {
  id: number;
  collection_item_id: number;
  source: string;
  currency: string;
  low_price: number;
  average_price: number;
  high_price: number;
};

type DbCollectionItem = {
  id: number;
  title: string;
  publisher: string;
  platform: string;
  release_year: number;
  item_type: 'Game' | 'Console' | 'Accessory';
  condition: 'Boxed' | 'Loose' | 'Unknown';
  price_estimates: DbPriceEstimate[];
};

const mapDbItemToGameItem = (dbItem: DbCollectionItem): GameItem => ({
  id: dbItem.id,
  title: dbItem.title,
  publisher: dbItem.publisher,
  platform: dbItem.platform,
  releaseYear: dbItem.release_year,
  itemType: dbItem.item_type,
  condition: dbItem.condition,
  estimatedPrices: dbItem.price_estimates.map(p => ({
    source: p.source,
    currency: p.currency,
    low: p.low_price,
    average: p.average_price,
    high: p.high_price,
  })),
});

export const getUserCollection = async (userId: string): Promise<GameItem[]> => {
  // Step 1: Fetch main collection items.
  const { data: itemsData, error: itemsError } = await supabase
    .from('collection_items')
    .select('*')
    .eq('user_id', userId);
  
  if (itemsError) {
    console.error("Error fetching collection items:", itemsError);
    throw new Error(itemsError.message);
  }

  if (!itemsData || itemsData.length === 0) {
    return [];
  }

  const itemIds = itemsData.map(item => item.id);

  // Step 2: Fetch price estimates for those items.
  const { data: pricesData, error: pricesError } = await supabase
    .from('price_estimates')
    .select('*')
    .in('collection_item_id', itemIds);

  if (pricesError) {
    console.error("Error fetching price estimates:", pricesError);
    // Don't throw; we can still show items without prices.
  }

  // Step 3: Map prices to their respective items for efficient lookup.
  const pricesMap = new Map<number, DbPriceEstimate[]>();
  if (pricesData) {
    for (const price of pricesData) {
      const id = price.collection_item_id;
      if (!pricesMap.has(id)) {
        pricesMap.set(id, []);
      }
      pricesMap.get(id)!.push(price as DbPriceEstimate);
    }
  }

  // Step 4: Combine items and their prices, then map to the app's data structure.
  const collectionWithPrices = itemsData.map(item => {
    const prices = pricesMap.get(item.id) || [];
    const dbItem: DbCollectionItem = {
      ...item,
      price_estimates: prices,
    };
    return mapDbItemToGameItem(dbItem);
  });

  return collectionWithPrices;
};


export const getUserWishlist = async (userId: string): Promise<GameItem[]> => {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error("Error fetching wishlist:", error);
      throw new Error(error.message);
    }
    // Wishlist items don't have prices, so we add an empty array
    return data.map(item => ({ ...item, releaseYear: item.release_year, itemType: item.item_type, estimatedPrices: [] }));
};

export const addToCollection = async (userId: string, items: GameItem[]): Promise<void> => {
    for (const item of items) {
        const { estimatedPrices, ...itemDetails } = item;

        // 1. Insert the main item
        const { data: insertedItem, error: itemError } = await supabase
            .from('collection_items')
            .insert({
                user_id: userId,
                title: itemDetails.title,
                publisher: itemDetails.publisher,
                platform: itemDetails.platform,
                release_year: itemDetails.releaseYear,
                item_type: itemDetails.itemType,
                condition: itemDetails.condition,
            })
            .select('id')
            .single();

        if (itemError) {
            console.error('Error inserting collection item:', itemError);
            continue; // Move to the next item
        }

        // 2. If item was inserted and has prices, insert prices
        if (insertedItem && estimatedPrices.length > 0) {
            const priceInserts = estimatedPrices.map(p => ({
                collection_item_id: insertedItem.id,
                source: p.source,
                currency: p.currency,
                low_price: p.low,
                average_price: p.average,
                high_price: p.high,
            }));
            
            const { error: priceError } = await supabase
                .from('price_estimates')
                .insert(priceInserts);
                
            if (priceError) {
                console.error('Error inserting prices:', priceError);
                // In a real app, you might want to roll back the item insertion here
            }
        }
    }
};

export const addToWishlist = async (userId:string, items: GameItem[]): Promise<void> => {
    const itemsToInsert = items.map(item => ({
        user_id: userId,
        title: item.title,
        publisher: item.publisher,
        platform: item.platform,
        release_year: item.releaseYear,
        item_type: item.itemType,
        condition: item.condition,
    }));

    const { error } = await supabase.from('wishlist_items').insert(itemsToInsert);

    if (error) {
        console.error("Error adding to wishlist:", error);
        throw new Error(error.message);
    }
};

export const removeFromCollection = async (userId: string, itemId: number): Promise<void> => {
    const { error } = await supabase
      .from('collection_items')
      .delete()
      .match({ id: itemId, user_id: userId });

    if (error) {
        console.error("Error removing from collection:", error);
        throw new Error(error.message);
    }
};

export const removeFromWishlist = async (userId: string, itemId: number): Promise<void> => {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .match({ id: itemId, user_id: userId });

    if (error) {
        console.error("Error removing from wishlist:", error);
        throw new Error(error.message);
    }
};

export const updateCollectionItem = async (userId: string, updatedItem: GameItem): Promise<void> => {
    const { id, estimatedPrices, ...detailsToUpdate } = updatedItem;

    const { error } = await supabase
        .from('collection_items')
        .update({
            title: detailsToUpdate.title,
            publisher: detailsToUpdate.publisher,
            platform: detailsToUpdate.platform,
            release_year: detailsToUpdate.releaseYear,
            item_type: detailsToUpdate.itemType,
            condition: detailsToUpdate.condition,
        })
        .match({ id: id!, user_id: userId });

    if (error) {
        console.error("Error updating collection item:", error);
        throw new Error(error.message);
    }
};

export const removeItemsFromCollection = async (userId: string, itemIds: number[]): Promise<void> => {
    if (itemIds.length === 0) return;
    const { error } = await supabase
        .from('collection_items')
        .delete()
        .eq('user_id', userId)
        .in('id', itemIds);

    if (error) {
        console.error("Error removing items from collection:", error);
        throw new Error(error.message);
    }
};


export const updateAllCollectionPrices = async (userId: string, onProgress: (progress: number) => void): Promise<void> => {
    const { data: items, error } = await supabase
        .from('collection_items')
        .select('id, title, platform')
        .eq('user_id', userId);
    
    if (error) {
        console.error("Error fetching collection for price update:", error);
        throw new Error(error.message);
    }
    if (!items || items.length === 0) {
        return;
    }

    for (const [index, item] of items.entries()) {
        try {
            const newPrices = await fetchPriceForItem({ title: item.title, platform: item.platform });

            if (newPrices.length > 0) {
                // Delete old prices
                await supabase.from('price_estimates').delete().eq('collection_item_id', item.id);

                // Insert new prices
                const priceInserts = newPrices.map(p => ({
                    collection_item_id: item.id,
                    source: p.source,
                    currency: p.currency,
                    low_price: p.low,
                    average_price: p.average,
                    high_price: p.high,
                }));
                await supabase.from('price_estimates').insert(priceInserts);
            }
        } catch (itemError) {
            console.error(`Skipping price update for item ${item.id} due to an error:`, itemError);
        } finally {
            // Report progress
            const progressPercentage = ((index + 1) / items.length) * 100;
            onProgress(Math.round(progressPercentage));
        }
    }
};