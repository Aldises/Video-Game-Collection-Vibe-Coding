import { GameItem } from '../types';

// MOCK DATABASE - In a real app, this logic would be on your backend server.
const DB_KEY = 'mockUserDB';
const getDb = () => {
  const db = localStorage.getItem(DB_KEY);
  return db ? JSON.parse(db) : {};
};
const saveDb = (db: any) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
};
// --- END OF MOCK DATABASE ---

// Helper for mock implementation
const getItems = async (userId: string, list: 'collection' | 'wishlist'): Promise<GameItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const db = getDb();
      const user = db[userId];
      if (user && user[list]) {
        resolve(user[list]);
      } else {
        resolve([]);
      }
    }, 200);
  });
};

export const getUserCollection = (userId: string): Promise<GameItem[]> => {
    // In a real app, you would fetch this from your backend API:
    /*
    const response = await fetch(`/api/users/${userId}/collection`);
    if (!response.ok) throw new Error('Failed to fetch collection.');
    return response.json();
    */
    return getItems(userId, 'collection');
};

export const getUserWishlist = (userId: string): Promise<GameItem[]> => {
    // In a real app, you would fetch this from your backend API:
    /*
    const response = await fetch(`/api/users/${userId}/wishlist`);
    if (!response.ok) throw new Error('Failed to fetch wishlist.');
    return response.json();
    */
    return getItems(userId, 'wishlist');
};

export const addToCollection = (userId: string, items: GameItem[]): Promise<void> => {
    // In a real app, you would POST this to your backend API:
    /*
    const response = await fetch(`/api/users/${userId}/collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
    });
    if (!response.ok) throw new Error('Failed to add to collection.');
    return;
    */

    // --- MOCK IMPLEMENTATION ---
    return new Promise((resolve) => {
        setTimeout(() => {
            const db = getDb();
            if (!db[userId]) db[userId] = { password: '', collection: [], wishlist: [] };
            
            const userList = db[userId].collection || [];
            const itemsWithIds = items.map(item => ({ ...item, id: crypto.randomUUID() }));
            db[userId].collection = [...userList, ...itemsWithIds];
            
            saveDb(db);
            resolve();
        }, 200);
    });
};

export const addToWishlist = (userId:string, items: GameItem[]): Promise<void> => {
    // In a real app, you would POST this to your backend API:
    /*
    const response = await fetch(`/api/users/${userId}/wishlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items),
    });
    if (!response.ok) throw new Error('Failed to add to wishlist.');
    return;
    */
    
    // --- MOCK IMPLEMENTATION ---
     return new Promise((resolve) => {
        setTimeout(() => {
            const db = getDb();
            if (!db[userId]) db[userId] = { password: '', collection: [], wishlist: [] };

            const userList = db[userId].wishlist || [];
            const itemsWithIds = items.map(item => ({ ...item, id: crypto.randomUUID() }));
            db[userId].wishlist = [...userList, ...itemsWithIds];

            saveDb(db);
            resolve();
        }, 200);
    });
};

export const removeFromCollection = (userId: string, itemId: string): Promise<void> => {
    // In a real app, you would send a DELETE request to your backend API:
    /*
    const response = await fetch(`/api/users/${userId}/collection/${itemId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove from collection.');
    return;
    */

    // --- MOCK IMPLEMENTATION ---
    return new Promise((resolve) => {
        setTimeout(() => {
            const db = getDb();
            if (db[userId] && db[userId].collection) {
                db[userId].collection = db[userId].collection.filter((item: GameItem) => item.id !== itemId);
                saveDb(db);
            }
            resolve();
        }, 200);
    });
};

export const removeFromWishlist = (userId: string, itemId: string): Promise<void> => {
    // In a real app, you would send a DELETE request to your backend API:
    /*
    const response = await fetch(`/api/users/${userId}/wishlist/${itemId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove from wishlist.');
    return;
    */

    // --- MOCK IMPLEMENTATION ---
    return new Promise((resolve) => {
        setTimeout(() => {
            const db = getDb();
            if (db[userId] && db[userId].wishlist) {
                db[userId].wishlist = db[userId].wishlist.filter((item: GameItem) => item.id !== itemId);
                saveDb(db);
            }
            resolve();
        }, 200);
    });
};
