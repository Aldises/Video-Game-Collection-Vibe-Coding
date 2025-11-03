import React, { useState, useEffect } from 'react';
import { GameItem, PriceEstimate } from '../types';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface InventoryTableProps {
  inventory: GameItem[];
  imagePreviews: string[];
  onReset: () => void;
  myCollection: GameItem[];
  myWishlist: GameItem[];
  onAddMultipleToCollection: (items: GameItem[]) => void;
  onAddMultipleToWishlist: (items: GameItem[]) => void;
}

type ItemStatus = 'in-collection' | 'on-wishlist' | 'none';

const InventoryTable: React.FC<InventoryTableProps> = ({ 
    inventory, 
    imagePreviews, 
    onReset, 
    myCollection, 
    myWishlist, 
    onAddMultipleToCollection,
    onAddMultipleToWishlist
}) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  
  useEffect(() => {
    setSelectedItems([]);
  }, [inventory]);

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  }

  const getItemStatus = (item: GameItem): ItemStatus => {
    if (myCollection.some(collectionItem => collectionItem.title === item.title && collectionItem.platform === item.platform)) {
        return 'in-collection';
    }
    if (myWishlist.some(wishlistItem => wishlistItem.title === item.title && wishlistItem.platform === item.platform)) {
        return 'on-wishlist';
    }
    return 'none';
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allSelectableIds = inventory
        .filter(item => getItemStatus(item) === 'none')
        .map(item => item.sourceId!);
      setSelectedItems(allSelectableIds);
    } else {
      setSelectedItems([]);
    }
  };

  const handleSelectItem = (sourceId: string) => {
    setSelectedItems(prev => 
      prev.includes(sourceId) 
        ? prev.filter(id => id !== sourceId)
        : [...prev, sourceId]
    );
  };

  const handleAddSelectedToCollection = () => {
    const itemsToAdd = inventory.filter(item => selectedItems.includes(item.sourceId!));
    onAddMultipleToCollection(itemsToAdd);
    setSelectedItems([]);
  }

  const handleAddSelectedToWishlist = () => {
    const itemsToAdd = inventory.filter(item => selectedItems.includes(item.sourceId!));
    onAddMultipleToWishlist(itemsToAdd);
    setSelectedItems([]);
  }

  const selectableItemsCount = inventory.filter(item => getItemStatus(item) === 'none').length;
  const isAllSelected = selectableItemsCount > 0 && selectedItems.length === selectableItemsCount;
  
  const getPrice = (prices: PriceEstimate[], source: string) => prices.find(p => p.source.toLowerCase() === source.toLowerCase());

  return (
    <div className="w-full bg-neutral-dark/50 backdrop-blur-sm border border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-neutral-light">Scan Results</h2>
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
             <button
                onClick={handleAddSelectedToWishlist}
                disabled={selectedItems.length === 0}
                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all duration-300 w-full sm:w-auto disabled:bg-neutral-600 disabled:cursor-not-allowed disabled:hover:opacity-100 disabled:opacity-50"
            >
                Add to Wishlist ({selectedItems.length})
            </button>
            <button
                onClick={handleAddSelectedToCollection}
                disabled={selectedItems.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-5 rounded-lg transition-all duration-300 w-full sm:w-auto disabled:bg-neutral-600 disabled:cursor-not-allowed disabled:hover:opacity-100 disabled:opacity-50"
            >
                Add to Collection ({selectedItems.length})
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
                <input 
                  type="checkbox"
                  className="h-4 w-4 rounded bg-transparent border-neutral-medium/50 text-brand-primary focus:ring-brand-primary focus:ring-2"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  disabled={selectableItemsCount === 0}
                />
              </th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Title</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Platform</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Est. Price</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sources</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item) => {
              const status = getItemStatus(item);
              const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.title} ${item.platform}`)}`;
              const ricardoSearchUrl = `https://www.ricardo.ch/fr/s/${encodeURIComponent(`${item.title} ${item.platform}`)}`;
              const ebayPrice = getPrice(item.estimatedPrices, 'ebay');
              const ricardoPrice = getPrice(item.estimatedPrices, 'ricardo');

              return (
              <tr key={item.sourceId} className={`transition-colors border-b border-neutral-light/10 ${selectedItems.includes(item.sourceId!) ? 'bg-brand-primary/10' : 'hover:bg-white/5'}`}>
                <td className="p-4 whitespace-nowrap">
                   {status === 'none' && (
                    <input 
                      type="checkbox"
                      className="h-4 w-4 rounded bg-transparent border-neutral-medium/50 text-brand-primary focus:ring-brand-primary focus:ring-2"
                      checked={selectedItems.includes(item.sourceId!)}
                      onChange={() => handleSelectItem(item.sourceId!)}
                    />
                   )}
                </td>
                <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-light">{item.title}</div>
                    <div className="text-xs text-neutral-400">{item.publisher} ({item.releaseYear})</div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.platform}</td>
                <td className="px-5 py-4 whitespace-nowrap">
                    {ebayPrice && <div className="text-sm font-semibold text-green-400">{formatCurrency(ebayPrice.average, ebayPrice.currency)}</div>}
                    {ricardoPrice && <div className="text-xs font-medium text-sky-400">{formatCurrency(ricardoPrice.average, ricardoPrice.currency)}</div>}
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">
                    <div className="flex flex-col gap-1.5">
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
                <td className="px-5 py-4 whitespace-nowrap text-sm font-medium">
                  {status === 'in-collection' ? (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                        In Collection
                    </span>
                  ) : status === 'on-wishlist' ? (
                     <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-300">
                        On Wishlist
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-500/20 text-neutral-300">
                        Not Added
                    </span>
                  )}
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
