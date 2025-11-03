import React, { useState, useMemo } from 'react';
import { GameItem, PriceEstimate } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface InventoryTableProps {
  inventory: GameItem[];
  collection: GameItem[];
  wishlist: GameItem[];
  imagePreviews: string[];
  onReset: () => void;
  onAddToCollection: (items: GameItem[]) => void;
  onAddToWishlist: (items: GameItem[]) => void;
}

const InventoryTable: React.FC<InventoryTableProps> = ({ 
    inventory, 
    collection,
    wishlist,
    imagePreviews, 
    onReset,
    onAddToCollection,
    onAddToWishlist,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  }
  
  const getPrice = (prices: PriceEstimate[], source: string) => prices.find(p => p.source.toLowerCase().includes(source.toLowerCase()));

  const collectionTitles = useMemo(() => new Set(collection.map(item => `${item.title}-${item.platform}`)), [collection]);
  const wishlistTitles = useMemo(() => new Set(wishlist.map(item => `${item.title}-${item.platform}`)), [wishlist]);

  const handleSelect = (sourceId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sourceId)) {
        newSet.delete(sourceId);
      } else {
        newSet.add(sourceId);
      }
      return newSet;
    });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItems(new Set(inventory.map(item => item.sourceId!)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleAddClick = (target: 'collection' | 'wishlist') => {
    const itemsToAdd = inventory.filter(item => selectedItems.has(item.sourceId!));
    if (target === 'collection') {
      onAddToCollection(itemsToAdd);
    } else {
      onAddToWishlist(itemsToAdd);
    }
    setSelectedItems(new Set());
  };
  
  return (
    <div className="w-full bg-neutral-dark/50 backdrop-blur-sm border border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-neutral-light">Scan Results</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <button
                onClick={() => handleAddClick('collection')}
                disabled={selectedItems.size === 0}
                className="bg-sky-600 hover:bg-sky-500 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
            >
                Add to Collection ({selectedItems.size})
            </button>
            <button
                onClick={() => handleAddClick('wishlist')}
                disabled={selectedItems.size === 0}
                className="bg-amber-600 hover:bg-amber-500 disabled:bg-neutral-600 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-lg transition-colors"
            >
                Add to Wishlist ({selectedItems.size})
            </button>
            <button
                onClick={onReset}
                className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-lg transition-opacity w-full sm:w-auto"
            >
                Scan More
            </button>
        </div>
      </div>

      {imagePreviews.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4 text-neutral-200">Uploaded Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {imagePreviews.map((src, index) => (
                <img key={index} src={src} alt={`Uploaded collection preview ${index + 1}`} className="rounded-lg w-full object-cover aspect-square shadow-lg" />
            ))}
            </div>
          </div>
        )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-neutral-light/10">
              <th scope="col" className="p-4">
                <input type="checkbox" onChange={handleSelectAll} className="rounded" />
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Platform</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Est. Price (USD)</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Est. Price (CHF)</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sources</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.title} ${item.platform}`)}`;
              const ricardoSearchUrl = `https://www.ricardo.ch/fr/s/${encodeURIComponent(`${item.title} ${item.platform}`)}`;
              const ebayPrice = getPrice(item.estimatedPrices, 'ebay');
              const ricardoPrice = getPrice(item.estimatedPrices, 'ricardo');
              const itemKey = `${item.title}-${item.platform}`;
              const inCollection = collectionTitles.has(itemKey);
              const inWishlist = wishlistTitles.has(itemKey);

              return (
              <tr key={item.sourceId} className="transition-colors border-b border-neutral-light/10 hover:bg-white/5">
                <td className="p-4">
                    <input type="checkbox" checked={selectedItems.has(item.sourceId!)} onChange={() => handleSelect(item.sourceId!)} className="rounded" />
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-light">{item.title}</div>
                    <div className="text-xs text-neutral-400">{item.publisher} ({item.releaseYear})</div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.platform}</td>
                <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-green-400">
                    {ebayPrice ? formatCurrency(ebayPrice.average, ebayPrice.currency) : 'N/A'}
                </td>
                 <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-sky-400">
                    {ricardoPrice ? formatCurrency(ricardoPrice.average, ricardoPrice.currency) : 'N/A'}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm">
                    {inCollection && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-sky-800 text-sky-100">In Collection</span>}
                    {inWishlist && <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-800 text-amber-100">In Wishlist</span>}
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
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
       {inventory.length === 0 && (
         <div className="text-center py-16">
            <p className="text-neutral-400">No items were identified in the uploaded images.</p>
         </div>
       )}
    </div>
  );
};

export default InventoryTable;