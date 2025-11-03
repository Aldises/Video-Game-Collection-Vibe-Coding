import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from './types';
import { analyzeImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { dbService } from './services/dbService';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import InventoryTable from './components/InventoryTable';
import Loader from './components/Loader';
import LoginPage from './components/LoginPage';
import MyCollectionPage from './components/MyCollectionPage';
import MyWishlistPage from './components/MyWishlistPage';
import { useUser } from './hooks/useUser';

export type Page = 'scanner' | 'collection' | 'wishlist';

const App: React.FC = () => {
  const { user, isLoading: isUserLoading } = useUser();
  const [inventory, setInventory] = useState<GameItem[]>([]);
  const [myCollection, setMyCollection] = useState<GameItem[]>([]);
  const [myWishlist, setMyWishlist] = useState<GameItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('scanner');

  // Load collection and wishlist from the database service on user login
  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        setIsLoading(true);
        try {
            const [collection, wishlist] = await Promise.all([
                dbService.getCollectionByUserId(user.id),
                dbService.getWishlistByUserId(user.id),
            ]);
            setMyCollection(collection);
            setMyWishlist(wishlist);
        } catch (err) {
            setError('Could not load your data.');
        } finally {
            setIsLoading(false);
        }
      } else {
        // Clear data on logout
        setMyCollection([]);
        setMyWishlist([]);
        setInventory([]);
        setImagePreviews([]);
      }
    };
    fetchData();
  }, [user]);


  const handleImageUpload = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    setInventory([]);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));
    setCurrentPage('scanner');

    try {
      let allItems: GameItem[] = [];
      // Process files in parallel
      await Promise.all(files.map(async (file) => {
        const { base64, mimeType } = await fileToBase64(file);
        const items = await analyzeImage({ data: base64, mimeType });
        allItems.push(...items);
      }));

      // Assign a temporary unique ID for UI key purposes
      const itemsWithSourceIds = allItems.map(item => ({
        ...item,
        sourceId: crypto.randomUUID(),
      }));

      setInventory(itemsWithSourceIds);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try a different image.');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleResetScanner = useCallback(() => {
    setInventory([]);
    setImagePreviews([]);
    setError(null);
    setIsLoading(false);
    setCurrentPage('scanner');
  }, []);

  const addMultipleToCollection = useCallback(async (itemsToAdd: GameItem[]) => {
    if (!user) return;
    
    const newItems = itemsToAdd.filter(itemToAdd => 
      !myCollection.some(
        collectionItem => collectionItem.title === itemToAdd.title && collectionItem.platform === itemToAdd.platform
      )
    );

    if (newItems.length > 0) {
        // Prepare items for saving by removing temporary UI IDs
        const itemsToSave = newItems.map(({ sourceId, id, ...rest }) => rest);
        
        try {
            // Save to DB and get back the items with their new database IDs
            const savedItems = await dbService.addToCollection(user.id, itemsToSave);
            setMyCollection(prev => [...prev, ...savedItems]);
        } catch(err) {
            setError("Failed to save items to your collection.");
        }
    }
  }, [myCollection, user]);

  const addMultipleToWishlist = useCallback(async (itemsToAdd: GameItem[]) => {
    if (!user) return;
    
    const newItems = itemsToAdd.filter(itemToAdd => 
      !myWishlist.some(
        wishlistItem => wishlistItem.title === itemToAdd.title && wishlistItem.platform === itemToAdd.platform
      )
    );

    if (newItems.length > 0) {
        const itemsToSave = newItems.map(({ sourceId, id, ...rest }) => rest);
        
        try {
            const savedItems = await dbService.addToWishlist(user.id, itemsToSave);
            setMyWishlist(prev => [...prev, ...savedItems]);
        } catch(err) {
            setError("Failed to save items to your wishlist.");
        }
    }
  }, [myWishlist, user]);

  const removeFromCollection = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
        await dbService.removeFromCollection(user.id, itemId);
        setMyCollection(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
        setError("Failed to remove item from your collection.");
    }
  }, [user]);

  const removeFromWishlist = useCallback(async (itemId: string) => {
    if (!user) return;
    try {
        await dbService.removeFromWishlist(user.id, itemId);
        setMyWishlist(prev => prev.filter(item => item.id !== itemId));
    } catch (err) {
        setError("Failed to remove item from your wishlist.");
    }
  }, [user]);
  
  if (isUserLoading) {
    return (
        <div className="min-h-screen bg-neutral-darker flex items-center justify-center">
            <Loader message="Loading application..."/>
        </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch(currentPage) {
        case 'collection':
            return <MyCollectionPage collection={myCollection} onRemove={removeFromCollection} />;
        case 'wishlist':
            return <MyWishlistPage wishlist={myWishlist} onRemove={removeFromWishlist} />;
        case 'scanner':
        default:
            return (
                <>
                 {inventory.length === 0 && !isLoading && !error && (
                    <ImageUploader onImageUpload={handleImageUpload} />
                    )}

                    {isLoading && (
                    <Loader message="AI is analyzing your collection... this may take a moment." />
                    )}

                    {error && (
                    <div className="text-center p-8 bg-neutral-dark/50 backdrop-blur-sm border border-red-500/50 rounded-xl max-w-2xl w-full animate-fade-in">
                        <h2 className="text-2xl font-bold text-red-400 mb-4">Analysis Failed</h2>
                        <p className="text-neutral-300 mb-6">{error}</p>
                        <button
                          onClick={handleResetScanner}
                          className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-opacity"
                        >
                          Try Again
                        </button>
                    </div>
                    )}

                    {inventory.length > 0 && !isLoading && (
                    <div className="w-full max-w-7xl animate-fade-in">
                        <InventoryTable 
                            inventory={inventory} 
                            imagePreviews={imagePreviews} 
                            onReset={handleResetScanner}
                            myCollection={myCollection}
                            myWishlist={myWishlist}
                            onAddMultipleToCollection={addMultipleToCollection}
                            onAddMultipleToWishlist={addMultipleToWishlist}
                        />
                    </div>
                    )}
                </>
            );
    }
  }

  return (
    <div className="min-h-screen bg-neutral-darker text-neutral-light flex flex-col font-sans">
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
};

export default App;