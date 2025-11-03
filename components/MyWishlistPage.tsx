import React from 'react';
import { GameItem } from '../types';
import { removeFromWishlist } from '../services/dbService';
import { useUser } from '../hooks/useUser';

interface MyWishlistPageProps {
  wishlist: GameItem[];
  onDataChange: () => void;
}

const MyWishlistPage: React.FC<MyWishlistPageProps> = ({ wishlist, onDataChange }) => {
  const { user } = useUser();

  const handleRemove = async (itemId: string) => {
    if (user && window.confirm("Are you sure you want to remove this item from your wishlist?")) {
      await removeFromWishlist(user.uid, itemId);
      onDataChange();
    }
  };

  return (
    <div className="w-full max-w-7xl animate-fade-in bg-neutral-dark/50 backdrop-blur-sm border border-neutral-light/10 rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8">
       <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold text-neutral-light">My Wishlist ({wishlist.length})</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full">
            <thead>
                <tr className="border-b border-neutral-light/10">
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Title</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Platform</th>
                    <th scope="col" className="px-5 py-3 text-left text-xs font-semibold text-neutral-400 uppercase tracking-wider">Actions</th>
                </tr>
            </thead>
            <tbody>
                {wishlist.map(item => (
                    <tr key={item.id} className="transition-colors border-b border-neutral-light/10 hover:bg-white/5">
                        <td className="px-5 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-neutral-light">{item.title}</div>
                            <div className="text-xs text-neutral-400">{item.publisher} ({item.releaseYear})</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-neutral-300">{item.platform}</td>
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
      {wishlist.length === 0 && (
         <div className="text-center py-16">
            <p className="text-neutral-400">Your wishlist is empty. Use the Scanner to add items!</p>
         </div>
       )}
    </div>
  );
};

export default MyWishlistPage;