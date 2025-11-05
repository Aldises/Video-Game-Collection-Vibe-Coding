import React, { useState } from 'react';
import { GameControllerIcon } from './icons/GameControllerIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { WishlistIcon } from './icons/WishlistIcon';
import { ScanIcon } from './icons/ScanIcon';
import { AnalyticsIcon } from './icons/AnalyticsIcon';
import { LanguageIcon } from './icons/LanguageIcon';
import { AccountIcon } from './icons/AccountIcon';
import { useUser } from '../hooks/useUser';
import { signOut } from '../services/authService';
import { useLocalization } from '../hooks/useLocalization';
import { Page } from '../App';

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
            : 'text-neutral-700 dark:text-neutral-300 hover:bg-gray-200 dark:hover:bg-neutral-dark hover:text-black dark:hover:text-white'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const LanguageSelector: React.FC = () => {
    const { language, setLanguage } = useLocalization();
    const [isOpen, setIsOpen] = useState(false);
    const languages = {
        en: 'English',
        fr: 'Français',
        de: 'Deutsch'
    };

    const handleSelectLanguage = (lang: 'en' | 'fr' | 'de') => {
        setLanguage(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <LanguageIcon className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">{languages[language]}</span>
            </button>
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-36 bg-white dark:bg-neutral-dark rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-30"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="py-1" role="none">
                        {Object.entries(languages).map(([code, name]) => (
                            <button
                                key={code}
                                onClick={() => handleSelectLanguage(code as 'en' | 'fr' | 'de')}
                                className="w-full text-left block px-4 py-2 text-sm text-neutral-800 dark:text-neutral-200 hover:bg-brand-primary hover:text-white"
                                role="menuitem"
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const { user } = useUser();
  const { t } = useLocalization();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <header className="bg-white/50 dark:bg-neutral-darker/50 backdrop-blur-sm border-b border-neutral-900/10 dark:border-neutral-light/10 sticky top-0 z-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
         <button onClick={() => onNavigate(user ? 'scanner' : 'home')} className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-glow-start to-glow-end rounded-lg">
                <GameControllerIcon className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-neutral-light tracking-tight">
              {t('header.title')}
            </h1>
         </button>
         <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
                <nav className="flex items-center gap-1 sm:gap-2 bg-gray-200/50 dark:bg-neutral-dark/50 p-1 rounded-lg border border-black/10 dark:border-white/10">
                    <NavButton page="scanner" currentPage={currentPage} onNavigate={onNavigate} icon={<ScanIcon className="h-5 w-5" />} label={t('nav.scanner')} />
                    <NavButton page="collection" currentPage={currentPage} onNavigate={onNavigate} icon={<CollectionIcon className="h-5 w-5" />} label={t('nav.collection')} />
                    <NavButton page="wishlist" currentPage={currentPage} onNavigate={onNavigate} icon={<WishlistIcon className="h-5 w-5" />} label={t('nav.wishlist')} />
                    <NavButton page="analytics" currentPage={currentPage} onNavigate={onNavigate} icon={<AnalyticsIcon className="h-5 w-5" />} label={t('nav.analytics')} />
                </nav>
            ) : null}
            <div className="flex items-center gap-3">
                <LanguageSelector />
                {user ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onNavigate('account')}
                            className={`p-2 rounded-full transition-colors ${
                                currentPage === 'account'
                                ? 'bg-brand-primary text-white'
                                : 'text-neutral-500 dark:text-neutral-400 hover:bg-gray-200 dark:hover:bg-neutral-dark hover:text-black dark:hover:text-white'
                            }`}
                            title={t('nav.account')}
                            aria-label={t('nav.account')}
                        >
                            <AccountIcon className="h-5 w-5" />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="text-sm text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
                            title={t('header.logout')}
                        >
                            {t('header.logout')}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => onNavigate('scanner')}
                        className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-opacity text-sm"
                    >
                        {t('header.login')}
                    </button>
                )}
            </div>
         </div>
      </div>
    </header>
  );
};

export default Header;