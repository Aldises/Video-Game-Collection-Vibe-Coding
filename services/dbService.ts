import { User, GameItem } from '../types';
import { db } from './firebase';
// Fix: Removed Firebase v9 modular imports as they are not available in the project's Firebase version.
// import { 
//     doc,
//     setDoc, 
//     collection, 
//     getDocs,
//     deleteDoc,
//     writeBatch
// } from 'firebase/firestore';

export const dbService = {
  // Creates a user document in the 'users' collection after signup
  createUser: async (userId: string, email: string): Promise<void> => {
    // Fix: Switched to v8 `db.collection().doc().set()` syntax.
    const userDocRef = db.collection('users').doc(userId);
    await userDocRef.set({ email, createdAt: new Date() });
  },
  
  getCollectionByUserId: async (userId: string): Promise<GameItem[]> => {
    // Fix: Switched to v8 `db.collection().get()` syntax.
    const collectionRef = db.collection('users').doc(userId).collection('collection');
    const snapshot = await collectionRef.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameItem));
  },

  getWishlistByUserId: async (userId: string): Promise<GameItem[]> => {
    // Fix: Switched to v8 `db.collection().get()` syntax.
    const wishlistRef = db.collection('users').doc(userId).collection('wishlist');
    const snapshot = await wishlistRef.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GameItem));
  },

  addToCollection: async (userId: string, items: Omit<GameItem, 'id' | 'sourceId'>[]): Promise<GameItem[]> => {
    // Fix: Switched to v8 `db.batch()` syntax for batch writes.
    const batch = db.batch();
    const collectionRef = db.collection('users').doc(userId).collection('collection');
    const addedItems: GameItem[] = [];

    for (const item of items) {
        // Fix: Switched to v8 `collection.doc()` to generate a new document reference.
        const docRef = collectionRef.doc(); // Generate new doc ref with ID
        batch.set(docRef, item);
        addedItems.push({ ...item, id: docRef.id });
    }
    await batch.commit();
    return addedItems;
  },

  addToWishlist: async (userId: string, items: Omit<GameItem, 'id' | 'sourceId'>[]): Promise<GameItem[]> => {
    // Fix: Switched to v8 `db.batch()` syntax for batch writes.
    const batch = db.batch();
    const wishlistRef = db.collection('users').doc(userId).collection('wishlist');
    const addedItems: GameItem[] = [];

    for (const item of items) {
        // Fix: Switched to v8 `collection.doc()` to generate a new document reference.
        const docRef = wishlistRef.doc(); // Generate new doc ref with ID
        batch.set(docRef, item);
        addedItems.push({ ...item, id: docRef.id });
    }
    await batch.commit();
    return addedItems;
  },

  removeFromCollection: async (userId: string, itemId: string): Promise<void> => {
    // Fix: Switched to v8 `doc.delete()` method.
    const docRef = db.collection('users').doc(userId).collection('collection').doc(itemId);
    await docRef.delete();
  },

  removeFromWishlist: async (userId: string, itemId: string): Promise<void> => {
    // Fix: Switched to v8 `doc.delete()` method.
    const docRef = db.collection('users').doc(userId).collection('wishlist').doc(itemId);
    await docRef.delete();
  }
};
