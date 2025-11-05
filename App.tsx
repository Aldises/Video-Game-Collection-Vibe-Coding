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
import MyAccountPage from './components/MyAccountPage';
import EmailConfirmedPage from './components/EmailConfirmedPage';
import PasswordResetPage from './components/PasswordResetPage';
import HomePage from './components/HomePage';
import SubscriptionPage from './components/SubscriptionPage';
import { useUser } from './hooks/useUser';
import { getUserCollection, getUserWishlist, addToCollection, addToWishlist, addManualItemToCollection, addManualItemToWishlist } from './services/dbService';
import { useLocalization } from './hooks/useLocalization';
import { supabase } from './services/supabaseClient';
import Modal from './components/Modal';
import ManualAddForm from './components/ManualAddForm';

export type Page = 'home' | 'scanner' | 'collection' | 'wishlist' | 'analytics' | 'account' | 'subscription';

const App: React.FC = () => {
  const { user, loading, refetchUser } = useUser();
  const { t } = useLocalization();
  const [inventory, setInventory] = useState<GameItem[]>([]);
  const [collection, setCollection] = useState<GameItem[]>([]);
  const [wishlist, setWishlist] = useState<GameItem[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [authFlow, setAuthFlow] = useState<'idle' | 'resetPassword' | 'confirmed'>('idle');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitModalContent, setLimitModalContent] = useState({ title: '', message: ''});
  const [isManualAddModalOpen, setIsManualAddModalOpen] = useState(false);
  const [manualAddTarget, setManualAddTarget] = useState<'collection' | 'wishlist'>('collection');
  
  const subscription = user?.profile?.subscription_tier;
  const planLimits = {
      free: { collection: 100, wishlist: 20 },
      lite: { collection: 100, wishlist: 20 },
      premium: { collection: Infinity, wishlist: Infinity }
  };
  const currentLimits = planLimits[subscription || 'free'];


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
            setCurrentPage('scanner');
        } else {
            setCurrentPage('home');
        }
    });

    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setAuthFlow('resetPassword');
    }
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
            setAuthFlow('resetPassword');
        } else if (event === 'SIGNED_IN') {
             if(sessionStorage.getItem('awaiting_confirmation')) {
                setAuthFlow('confirmed');
                sessionStorage.removeItem('awaiting_confirmation');
             } else if (window.location.hash.includes('type=recovery')) {
                setAuthFlow('resetPassword');
             }
             if (session?.aal !== 'aal1') {
                setCurrentPage('scanner');
             }
        } else if (event === 'SIGNED_OUT') {
            setCurrentPage('home');
            setInventory([]);
            setCollection([]);
            setWishlist([]);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refetchData = useCallback(async () => {
    if (user) {
      const newCollection = await getUserCollection(user.id);
      const newWishlist = await getUserWishlist(user.id);
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
      // Refetch user to get latest scan count
      refetchUser();
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? t(err.message) : t('scanner.errorGeneric');
      setError(errorMessage);
    } finally {
      setIsScanning(false);
    }
  }, [t, refetchUser]);
  
  const handleResetScanner = useCallback(() => {
    setInventory([]);
    setImagePreviews([]);
    setError(null);
    setIsScanning(false);
  }, []);
  
  const handleAddToCollection = async (items: GameItem[]) => {
    if (user) {
      if (collection.length + items.length > currentLimits.collection) {
        setLimitModalContent({
          title: t('limits.collection.title'),
          message: t('limits.collection.message', { limit: currentLimits.collection })
        });
        setIsLimitModalOpen(true);
        return;
      }
      await addToCollection(user.id, items);
      await refetchData();
    }
  };

  const handleAddToWishlist = async (items: GameItem[]) => {
    if (user) {
      if (wishlist.length + items.length > currentLimits.wishlist) {
        setLimitModalContent({
          title: t('limits.wishlist.title'),
          message: t('limits.wishlist.message', { limit: currentLimits.wishlist })
        });
        setIsLimitModalOpen(true);
        return;
      }
      await addToWishlist(user.id, items);
      await refetchData();
    }
  };
  
  const handleOpenManualAdd = (target: 'collection' | 'wishlist') => {
    setManualAddTarget(target);
    setIsManualAddModalOpen(true);
  };

  const handleManualAddItem = async (item: Omit<GameItem, 'id' | 'sourceId' | 'estimatedPrices'>, target: 'collection' | 'wishlist') => {
    if (user) {
      if (target === 'collection') {
        if (collection.length >= currentLimits.collection) {
          setLimitModalContent({
            title: t('limits.collection.title'),
            message: t('limits.collection.message', { limit: currentLimits.collection })
          });
          setIsLimitModalOpen(true);
          return;
        }
        await addManualItemToCollection(user.id, item);
      } else {
         if (wishlist.length >= currentLimits.wishlist) {
          setLimitModalContent({
            title: t('limits.wishlist.title'),
            message: t('limits.wishlist.message', { limit: currentLimits.wishlist })
          });
          setIsLimitModalOpen(true);
          return;
        }
        await addManualItemToWishlist(user.id, item);
      }
      await refetchData();
    }
  };

  const renderScannerPage = () => {
    if (inventory.length === 0 && !isScanning && !error) {
        return <ImageUploader onImageUpload={handleImageUpload} />;
    }
    if (isScanning) {
        return <Loader message={t('scanner.loader')} />;
    }
    if (error) {
        return (
            <div className="text-center p-8 bg-red-100 dark:bg-neutral-dark/50 backdrop-blur-sm border border-red-500 rounded-xl max-w-2xl w-full animate-fade-in">
                <h2 className="text-2xl font-bold text-red-700 dark:text-red-400 mb-4">{t('scanner.errorTitle')}</h2>
                <p className="text-red-800 dark:text-neutral-300 mb-6">{error}</p>
                <button
                    onClick={handleResetScanner}
                    className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-opacity"
                >
                    {t('common.tryAgain')}
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

  const renderPage = () => {
    if (!user) {
        if (currentPage === 'home') {
            return <HomePage onNavigateToLogin={() => setCurrentPage('scanner')} />;
        }
        return <LoginPage />;
    }

    switch (currentPage) {
        case 'scanner':
            return renderScannerPage();
        case 'collection':
            return <MyCollectionPage collection={collection} onDataChange={refetchData} onOpenManualAdd={() => handleOpenManualAdd('collection')} />;
        case 'wishlist':
            return <MyWishlistPage wishlist={wishlist} onDataChange={refetchData} onOpenManualAdd={() => handleOpenManualAdd('wishlist')} />;
        case 'analytics':
            return <AnalyticsPage collection={collection} />;
        case 'account':
            return <MyAccountPage onNavigate={setCurrentPage} />;
        case 'subscription':
            return <SubscriptionPage onNavigate={setCurrentPage}/>;
        case 'home': // User is logged in, redirect home to scanner
        default:
            return renderScannerPage();
    }
  }
  
  if (authFlow === 'resetPassword') {
    return <PasswordResetPage onResetSuccess={() => {
        setAuthFlow('idle');
        window.location.hash = '';
    }} />;
  }
  if (authFlow === 'confirmed') {
      return <EmailConfirmedPage onContinue={() => {
          setAuthFlow('idle');
          window.location.hash = '';
      }} />;
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-neutral-light dark:bg-neutral-darker"><Loader message="Initializing..." /></div>;
  }

  return (
    <>
    <Modal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        title={limitModalContent.title}
        confirmText={t('limits.upgradeButton')}
        onConfirm={() => {
          setIsLimitModalOpen(false);
          setCurrentPage('subscription');
        }}
    >
      <p>{limitModalContent.message}</p>
    </Modal>
    <ManualAddForm
      isOpen={isManualAddModalOpen}
      onClose={() => setIsManualAddModalOpen(false)}
      onAddItem={handleManualAddItem}
      targetList={manualAddTarget}
    />
    <div className="min-h-screen bg-neutral-light dark:bg-neutral-darker text-neutral-darker dark:text-neutral-light flex flex-col font-sans">
      <Header currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-grow container mx-auto p-4 md:p-8 flex flex-col items-center justify-center">
        {renderPage()}
      </main>
      <Footer />
    </div>
    </>
  );
};

export default App;