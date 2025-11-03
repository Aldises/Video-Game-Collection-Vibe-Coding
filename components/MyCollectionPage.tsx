import React, { useState, useMemo, useCallback, useRef } from 'react';
import { GameItem, PriceEstimate } from '../types';
import { removeFromCollection, addToCollection } from '../services/dbService';
import { useUser } from '../hooks/useUser';
import { exportCollectionToCsv, parseCollectionFromCsv } from '../utils/csvUtils';
import { ExportIcon } from './icons/ExportIcon';
import { ImportIcon } from './icons/ImportIcon';
import { SortIcon } from './icons/SortIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import { UploadIcon } from './icons/UploadIcon';
import Loader from './Loader';
import { useLocalization } from '../hooks/useLocalization';

interface MyCollectionPageProps {
  collection: GameItem[];
  onDataChange: () => void;
}

type SortKey = 'title' | 'platform' | 'releaseYear' | 'publisher';
type SortDirection = 'asc' | 'desc';

const MyCollectionPage: React.FC<MyCollectionPageProps> = ({ collection, onDataChange }) => {
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

  const uniquePlatforms = useMemo(() => {
    const platforms = new Set(collection.map(item => item.platform));
    return Array.from(platforms).sort();
  }, [collection]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const resetFilters = () => {
    setFilters({ title: '', platform: '', publisher: '', releaseYear: '' });
  };

  const handleRemove = async (itemId: string) => {
    if (user && window.confirm(t('collection.confirmRemove'))) {
      await removeFromCollection(user.uid, itemId);
      onDataChange();
    }
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

    return [...filtered].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      
      let comparison = 0;
      if (valA > valB) {
        comparison = 1;
      } else if (valA < valB) {
        comparison = -1;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [collection, sortKey, sortDirection, filters]);

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
          await addToCollection(user.uid, items);
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
            ebayLow: 'eBay Price (Low)',
            ebayAvg: 'eBay Price (Avg)',
            ebayHigh: 'eBay Price (High)',
            ebayCurrency: 'eBay Currency',
            ricardoLow: 'Ricardo Price (Low)',
            ricardoAvg: 'Ricardo Price (Avg)',
            ricardoHigh: 'Ricardo Price (High)',
            ricardoCurrency: 'Ricardo Currency',
        },
        alertEmpty: t('csv.alertEmptyCollection'),
    };
    exportCollectionToCsv(collection, translations);
  }

  const SortableHeader: React.FC<{ headerKey: SortKey, label: string }> = ({ headerKey, label }) => (
    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        <button onClick={() => handleSort(headerKey)} className="flex items-center gap-1 group">
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
    }, []);

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
            <h2 className="text-4xl font-extrabold text-neutral-light mb-2">{t('collection.importTitle')}</h2>
            <p className="text-lg text-neutral-400 mb-8">{t('collection.importDesc')}</p>
            <div
                onDragEnter={handleDragIn} onDragLeave={handleDragOut} onDragOver={handleDrag} onDrop={handleDrop}
                className={`relative block w-full border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ease-in-out ${isDragging ? 'border-brand-primary bg-brand-primary/10 ring-4 ring-brand-primary/20' : 'border-neutral-light/20 hover:border-brand-secondary/70'}`}
            >
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                <div className="flex flex-col items-center justify-center">
                    <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-brand-primary/20' : 'bg-white/5'}`}><UploadIcon className={`h-12 w-12 transition-colors duration-300 ${isDragging ? 'text-brand-primary' : 'text-neutral-400'}`} /></div>
                    <span className="mt-6 block text-md font-semibold text-neutral-light">
                        {t('collection.importDrop')}{' '}
                        <button onClick={() => fileInputRef.current?.click()} type="button" className="font-semibold bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 transition-opacity focus:outline-none">{t('collection.importBrowse')}</button>
                    </span>
                    <p className="mt-1 block text-sm text-neutral-500">{t('collection.importFormat')}</p>
                </div>
            </div>
            {error && <p className="text-red-400 mt-4">{error}</p>}
            <button onClick={() => setIsImportView(false)} className="mt-8 bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-6 rounded-lg transition-colors">{t('collection.backToCollection')}</button>
        </div>
    );
  }

  if (isImportView) {
      return (
        <div className="w-full max-w-7xl animate-fade-in bg-neutral-dark/50 backdrop-blur-sm border border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 flex items-center justify-center">
          <CsvImportView />
        </div>
      );
  }

  return (
    <div className="w-full max-w-7xl animate-fade-in bg-neutral-dark/50 backdrop-blur-sm border border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-neutral-light">{t('collection.title', { count: filteredAndSortedCollection.length })}</h2>
        <div className="flex items-center gap-4">
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

      <div className="mb-6 p-4 bg-neutral-dark/30 rounded-lg border border-neutral-light/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <input type="text" name="title" placeholder={t('collection.filterTitle')} value={filters.title} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <select name="platform" value={filters.platform} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="">{t('collection.filterPlatform')}</option>
                  {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="text" name="publisher" placeholder={t('collection.filterPublisher')} value={filters.publisher} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <input type="text" name="releaseYear" placeholder={t('collection.filterYear')} value={filters.releaseYear} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <button onClick={resetFilters} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">{t('common.clear')}</button>
          </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead>
                <tr className="border-b border-neutral-light/10">
                    <SortableHeader headerKey="title" label={t('tableHeaders.title')} />
                    <SortableHeader headerKey="platform" label={t('tableHeaders.platform')} />
                    <SortableHeader headerKey="publisher" label={t('tableHeaders.publisher')} />
                    <SortableHeader headerKey="releaseYear" label={t('tableHeaders.year')} />
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">{t('tableHeaders.priceUsd')}</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">{t('tableHeaders.priceChf')}</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">{t('tableHeaders.sources')}</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">{t('common.actions')}</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndSortedCollection.map(item => {
                    const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.title} ${item.platform}`)}`;
                    const ricardoSearchUrl = `https://www.ricardo.ch/fr/s/${encodeURIComponent(`${item.title} ${item.platform}`)}`;
                    const ebayPrice = getPrice(item.estimatedPrices, 'ebay');
                    const ricardoPrice = getPrice(item.estimatedPrices, 'ricardo');

                    return (
                    <tr key={item.id} className="transition-colors border-b border-neutral-light/10 hover:bg-white/5">
                        <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-light">{item.title}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.platform}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.publisher}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.releaseYear}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-green-400">
                            {ebayPrice ? formatCurrency(ebayPrice.average, ebayPrice.currency) : 'N/A'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-sky-400">
                            {ricardoPrice ? formatCurrency(ricardoPrice.average, ricardoPrice.currency) : 'N/A'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">
                          <div className="flex items-center gap-4">
                              <a href={ebaySearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors group">
                                  eBay
                                  <ExternalLinkIcon className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </a>
                              <a href={ricardoSearchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors group">
                                  Ricardo
                                  <ExternalLinkIcon className="h-4 w-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                              </a>
                          </div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                            <button
                                onClick={() => handleRemove(item.id!)}
                                className="text-red-500 hover:text-red-400 text-sm font-medium"
                            >
                                {t('common.remove')}
                            </button>
                        </td>
                    </tr>
                    );
                })}
            </tbody>
        </table>
      </div>
      {collection.length > 0 && filteredAndSortedCollection.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400">{t('collection.noMatch')}</p>
         </div>
      )}
      {collection.length === 0 && (
         <div className="text-center py-16">
            <p className="text-neutral-400">{t('collection.empty')}</p>
         </div>
       )}
    </div>
  );
};

export default MyCollectionPage;