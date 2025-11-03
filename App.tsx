import React, { useState, useCallback, useEffect } from 'react';
import { GameItem } from './types';
import { analyzeImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import Header from './components/Header';
import Footer from './components/Footer';
import ImageUploader from './components/ImageUploader';
import InventoryTable from './components/InventoryTable';
import Loader from './components/Loader';
import LoginPage from './components/LoginPage';
import MyCollectionPage from './components/MyCollectionPage';
import MyWishlistPage from './components/MyWishlistPage';
import AnalyticsPage from './components/AnalyticsPage';
import { useUser } from './hooks/useUser';
import { getUserCollection, getUserWishlist, addToCollection, addToWishlist } from './services/dbService';

type Page = 'scanner' | 'collection' | 'wishlist' | 'analytics';

const App: React.FC = () => {
  const { user, loading } = useUser();
  const [inventory, setInventory] = useState<GameItem[]>([]);
  const [collection, setCollection] = useState<GameItem[]>([]);
  const [wishlist, setWishlist] = useState<GameItem[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('scanner');

  const refetchData = useCallback(async () => {
    if (user) {
      const newCollection = await getUserCollection(user.uid);
      const newWishlist = await getUserWishlist(user.uid);
      setCollection(newCollection);
      setWishlist(newWishlist);
    }
  }, [user]);

  useEffect(() => {
    refetchData();
  }, [user, refetchData]);

  const handleImageUpload = useCallback(async (files: File[]) => {
    setIsScanning(true);
    setError(null);
    setInventory([]);
    setImagePreviews(files.map(file => URL.createObjectURL(file)));

    try {
      let allItems: GameItem[] = [];
      await Promise.all(files.map(async (file) => {
        const { base64, mimeType } = await fileToBase64(file);
        const items = await analyzeImage({ data: base64, mimeType });
        allItems.push(...items);
      }));

      const itemsWithSourceIds = allItems.map(item => ({
        ...item,
        sourceId: crypto.randomUUID(),
      }));

      setInventory(itemsWithSourceIds);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred. Please try a different image.');
    } finally {
      setIsScanning(false);
    }
  }, []);
  
  const handleResetScanner = useCallback(() => {
    setInventory([]);
    setImagePreviews([]);
    setError(null);
    setIsScanning(false);
  }, []);
  
  const handleAddToCollection = async (items: GameItem[]) => {
    if (user) {
      await addToCollection(user.uid, items);
      await refetchData();
    }
  };

  const handleAddToWishlist = async (items: GameItem[]) => {
    if (user) {
      await addToWishlist(user.uid, items);
      await refetchData();
    }
  };

  const renderScannerPage = () => {
    if (inventory.length === 0 && !isScanning && !error) {
        return <ImageUploader onImageUpload={handleImageUpload} />;
    }
    if (isScanning) {
        return <Loader message="AI is analyzing your collection... this may take a moment." />;
    }
    if (error) {
        return (
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
        );
    }
    if (inventory.length > 0 && !isScanning) {
        return (
            <div className="w-full max-w-7xl animate-fade-in">
                <InventoryTable 
                    inventory={inventory}
                    collection={collection}
                    wishlist={wishlist}
                    imagePreviews={imagePreviews} 
                    onReset={handleResetScanner}
                    onAddToCollection={handleAddToCollection}
                    onAddToWishlist={handleAddToWishlist}
                />
            </div>
        );
    }
    return null;
  };

  const renderContent = () => {
    switch (currentPage) {
        case 'scanner':
            return renderScannerPage();
        case 'collection':
            return <MyCollectionPage collection={collection} onDataChange={refetchData} />;
        case 'wishlist':
            return <MyWishlistPage wishlist={wishlist} onDataChange={refetchData} />;
        case 'analytics':
            return <AnalyticsPage collection={collection} />;
        default:
            return renderScannerPage();
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-darker"><Loader message="Initializing..." /></div>;
  }
  
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-neutral-darker text-neutral-light flex flex-col font-sans">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        {renderContent()}
      </main>
      <Footer />
    </div>
  );
};

export default App;