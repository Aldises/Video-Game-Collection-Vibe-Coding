import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { GameItem, PriceEstimate } from '../types';
import { removeFromCollection, addToCollection, updateCollectionItem, removeItemsFromCollection, updateAllCollectionPrices } from '../services/dbService';
import { useUser } from '../hooks/useUser';
import { exportCollectionToCsv, parseCollectionFromCsv } from '../utils/csvUtils';
import { ExportIcon } from './icons/ExportIcon';
import { ImportIcon } from './icons/ImportIcon';
import { SortIcon } from './icons/SortIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { UploadIcon } from './icons/UploadIcon';
import { EditIcon } from './icons/EditIcon';
import { SaveIcon } from './icons/SaveIcon';
import { CancelIcon } from './icons/CancelIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowPathIcon } from './icons/ArrowPathIcon';
import Loader from './Loader';
import Modal from './Modal';
import { useLocalization } from '../hooks/useLocalization';
import Pagination from './Pagination';

interface MyCollectionPageProps {
  collection: GameItem[];
  onDataChange: () => void;
  onOpenManualAdd: () => void;
}

interface DuplicateGroup {
    key: string;
    items: GameItem[];
}

type SortKey = 'title' | 'platform' | 'releaseYear' | 'publisher' | 'itemType' | 'condition' | 'priceEbayUsd' | 'priceRicardoChf' | 'priceAnibisChf' | 'priceEbayEur';
type SortDirection = 'asc' | 'desc';

const MyCollectionPage: React.FC<MyCollectionPageProps> = ({ collection, onDataChange, onOpenManualAdd }) => {
  const { user } = useUser();
  const { t } = useLocalization();
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState({
    title: '',
    platform: '',
    publisher: '',
    releaseYear: ''
  });
  const [isImportView, setIsImportView] = useState(false);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editedItemData, setEditedItemData] = useState<GameItem | null>(null);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isFindingDuplicates, setIsFindingDuplicates] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [selectedForRemoval, setSelectedForRemoval] = useState<Set<number>>(new Set());
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const uniquePlatforms = useMemo(() => {
    const platforms = new Set(collection.map(item => item.platform));
    return Array.from(platforms).sort();
  }, [collection]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };
  
  const resetFilters = () => {
    setFilters({ title: '', platform: '', publisher: '', releaseYear: '' });
    setCurrentPage(1);
  };

  const handleRemove = async () => {
    if (user && itemToRemove !== null) {
      await removeFromCollection(user.id, itemToRemove);
      onDataChange();
      setItemToRemove(null);
    }
  };

  const handleEditClick = (item: GameItem) => {
    setEditingItemId(item.id!);
    setEditedItemData(item);
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditedItemData(null);
  };

  const handleSaveEdit = async () => {
    if (user && editedItemData) {
      await updateCollectionItem(user.id, editedItemData);
      onDataChange();
      setEditingItemId(null);
      setEditedItemData(null);
    }
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editedItemData) return;
    const { name, value } = e.target;
    setEditedItemData({
        ...editedItemData,
        [name]: name === 'releaseYear' ? parseInt(value, 10) || 0 : value,
    });
  };

  const filteredAndSortedCollection = useMemo(() => {
    const filtered = collection.filter(item => {
      return (
        item.title.toLowerCase().includes(filters.title.toLowerCase()) &&
        (filters.platform === '' || item.platform === filters.platform) &&
        item.publisher.toLowerCase().includes(filters.publisher.toLowerCase()) &&
        (filters.releaseYear === '' || item.releaseYear.toString().includes(filters.releaseYear))
      );
    });

    const getPriceAverage = (item: GameItem, sourceKey: SortKey): number => {
      let sourceName = '';
      switch (sourceKey) {
        case 'priceEbayUsd': sourceName = 'ebay.com'; break;
        case 'priceRicardoChf': sourceName = 'ricardo'; break;
        case 'priceAnibisChf': sourceName = 'anibis'; break;
        case 'priceEbayEur': sourceName = 'ebay.fr'; break;
        default: return -1;
      }
      const price = item.estimatedPrices.find(p => p.source.toLowerCase().includes(sourceName));
      return price ? price.average : -1; // Use -1 to sort items without a price to the bottom
    };

    return [...filtered].sort((a, b) => {
      let valA: string | number, valB: string | number;

      if (sortKey.startsWith('price')) {
        valA = getPriceAverage(a, sortKey as SortKey);
        valB = getPriceAverage(b, sortKey as SortKey);
      } else {
        valA = a[sortKey as keyof Omit<GameItem, 'id' | 'sourceId' | 'estimatedPrices'>];
        valB = b[sortKey as keyof Omit<GameItem, 'id' | 'sourceId' | 'estimatedPrices'>];
      }
      
      let comparison = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB);
      } else {
        if (valA > valB) {
            comparison = 1;
        } else if (valA < valB) {
            comparison = -1;
        }
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [collection, sortKey, sortDirection, filters]);
  
  const totalItems = filteredAndSortedCollection.length;
  const totalPages = itemsPerPage > 0 ? Math.ceil(totalItems / itemsPerPage) : 1;

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedCollection = useMemo(() => {
      if (itemsPerPage === 0) { // "All" is selected
          return filteredAndSortedCollection;
      }
      const startIndex = (currentPage - 1) * itemsPerPage;
      return filteredAndSortedCollection.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCollection, currentPage, itemsPerPage]);


  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };
  
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  }
  
  const getPrice = (prices: PriceEstimate[], source: string) => prices.find(p => p.source.toLowerCase().includes(source.toLowerCase()));

  const handleCsvImport = async (items: GameItem[]) => {
      if (user) {
          await addToCollection(user.id, items);
          onDataChange();
          setIsImportView(false);
      }
  }

  const handleExportClick = () => {
    const translations = {
        headers: {
            title: t('tableHeaders.title'),
            platform: t('tableHeaders.platform'),
            publisher: t('tableHeaders.publisher'),
            releaseYear: t('tableHeaders.year'),
            itemType: t('tableHeaders.itemType'),
            condition: t('tableHeaders.condition'),
            ebayComLow: 'eBay.com Price (Low)',
            ebayComAvg: 'eBay.com Price (Avg)',
            ebayComHigh: 'eBay.com Price (High)',
            ebayComCurrency: 'eBay.com Currency',
            ricardoLow: 'Ricardo Price (Low)',
            ricardoAvg: 'Ricardo Price (Avg)',
            ricardoHigh: 'Ricardo Price (High)',
            ricardoCurrency: 'Ricardo Currency',
            anibisLow: 'Anibis Price (Low)',
            anibisAvg: 'Anibis Price (Avg)',
            anibisHigh: 'Anibis Price (High)',
            anibisCurrency: 'Anibis Currency',
            ebayFrLow: 'eBay.fr Price (Low)',
            ebayFrAvg: 'eBay.fr Price (Avg)',
            ebayFrHigh: 'eBay.fr Price (High)',
            ebayFrCurrency: 'eBay.fr Currency',
        },
        alertEmpty: t('csv.alertEmptyCollection'),
    };
    exportCollectionToCsv(collection, translations);
  }
  
  const handleFindDuplicatesClick = () => {
    setIsFindingDuplicates(true);
    const itemsMap = new Map<string, GameItem[]>();
    collection.forEach(item => {
        const key = `${item.title.toLowerCase().trim()}-${item.platform.toLowerCase().trim()}`;
        if (!itemsMap.has(key)) {
            itemsMap.set(key, []);
        }
        itemsMap.get(key)!.push(item);
    });

    const foundDuplicates: DuplicateGroup[] = [];
    itemsMap.forEach((group, key) => {
        if (group.length > 1) {
            group.sort((a, b) => a.id! - b.id!);
            foundDuplicates.push({ key, items: group });
        }
    });
    
    setDuplicateGroups(foundDuplicates);
    setSelectedForRemoval(new Set());
    setIsFindingDuplicates(false);
    setIsDuplicateModalOpen(true);
  };

  const handleConfirmRemoveDuplicates = async () => {
    if (!user || selectedForRemoval.size === 0) {
        setIsDuplicateModalOpen(false);
        return;
    };
    setIsFindingDuplicates(true);
    setIsDuplicateModalOpen(false);
    try {
        const idsToRemove = Array.from(selectedForRemoval);
        await removeItemsFromCollection(user.id, idsToRemove);
        setNotification({ message: t('collection.duplicatesRemoved', { count: idsToRemove.length }), type: 'success' });
        onDataChange();
    } catch (error) {
        console.error("Error removing duplicates:", error);
        setNotification({ message: t('collection.duplicatesError'), type: 'error' });
    } finally {
        setIsFindingDuplicates(false);
        setDuplicateGroups([]);
        setSelectedForRemoval(new Set());
    }
  };

  const handleDuplicateSelection = (itemId: number) => {
    setSelectedForRemoval(prev => {
        const newSet = new Set(prev);
        if (newSet.has(itemId)) {
            newSet.delete(itemId);
        } else {
            newSet.add(itemId);
        }
        return newSet;
    });
  };

  // FIX: Explicitly set the type for `useMemo` to `number[]` to fix downstream type inference errors.
  const allRemovableIds = useMemo<number[]>(() => {
    return duplicateGroups.flatMap(g => g.items.slice(1).map(i => i.id!));
  }, [duplicateGroups]);

  const handleSelectAllRemovable = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedForRemoval(new Set(allRemovableIds));
    } else {
        setSelectedForRemoval(new Set());
    }
  };

  const handleUpdatePrices = async () => {
    if (!user) return;
    setIsUpdatingPrices(true);
    setUpdateProgress(0);
    try {
        await updateAllCollectionPrices(user.id, setUpdateProgress);
        setNotification({ message: t('collection.updatePricesSuccess'), type: 'success' });
        onDataChange();
    } catch (error) {
        console.error("Error updating prices:", error);
        setNotification({ message: t('collection.updatePricesError'), type: 'error' });
    } finally {
        setIsUpdatingPrices(false);
    }
  }

  const SortableHeader: React.FC<{ headerKey: SortKey, label: string }> = ({ headerKey, label }) => (
    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
        <button onClick={() => handleSort(headerKey)} className="flex items-center gap-1 group" disabled={isUpdatingPrices}>
            {label}
            {sortKey === headerKey && <SortIcon className={`h-4 w-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />}
        </button>
    </th>
  );
  
  const CsvImportView = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processFile = useCallback(async (file: File) => {
        if (!file || !file.name.endsWith('.csv')) {
            setError(t('csv.errorUpload'));
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const items = await parseCollectionFromCsv(file);
            if (items.length === 0) {
                setError(t('csv.errorNoValidItems'));
                setIsLoading(false);
                return;
            }
            await handleCsvImport(items);
        } catch (err) {
            const errorMessage = err instanceof Error ? t(err.message) : t('csv.errorParse');
            setError(errorMessage);
            setIsLoading(false);
        }
    }, [handleCsvImport, t]);

    const handleDrag = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }, []);
    const handleDragIn = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.items && e.dataTransfer.items.length > 0) setIsDragging(true); }, []);
    const handleDragOut = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { processFile(e.dataTransfer.files[0]); e.dataTransfer.clearData(); }}, [processFile]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files.length > 0) processFile(e.target.files[0]); };

    if (isLoading) {
        return <Loader message={t('collection.importLoader')} />;
    }
    
    return (
        <div className="w-full max-w-3xl text-center animate-fade-in">
            <h2 className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-light mb-2">{t('collection.importTitle')}</h2>
            <p className="text-lg text-neutral-500 dark:text-neutral-400 mb-8">{t('collection.importDesc')}</p>
            <div
                onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                className={`relative block w-full border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out ${isDragging ? 'border-brand-primary bg-brand-primary/10 ring-4 ring-brand-primary/20' : 'border-neutral-900/20 dark:border-neutral-light/20 hover:border-brand-secondary/70'}`}
            >
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                <div className="flex flex-col items-center justify-center">
                    <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-brand-primary/20' : 'bg-black/5 dark:bg-white/5'}`}><UploadIcon className={`h-12 w-12 transition-colors duration-300 ${isDragging ? 'text-brand-primary' : 'text-neutral-500 dark:text-neutral-400'}`} /></div>
                    <span className="mt-6 block text-md font-semibold text-neutral-900 dark:text-neutral-light">
                        {t('collection.importDrop')}{' '}
                        <button onClick={() => fileInputRef.current?.click()} type="button" className="font-semibold bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 transition-opacity focus:outline-none">{t('collection.importBrowse')}</button>
                    </span>
                    <p className="mt-1 block text-sm text-neutral-400 dark:text-neutral-500">{t('collection.importFormat')}</p>
                </div>
            </div>
            {error && <p className="text-red-600 dark:text-red-400 mt-4">{error}</p>}
            <button onClick={() => setIsImportView(false)} className="mt-8 bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">{t('collection.backToCollection')}</button>
        </div>
    );
  }

  if (isImportView) {
      return (
        <div className="w-full max-w-7xl animate-fade-in bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <CsvImportView />
        </div>
      );
  }
  
  if (isUpdatingPrices) {
    return (
        <div className="w-full max-w-7xl animate-fade-in bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 flex items-center justify-center">
            <Loader message={t('collection.updatePricesLoader', { progress: updateProgress })} />
        </div>
    );
  }
  
  const defaultInputClass = "bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-primary";
  const notificationClass = notification?.type === 'success'
    ? 'bg-green-100 dark:bg-green-900/80 border-green-500 text-green-800 dark:text-green-200'
    : 'bg-red-100 dark:bg-red-900/80 border-red-500 text-red-800 dark:text-red-200';

  return (
    <>
    {notification && (
        <div className={`fixed top-24 right-8 z-50 backdrop-blur-sm px-6 py-3 rounded-lg shadow-lg animate-fade-in ${notificationClass}`}>
            {notification.message}
        </div>
    )}
    <Modal
        isOpen={itemToRemove !== null}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleRemove}
        title={t('collection.confirmRemoveTitle')}
        confirmText={t('common.delete')}
        confirmVariant="danger"
    >
        {t('collection.confirmRemoveMessage')}
    </Modal>
    <Modal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        onConfirm={handleConfirmRemoveDuplicates}
        title={t('collection.duplicatesModal.title')}
        confirmText={t('collection.duplicatesModal.confirmAction', { count: selectedForRemoval.size })}
        confirmVariant="danger"
    >
        {duplicateGroups.length > 0 ? (
        <div className="max-h-[60vh] overflow-y-auto pr-2 space-y-4">
            <div className="flex items-center justify-between p-2 rounded-md bg-gray-100 dark:bg-neutral-dark">
                <label htmlFor="select-all-duplicates" className="flex items-center gap-2 text-sm font-medium">
                    <input
                        id="select-all-duplicates"
                        type="checkbox"
                        className="rounded"
                        checked={selectedForRemoval.size === allRemovableIds.length && allRemovableIds.length > 0}
                        onChange={handleSelectAllRemovable}
                        // FIX: The ref callback for setting the indeterminate state was returning a boolean,
                        // which is not allowed. Changed to a block statement to ensure it returns void.
                        ref={el => {
                            if (el) {
                                el.indeterminate = selectedForRemoval.size > 0 && selectedForRemoval.size < allRemovableIds.length;
                            }
                        }}
                    />
                    {t('collection.duplicatesModal.selectAll')}
                </label>
            </div>
            {duplicateGroups.map(group => (
                <div key={group.key} className="p-3 border border-neutral-900/10 dark:border-neutral-light/10 rounded-lg">
                    <h4 className="font-bold text-neutral-900 dark:text-neutral-light capitalize">{group.key.replace(/-/g, ' - ')}</h4>
                    <ul className="mt-2 space-y-1">
                        {group.items.map((item, index) => (
                            <li key={item.id} className={`flex items-center justify-between p-2 rounded text-sm ${index === 0 ? 'bg-green-50 dark:bg-green-900/30' : 'hover:bg-gray-100 dark:hover:bg-neutral-dark'}`}>
                                <div className="flex items-center gap-3">
                                    {index > 0 ? (
                                        <input
                                            type="checkbox"
                                            className="rounded"
                                            checked={selectedForRemoval.has(item.id!)}
                                            onChange={() => handleDuplicateSelection(item.id!)}
                                        />
                                    ) : (
                                        <div className="w-5 h-5 flex-shrink-0" /> // Placeholder for alignment
                                    )}
                                    <span>
                                        ID: {item.id}, {item.condition}, {item.releaseYear}, {item.publisher}
                                    </span>
                                </div>
                                {index === 0 && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-100">
                                        {t('collection.duplicatesModal.keep')}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    ) : (
        <p>{t('collection.noDuplicatesFound')}</p>
    )}
    </Modal>
    <div className="w-full max-w-7xl animate-fade-in bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light">{t('collection.title', { count: totalItems })}</h2>
        <div className="flex items-center gap-4 flex-wrap justify-center">
            <button
                onClick={onOpenManualAdd}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
            >
                {t('collection.addManually')}
            </button>
            <button
                onClick={handleUpdatePrices}
                disabled={isFindingDuplicates}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
            >
                <ArrowPathIcon className="h-5 w-5" />
                {t('collection.updatePrices')}
            </button>
            <button
                onClick={handleFindDuplicatesClick}
                disabled={isFindingDuplicates}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:bg-neutral-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
            >
                <SparklesIcon className="h-5 w-5" />
                {isFindingDuplicates ? t('common.processing') : t('collection.removeDuplicates')}
            </button>
            <button
                onClick={() => setIsImportView(true)}
                className="inline-flex items-center gap-2 bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
            >
                <ImportIcon className="h-5 w-5" />
                {t('collection.import')}
            </button>
            <button
                onClick={handleExportClick}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-lg transition-opacity"
            >
                <ExportIcon className="h-5 w-5" />
                {t('collection.export')}
            </button>
        </div>
      </div>

      <div className="mb-6 p-4 bg-gray-200/30 dark:bg-neutral-dark/30 rounded-lg border border-neutral-900/10 dark:border-neutral-light/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <input type="text" name="title" placeholder={t('collection.filterTitle')} value={filters.title} onChange={handleFilterChange} className="bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <select name="platform" value={filters.platform} onChange={handleFilterChange} className="bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="">{t('collection.filterPlatform')}</option>
                  {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="text" name="publisher" placeholder={t('collection.filterPublisher')} value={filters.publisher} onChange={handleFilterChange} className="bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <input type="text" name="releaseYear" placeholder={t('collection.filterYear')} value={filters.releaseYear} onChange={handleFilterChange} className="bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <button onClick={resetFilters} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">{t('common.clear')}</button>
          </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead>
                <tr className="border-b border-neutral-900/10 dark:border-neutral-light/10">
                    <SortableHeader headerKey="title" label={t('tableHeaders.title')} />
                    <SortableHeader headerKey="platform" label={t('tableHeaders.platform')} />
                    <SortableHeader headerKey="publisher" label={t('tableHeaders.publisher')} />
                    <SortableHeader headerKey="releaseYear" label={t('tableHeaders.year')} />
                    <SortableHeader headerKey="itemType" label={t('tableHeaders.itemType')} />
                    <SortableHeader headerKey="condition" label={t('tableHeaders.condition')} />
                    <SortableHeader headerKey="priceEbayUsd" label={t('tableHeaders.priceEbayUsd')} />
                    <SortableHeader headerKey="priceRicardoChf" label={t('tableHeaders.priceRicardoChf')} />
                    <SortableHeader headerKey="priceAnibisChf" label={t('tableHeaders.priceAnibisChf')} />
                    <SortableHeader headerKey="priceEbayEur" label={t('tableHeaders.priceEbayEur')} />
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('tableHeaders.sources')}</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
            </thead>
            <tbody>
                {paginatedCollection.map(item => {
                    const isEditing = editingItemId === item.id;
                    if (isEditing) {
                        return (
                            <tr key={item.id} className="bg-brand-secondary/10 border-b border-brand-secondary/20">
                                <td className="px-5 py-2"><input type="text" name="title" value={editedItemData?.title} onChange={handleEditChange} className={defaultInputClass} /></td>
                                <td className="px-5 py-2"><input type="text" name="platform" value={editedItemData?.platform} onChange={handleEditChange} className={defaultInputClass} /></td>
                                <td className="px-5 py-2"><input type="text" name="publisher" value={editedItemData?.publisher} onChange={handleEditChange} className={defaultInputClass} /></td>
                                <td className="px-5 py-2"><input type="number" name="releaseYear" value={editedItemData?.releaseYear} onChange={handleEditChange} className={defaultInputClass} /></td>
                                <td className="px-5 py-2">
                                    <select name="itemType" value={editedItemData?.itemType} onChange={handleEditChange} className={defaultInputClass}>
                                        <option value="Game">Game</option>
                                        <option value="Console">Console</option>
                                        <option value="Accessory">Accessory</option>
                                    </select>
                                </td>
                                <td className="px-5 py-2">
                                    <select name="condition" value={editedItemData?.condition} onChange={handleEditChange} className={defaultInputClass}>
                                        <option value="Boxed">{t('conditions.boxed')}</option>
                                        <option value="Loose">{t('conditions.loose')}</option>
                                        <option value="Unknown">{t('conditions.unknown')}</option>
                                    </select>
                                </td>
                                <td colSpan={5} className="px-5 py-2 text-sm text-neutral-500 dark:text-neutral-400">{t('collection.editingLocked')}</td>
                                <td className="px-5 py-2 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <button onClick={handleSaveEdit} className="text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300" title={t('common.save')}><SaveIcon className="h-5 w-5"/></button>
                                        <button onClick={handleCancelEdit} className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300" title={t('common.cancel')}><CancelIcon className="h-5 w-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        )
                    }

                    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.title} ${item.platform}`)}`;
                    const ricardoSearchUrl = `https://www.ricardo.ch/fr/s/${encodeURIComponent(`${item.title} ${item.platform}`)}`;
                    const anibisSearchUrl = `https://www.anibis.ch/fr/s?s=${encodeURIComponent(`${item.title} ${item.platform}`)}`;
                    const ebayFrSearchUrl = `https://www.ebay.fr/sch/i.html?_nkw=${encodeURIComponent(`${item.title} ${item.platform}`)}`;
                    
                    const ebayPrice = getPrice(item.estimatedPrices, 'ebay.com');
                    const ricardoPrice = getPrice(item.estimatedPrices, 'ricardo');
                    const anibisPrice = getPrice(item.estimatedPrices, 'anibis');
                    const ebayFrPrice = getPrice(item.estimatedPrices, 'ebay.fr');

                    return (
                    <tr key={item.id} className="transition-colors border-b border-neutral-900/10 dark:border-neutral-light/10 hover:bg-black/5 dark:hover:bg-white/5">
                        <td className="px-5 py-4 whitespace-nowrap"><div className="text-sm font-medium text-neutral-900 dark:text-neutral-light">{item.title}</div></td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">{item.platform}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">{item.publisher}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">{item.releaseYear}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">{item.itemType}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">{t(`conditions.${item.condition?.toLowerCase()}`)}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-green-600 dark:text-green-400">{ebayPrice ? formatCurrency(ebayPrice.average, ebayPrice.currency) : 'N/A'}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-sky-600 dark:text-sky-400">{ricardoPrice ? formatCurrency(ricardoPrice.average, ricardoPrice.currency) : 'N/A'}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-sky-600 dark:text-sky-400">{anibisPrice ? formatCurrency(anibisPrice.average, anibisPrice.currency) : 'N/A'}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-purple-600 dark:text-purple-400">{ebayFrPrice ? formatCurrency(ebayFrPrice.average, ebayFrPrice.currency) : 'N/A'}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                          <div className="flex items-center gap-4 flex-wrap">
                              <a href={ebaySearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors group">eBay.com <ExternalLinkIcon className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></a>
                              <a href={ricardoSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors group">Ricardo <ExternalLinkIcon className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></a>
                              <a href={anibisSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors group">Anibis <ExternalLinkIcon className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></a>
                              <a href={ebayFrSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors group">eBay.fr <ExternalLinkIcon className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" /></a>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-4">
                                <button onClick={() => handleEditClick(item)} disabled={isUpdatingPrices} className="text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed" title={t('common.edit')}><EditIcon className="h-5 w-5"/></button>
                                <button onClick={() => setItemToRemove(item.id!)} disabled={isUpdatingPrices} className="text-red-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed" title={t('common.remove')}><TrashIcon className="h-5 w-5"/></button>
                            </div>
                        </td>
                    </tr>
                    );
                })}
            </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={totalItems}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
        }}
      />
      
      {collection.length > 0 && paginatedCollection.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-500 dark:text-neutral-400">{t('collection.noMatch')}</p>
         </div>
      )}
      {collection.length === 0 && (
         <div className="text-center py-16">
            <p className="text-neutral-500 dark:text-neutral-400">{t('collection.empty')}</p>
         </div>
       )}
    </div>
    </>
  );
};

export default MyCollectionPage;