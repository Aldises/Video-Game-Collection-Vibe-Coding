import React, { useState, FormEvent } from 'react';
import { signIn, signUp, sendPasswordResetEmail, verifyMfa, signOut } from '../services/authService';
import { GameControllerIcon } from './icons/GameControllerIcon';
import { useLocalization } from '../hooks/useLocalization';
import { EnvelopeIcon } from './icons/EnvelopeIcon';
import Modal from './Modal';

type Mode = 'login' | 'signup' | 'forgotPassword' | 'checkEmail';

const LoginPage: React.FC = () => {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [isMfaModalOpen, setIsMfaModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [checkEmailMessage, setCheckEmailMessage] = useState<string>('');
  const { t } = useLocalization();

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const { mfaRequired, factorId } = await signIn({ email, password });
        if (mfaRequired && factorId) {
            setFactorId(factorId);
            setIsMfaModalOpen(true);
            // The UserContext will keep the user logged out until MFA is verified,
            // so this component will remain mounted.
        }
        // For non-MFA users, the onAuthStateChange in UserContext will handle the login,
        // causing this component to unmount.
      } else {
        await signUp({ email, password });
        setCheckEmailMessage(t('login.signupSuccess'));
        setMode('checkEmail');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? t(err.message, { message: err.message }) : t('login.errorUnknown');
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

  const handlePasswordReset = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(email);
        setCheckEmailMessage(t('login.recoverySent'));
        setMode('checkEmail');
    } catch(err) {
        const errorMessage = err instanceof Error ? t(err.message) : t('login.errorUnknown');
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!factorId) return;
    setError(null);
    setIsLoading(true);
    try {
        await verifyMfa(factorId, mfaCode);
        setIsMfaModalOpen(false);
        // On success, the onAuthStateChange listener in UserContext will now receive
        // a session with aal2, set the user, and this component will unmount.
    } catch (err) {
        const errorMessage = err instanceof Error ? t(err.message) : t('login.errorInvalidMfa');
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleMfaCancel = async () => {
      setError(null);
      setMfaCode('');
      setIsMfaModalOpen(false);
      await signOut(); // Clean up the partial (aal1) session on the server.
  }

  const renderFormContent = () => {
    if (mode === 'checkEmail') {
        return (
            <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                    <EnvelopeIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{checkEmailMessage}</p>
            </div>
        );
    }
    
    if (mode === 'forgotPassword') {
        return (
             <form onSubmit={handlePasswordReset} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('login.emailLabel')}</label>
                    <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white" />
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div>
                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-wait">
                    {isLoading ? t('common.processing') : t('login.sendRecovery')}
                    </button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleAuthSubmit} className="space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('login.emailLabel')}</label>
                <div className="mt-1">
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white" />
                </div>
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('login.passwordLabel')}</label>
                <div className="mt-1">
                    <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 dark:placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white" />
                </div>
            </div>
            {mode === 'login' && (
                <div className="text-right text-sm">
                    <button type="button" onClick={() => { setMode('forgotPassword'); setError(null); }} className="font-medium bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80">
                        {t('login.forgotPassword')}
                    </button>
                </div>
            )}
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <div>
                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary disabled:opacity-50 disabled:cursor-wait">
                {isLoading ? t('common.processing') : (mode === 'login' ? t('login.signIn') : t('login.signUp'))}
                </button>
            </div>
        </form>
    );
  }

  const getTitle = () => {
      switch (mode) {
          case 'login': return t('login.welcome');
          case 'signup': return t('login.createAccount');
          case 'forgotPassword': return t('login.resetPassword');
          case 'checkEmail': return t('login.checkEmailTitle');
      }
  }

  return (
    <>
    <Modal
        isOpen={isMfaModalOpen}
        onClose={handleMfaCancel}
        onConfirm={handleMfaSubmit}
        title={t('login.enterMfa')}
        confirmText={isLoading ? t('common.processing') : t('login.verify')}
    >
        <div className="space-y-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                {t('login.mfaPrompt')}
            </p>
            <input
                id="mfaCode"
                name="mfaCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                autoComplete="one-time-code"
                required
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleMfaSubmit();
                    }
                }}
                className="appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white"
                placeholder="123456"
            />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
    </Modal>

    <div className="w-full max-w-md animate-fade-in">
      <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gradient-to-br from-glow-start to-glow-end rounded-xl mb-4">
              <GameControllerIcon className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light tracking-tight">{t('header.title')}</h1>
          <p className="text-neutral-500 dark:text-neutral-400">{t('login.tagline')}</p>
      </div>

      <div className="bg-white dark:bg-neutral-dark p-8 rounded-xl border border-neutral-900/10 dark:border-neutral-light/10 shadow-2xl">
        <h2 className="text-2xl font-bold text-center text-neutral-900 dark:text-neutral-light mb-6">{getTitle()}</h2>
        {renderFormContent()}
        <div className="mt-6 text-center">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {mode === 'login' && <>{t('login.noAccount')} <button onClick={() => { setMode('signup'); setError(null); }} className="font-medium bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 ml-1">{t('login.signUp')}</button></>}
            {mode === 'signup' && <>{t('login.haveAccount')} <button onClick={() => { setMode('login'); setError(null); }} className="font-medium bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 ml-1">{t('login.signIn')}</button></>}
            {(mode === 'forgotPassword' || mode === 'checkEmail') && <>{t('login.rememberedPassword')} <button onClick={() => { setMode('login'); setError(null); }} className="font-medium bg-gradient-to-r from-glow-start to-glow-end bg-clip-text text-transparent hover:opacity-80 ml-1">{t('login.backToLogin')}</button></>}
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default LoginPage;