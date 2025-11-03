import React, { useState, useMemo } from 'react';
import { GameItem } from '../types';
import { removeFromCollection } from '../services/dbService';
import { useUser } from '../hooks/useUser';
import { exportCollectionToCsv } from '../utils/csvUtils';
import { ExportIcon } from './icons/ExportIcon';
import { SortIcon } from './icons/SortIcon';
import { FilterIcon } from './icons/FilterIcon';

interface MyCollectionPageProps {
  collection: GameItem[];
  onDataChange: () => void;
}

type SortKey = 'title' | 'platform' | 'releaseYear' | 'publisher';
type SortDirection = 'asc' | 'desc';

const MyCollectionPage: React.FC<MyCollectionPageProps> = ({ collection, onDataChange }) => {
  const { user } = useUser();
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filters, setFilters] = useState({
    title: '',
    platform: '',
    publisher: '',
    releaseYear: ''
  });

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
    if (user && window.confirm("Are you sure you want to remove this item?")) {
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

  const SortableHeader: React.FC<{ headerKey: SortKey, label: string }> = ({ headerKey, label }) => (
    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">
        <button onClick={() => handleSort(headerKey)} className="flex items-center gap-1 group">
            {label}
            {sortKey === headerKey && <SortIcon className={`h-4 w-4 transition-transform ${sortDirection === 'asc' ? 'rotate-180' : ''}`} />}
        </button>
    </th>
  );
  
  return (
    <div className="w-full max-w-7xl animate-fade-in bg-neutral-dark/50 backdrop-blur-sm border border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-neutral-light">My Collection ({filteredAndSortedCollection.length})</h2>
        <button
            onClick={() => exportCollectionToCsv(collection)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-2.5 px-5 rounded-lg transition-opacity"
        >
            <ExportIcon className="h-5 w-5" />
            Export to CSV
        </button>
      </div>

      <div className="mb-6 p-4 bg-neutral-dark/30 rounded-lg border border-neutral-light/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <input type="text" name="title" placeholder="Filter by Title..." value={filters.title} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <select name="platform" value={filters.platform} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary">
                  <option value="">All Platforms</option>
                  {uniquePlatforms.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="text" name="publisher" placeholder="Filter by Publisher..." value={filters.publisher} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <input type="text" name="releaseYear" placeholder="Filter by Year..." value={filters.releaseYear} onChange={handleFilterChange} className="bg-neutral-darker border border-neutral-light/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" />
              <button onClick={resetFilters} className="bg-neutral-600 hover:bg-neutral-500 text-white font-bold py-2 px-4 rounded-md text-sm transition-colors">Clear</button>
          </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead>
                <tr className="border-b border-neutral-light/10">
                    <SortableHeader headerKey="title" label="Title" />
                    <SortableHeader headerKey="platform" label="Platform" />
                    <SortableHeader headerKey="releaseYear" label="Year" />
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody>
                {filteredAndSortedCollection.map(item => (
                    <tr key={item.id} className="transition-colors border-b border-neutral-light/10 hover:bg-white/5">
                        <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-light">{item.title}</div>
                            <div className="text-xs text-neutral-400">{item.publisher}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.platform}</td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.releaseYear}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                            <button
                                onClick={() => handleRemove(item.id!)}
                                className="text-red-500 hover:text-red-400 text-sm font-medium"
                            >
                                Remove
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
      {collection.length > 0 && filteredAndSortedCollection.length === 0 && (
          <div className="text-center py-16">
            <p className="text-neutral-400">No items match your current filters.</p>
         </div>
      )}
      {collection.length === 0 && (
         <div className="text-center py-16">
            <p className="text-neutral-400">Your collection is empty. Use the Scanner to add items!</p>
         </div>
       )}
    </div>
  );
};

export default MyCollectionPage;