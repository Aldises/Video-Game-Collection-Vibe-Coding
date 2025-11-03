import React, { useState, useMemo } from 'react';
import { GameItem, PriceEstimate } from '../types';
import { FilterIcon } from './icons/FilterIcon';
import { SortIcon } from './icons/SortIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface MyWishlistPageProps {
  wishlist: GameItem[];
  onRemove: (itemId: string) => void;
}

type SortKey = 'title' | 'platform' | 'releaseYear' | 'estimatedPrice';
type SortDirection = 'ascending' | 'descending';

const MyWishlistPage: React.FC<MyWishlistPageProps> = ({ wishlist, onRemove }) => {
  const [filters, setFilters] = useState({
    query: '',
    platform: 'all',
  });
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'title', direction: 'ascending' });

  const platforms = useMemo(() => ['all', ...Array.from(new Set(wishlist.map(item => item.platform)))], [wishlist]);
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (key: SortKey) => {
    if (!sortConfig || sortConfig.key !== key) {
        return <SortIcon className="h-4 w-4 text-neutral-500 inline-block ml-1 opacity-50" />;
    }
    return <span className={`transition-transform duration-200 inline-block ${sortConfig.direction === 'ascending' ? 'rotate-0' : 'rotate-180'}`}>▲</span>;
  };

  const getPrice = (prices: PriceEstimate[], source: string) => prices.find(p => p.source.toLowerCase().includes(source));

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  }

  const filteredAndSortedWishlist = useMemo(() => {
    let filteredItems = wishlist.filter(item => {
      const queryMatch = item.title.toLowerCase().includes(filters.query.toLowerCase());
      const platformMatch = filters.platform === 'all' || item.platform === filters.platform;
      return queryMatch && platformMatch;
    });

    if (sortConfig !== null) {
      filteredItems.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;
        
        if (sortConfig.key === 'estimatedPrice') {
            aValue = getPrice(a.estimatedPrices, 'ebay')?.average ?? 0;
            bValue = getPrice(b.estimatedPrices, 'ebay')?.average ?? 0;
        } else {
            aValue = a[sortConfig.key as 'title' | 'platform' | 'releaseYear'];
            bValue = b[sortConfig.key as 'title' | 'platform' | 'releaseYear'];
        }

        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return filteredItems;
  }, [wishlist, filters, sortConfig]);


  if (wishlist.length === 0) {
    return (
        <div className="text-center py-10 animate-fade-in">
            <h2 className="text-3xl font-bold text-neutral-light mb-2">Your Wishlist is Empty</h2>
            <p className="text-lg text-neutral-400">Use the Scanner to find items and add them to your wishlist.</p>
        </div>
    );
  }

  return (
    <div className="w-full max-w-7xl bg-neutral-dark/50 backdrop-blur-sm border border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-neutral-light">My Wishlist</h2>
      </div>

      <div className="bg-black/20 p-4 rounded-lg mb-6 border border-neutral-light/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input
              type="text"
              name="query"
              placeholder="Search by title..."
              value={filters.query}
              onChange={handleFilterChange}
              className="col-span-1 bg-neutral-dark/50 border border-neutral-light/10 rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary"
            />
            <select name="platform" value={filters.platform} onChange={handleFilterChange} className="col-span-1 bg-neutral-dark/50 border border-neutral-light/10 rounded-md px-3 py-2 text-sm focus:ring-brand-primary focus:border-brand-primary">
              {platforms.map(p => <option key={p} value={p}>{p === 'all' ? 'All Platforms' : p}</option>)}
            </select>
        </div>
    </div>
      
    <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-neutral-light/10">
              {(['title', 'platform', 'releaseYear', 'estimatedPrice'] as SortKey[]).map((key) => (
                <th key={key} scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  <button onClick={() => requestSort(key)} className="flex items-center gap-2 hover:text-white transition-colors">
                     <span>{key.replace('estimatedPrice', 'Est. Price')}</span>
                     <span className="w-4">{getSortIndicator(key)}</span>
                  </button>
                </th>
              ))}
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Sources</th>
              <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedWishlist.map((item) => {
              const ebaySearchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(`${item.title} ${item.platform}`)}`;
              const ricardoSearchUrl = `https://www.ricardo.ch/fr/s/${encodeURIComponent(`${item.title} ${item.platform}`)}`;
              const ebayPrice = getPrice(item.estimatedPrices, 'ebay');
              const ricardoPrice = getPrice(item.estimatedPrices, 'ricardo');

              return (
              <tr key={item.id} className="hover:bg-white/5 transition-colors border-b border-neutral-light/10">
                <td className="px-5 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-neutral-light">{item.title}</div>
                    <div className="text-xs text-neutral-400">{item.publisher}</div>
                </td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.platform}</td>
                <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.releaseYear}</td>
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
                <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <button onClick={() => onRemove(item.id!)} className="text-red-500 hover:text-red-400 transition-colors">Remove</button>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
       {filteredAndSortedWishlist.length === 0 && (
         <div className="text-center py-16">
            <p className="text-neutral-400">No items on your wishlist match the current filters.</p>
         </div>
       )}
    </div>
  );
};

export default MyWishlistPage;
