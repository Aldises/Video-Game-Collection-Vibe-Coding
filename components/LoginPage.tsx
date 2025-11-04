import React, { useState, FormEvent } from 'react';
import { signIn, signUp } from '../services/authService';
import { GameControllerIcon } from './icons/GameControllerIcon';
import { useLocalization } from '../hooks/useLocalization';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useLocalization();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (isLogin) {
        await signIn({ email, password });
      } else {
        await signUp({ email, password });
      }
      // No need to call login(), the onAuthStateChange listener will handle it.
    } catch (err) {
      const errorMessage = err instanceof Error ? t(err.message, { message: err.message }) : t('login.errorUnknown');
      // Supabase might return a generic message, let's provide better ones.
      if (errorMessage.includes('Invalid login credentials')) {
        setError(t('login.errorInvalid'));
      } else if (errorMessage.includes('already be registered')) {
        setError(t('login.errorExists'));
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-glow-start to-glow-end rounded-xl mb-4">
              <GameControllerIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-light tracking-tight">
            {t('header.title')}
          </h1>
          <p className="text-neutral-400">{t('login.tagline')}</p>
      </div>

      <div className="bg-neutral-dark p-8 rounded-xl border border-neutral-light/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-neutral-light mb-6">
          {isLogin ? t('login.welcome') : t('login.createAccount')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-300">
              {t('login.emailLabel')}
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-neutral-darker text-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-neutral-300">
              {t('login.passwordLabel')}
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-neutral-darker text-white"
              />
            </div>
          </div>
          
          {error && <p className="text-sm text-red-400">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-wait"
            >
              {isLoading ? t('common.processing') : (isLogin ? t('login.signIn') : t('login.signUp'))}
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-400">
            {isLogin ? t('login.noAccount') : t('login.haveAccount')}
            <button
              onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
              }}
              className="font-medium bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 ml-1"
            >
              {isLogin ? t('login.signUp') : t('login.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;