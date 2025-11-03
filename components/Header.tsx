import React from 'react';
import { GameControllerIcon } from './icons/GameControllerIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { WishlistIcon } from './icons/WishlistIcon';
import { ScanIcon } from './icons/ScanIcon';
import { AnalyticsIcon } from './icons/AnalyticsIcon';
import { useUser } from '../hooks/useUser';
import { signOut } from '../services/authService';

type Page = 'scanner' | 'collection' | 'wishlist' | 'analytics';

interface HeaderProps {
    currentPage: Page;
    onNavigate: (page: Page) => void;
}

const NavButton: React.FC<{
    page: Page;
    currentPage: Page;
    onNavigate: (page: Page) => void;
    icon: React.ReactNode;
    label: string;
}> = ({ page, currentPage, onNavigate, icon, label }) => (
    <button
        onClick={() => onNavigate(page)}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            currentPage === page
            ? 'bg-brand-primary text-white'
            : 'text-neutral-300 hover:bg-neutral-dark hover:text-white'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user } = useUser();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <header className="bg-neutral-darker/50 backdrop-blur-sm border-b border-neutral-light/10 sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-glow-start to-glow-end rounded-lg">
                <GameControllerIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-light tracking-tight">
              AI Game Scanner
            </h1>
         </div>
         {user && (
            <div className="flex items-center gap-2 sm:gap-4">
                <nav className="flex items-center gap-1 sm:gap-2 bg-neutral-dark/50 p-1 rounded-lg border border-white/10">
                   <NavButton page="scanner" currentPage={currentPage} onNavigate={onNavigate} icon={<ScanIcon className="h-5 w-5" />} label="Scanner" />
                   <NavButton page="collection" currentPage={currentPage} onNavigate={onNavigate} icon={<CollectionIcon className="h-5 w-5" />} label="My Collection" />
                   <NavButton page="wishlist" currentPage={currentPage} onNavigate={onNavigate} icon={<WishlistIcon className="h-5 w-5" />} label="My Wishlist" />
                   <NavButton page="analytics" currentPage={currentPage} onNavigate={onNavigate} icon={<AnalyticsIcon className="h-5 w-5" />} label="Analytics" />
                </nav>
                <div className="flex items-center gap-3">
                    <div className="text-right hidden md:block">
                        <p className="text-sm font-medium text-neutral-light">{user.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-neutral-400 hover:text-white transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
         )}
      </div>
    </header>
  );
};

export default Header;