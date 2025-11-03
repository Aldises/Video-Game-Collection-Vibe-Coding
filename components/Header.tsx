import React from 'react';
import { useUser } from '../hooks/useUser';
import { GameControllerIcon } from './icons/GameControllerIcon';
import { ScanIcon } from './icons/ScanIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { WishlistIcon } from './icons/WishlistIcon';
import { Page } from '../App';


interface HeaderProps {
    currentPage: Page;
    setCurrentPage: (page: Page) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => {
  const { user, logout } = useUser();

  const navLinkClasses = (page: Page) => 
    `flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-300 ${
        currentPage === page 
        ? 'bg-brand-primary text-white shadow-md' 
        : 'text-neutral-300 hover:text-white'
    }`;


  return (
    <header className="bg-neutral-darker/50 backdrop-blur-sm border-b border-neutral-light/10 sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-glow-start to-glow-end rounded-lg">
                <GameControllerIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-light tracking-tight hidden md:block">
              AI Game Scanner
            </h1>
         </div>

        {user && (
            <div className="flex items-center gap-2 sm:gap-4">
                <nav className="flex items-center gap-1 p-1 bg-neutral-dark rounded-lg">
                    <button onClick={() => setCurrentPage('scanner')} className={navLinkClasses('scanner')}>
                        <ScanIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Scanner</span>
                    </button>
                    <button onClick={() => setCurrentPage('collection')} className={navLinkClasses('collection')}>
                        <CollectionIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">My Collection</span>
                    </button>
                     <button onClick={() => setCurrentPage('wishlist')} className={navLinkClasses('wishlist')}>
                        <WishlistIcon className="h-5 w-5" />
                        <span className="hidden sm:inline">Wishlist</span>
                    </button>
                </nav>
                <div className="flex items-center gap-2 sm:gap-4">
                    <span className="text-sm text-neutral-300 hidden lg:block">{user.email}</span>
                    <button 
                        onClick={logout}
                        className="text-neutral-300 hover:text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors"
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
