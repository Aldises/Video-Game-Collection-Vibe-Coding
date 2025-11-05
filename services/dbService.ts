import { GameItem, Profile } from '../types';
import { supabase } from './supabaseClient';
import { fetchPriceForItem } from './geminiService';

// Type helper for Supabase returns
type DbPriceEstimate = {
  id: number;
  collection_item_id: number;
  source: string;
  currency: string | null;
  low_price: number | null;
  average_price: number | null;
  high_price: number | null;
};

type DbCollectionItem = {
  id: number;
  title: string;
  publisher: string | null;
  platform: string;
  release_year: number | null;
  item_type: 'Game' | 'Console' | 'Accessory';
  condition: 'Boxed' | 'Loose' | 'Unknown';
  price_estimates: DbPriceEstimate[];
};

const mapDbItemToGameItem = (dbItem: DbCollectionItem): GameItem => ({
  id: dbItem.id,
  title: dbItem.title,
  publisher: dbItem.publisher || '', // Safely handle null publisher
  platform: dbItem.platform,
  releaseYear: dbItem.release_year || 0, // Safely handle null releaseYear
  itemType: dbItem.item_type,
  condition: dbItem.condition,
  estimatedPrices: (dbItem.price_estimates || []).map(p => ({
    source: p.source,
    currency: p.currency || '',
    low: p.low_price || 0,
    average: p.average_price || 0,
    high: p.high_price || 0,
  })),
});

// Centralized error handler for better logging
const logAndThrow = (context: string, error: any) => {
    const errorMessage = error.message || 'An unknown database error occurred.';
    console.error(`[dbService Error] ${context}:`, {
        message: error.message,
        code: error.code,
        details: error.details,
        fullError: error
    });
    throw new Error(errorMessage);
};

export const getUserProfile = async (userId: string): Promise<Profile> => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            const errorMessage = `Inconsistency: No profile found for user ${userId}. A database trigger should have created one.`;
            console.error(errorMessage, error);
            throw new Error(errorMessage);
        }
        logAndThrow('Fetching user profile', error);
    }

    return data as Profile;
}

export const getUserCollection = async (userId: string): Promise<GameItem[]> => {
  try {
      // Optimized to fetch collection items and their related prices in a single query.
      const { data, error } = await supabase
        .from('collection_items')
        .select(`
          *,
          price_estimates (
            *
          )
        `)
        .eq('user_id', userId);

      if (error) {
        logAndThrow('Fetching collection items with prices', error);
      }
      
      if (!data) {
        return [];
      }

      // Map the combined data structure safely to the application's GameItem type.
      return data.map(item => mapDbItemToGameItem(item as unknown as DbCollectionItem));

  } catch (error) {
    console.error("Critical error in getUserCollection:", error);
    throw error;
  }
};


export const getUserWishlist = async (userId: string): Promise<GameItem[]> => {
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      logAndThrow('Fetching wishlist items', error);
    }
    
    if (!data) {
        return [];
    }
    
    // Safely map wishlist items to the GameItem type, providing defaults for nullable fields.
    return data.map(item => ({
        id: item.id,
        title: item.title,
        publisher: item.publisher || '', // Handle null
        platform: item.platform,
        releaseYear: item.release_year || 0, // Handle null
        itemType: item.item_type,
        condition: item.condition,
        estimatedPrices: [], // Wishlist items do not have prices.
    }));
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

export const addManualItemToCollection = async (userId: string, item: Omit<GameItem, 'estimatedPrices' | 'id' | 'sourceId'>): Promise<void> => {
    const { error } = await supabase
        .from('collection_items')
        .insert({
            user_id: userId,
            title: item.title,
            publisher: item.publisher,
            platform: item.platform,
            release_year: item.releaseYear,
            item_type: item.itemType,
            condition: item.condition,
        });
    if (error) {
        console.error('Error inserting manual item to collection:', error);
        throw new Error(error.message);
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

export const addManualItemToWishlist = async (userId: string, item: Omit<GameItem, 'estimatedPrices' | 'id' | 'sourceId'>): Promise<void> => {
    const { error } = await supabase
        .from('wishlist_items')
        .insert({
            user_id: userId,
            title: item.title,
            publisher: item.publisher,
            platform: item.platform,
            release_year: item.releaseYear,
            item_type: item.itemType,
            condition: item.condition,
        });
    if (error) {
        console.error('Error inserting manual item to wishlist:', error);
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
