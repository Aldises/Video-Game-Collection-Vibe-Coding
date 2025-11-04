import React, { useState, FormEvent } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { resetUserPassword } from '../services/authService';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { KeyIcon } from './icons/KeyIcon';

interface PasswordResetPageProps {
    onResetSuccess: () => void;
}

const PasswordResetPage: React.FC<PasswordResetPageProps> = ({ onResetSuccess }) => {
    const { t } = useLocalization();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    
    const handleResetSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);

        if (newPassword !== confirmPassword) {
            setError(t('authFlows.passwordMismatch'));
            return;
        }

        const policy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        if (!policy.test(newPassword)) {
            setError('Password does not meet the policy requirements.');
            return;
        }

        setIsLoading(true);
        try {
            await resetUserPassword(newPassword);
            setSuccess(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? t(err.message) : t('login.errorUnknown');
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const defaultInputClass = "appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white";

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-neutral-light dark:bg-neutral-darker text-neutral-darker dark:text-neutral-light p-4 animate-fade-in">
                <div className="w-full max-w-md text-center bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-8">
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-br from-glow-start to-glow-end mb-6">
                        <KeyIcon className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light mb-4">{t('authFlows.passwordResetTitle')}</h1>
                    <p className="text-neutral-600 dark:text-neutral-300 mb-8">{t('authFlows.passwordResetSuccess')}</p>
                    <button
                        onClick={onResetSuccess}
                        className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity"
                    >
                        {t('authFlows.backToLoginButton')}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-light dark:bg-neutral-darker text-neutral-darker dark:text-neutral-light p-4 animate-fade-in">
            <div className="w-full max-w-md bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light">{t('authFlows.passwordResetTitle')}</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-2">{t('authFlows.passwordResetDescription')}</p>
                </div>
                <form onSubmit={handleResetSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="new-password">{t('authFlows.newPasswordLabel')}</label>
                        <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={defaultInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="confirm-password">{t('authFlows.confirmPasswordLabel')}</label>
                        <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={defaultInputClass} />
                    </div>
                    <PasswordStrengthIndicator password={newPassword} />
                    {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                    <div>
                        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-wait">
                            {isLoading ? t('common.processing') : t('authFlows.resetPasswordButton')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetPage;