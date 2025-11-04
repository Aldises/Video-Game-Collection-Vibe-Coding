import React from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';

interface EmailConfirmedPageProps {
  onContinue: () => void;
}

const EmailConfirmedPage: React.FC<EmailConfirmedPageProps> = ({ onContinue }) => {
  const { t } = useLocalization();

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-light dark:bg-neutral-darker text-neutral-darker dark:text-neutral-light p-4 animate-fade-in">
      <div className="w-full max-w-md text-center bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-8">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-glow-start to-glow-end mb-6">
            <ShieldCheckIcon className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light mb-4">{t('authFlows.emailConfirmedTitle')}</h1>
        <p className="text-neutral-600 dark:text-neutral-300 mb-8">{t('authFlows.emailConfirmedMessage')}</p>
        <button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity"
        >
          {t('authFlows.goToAppButton')}
        </button>
      </div>
    </div>
  );
};

export default EmailConfirmedPage;
