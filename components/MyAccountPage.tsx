import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { updatePassword, getMfaStatus, enrollMfa, challengeAndVerifyMfa, verifyAndUnenrollMfa } from '../services/authService';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';
import { KeyIcon } from './icons/KeyIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { CopyIcon } from './icons/CopyIcon';
import Loader from './Loader';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon } from './icons/SunIcon';
import { MoonIcon } from './icons/MoonIcon';
import { ComputerDesktopIcon } from './icons/ComputerDesktopIcon';
import Modal from './Modal';

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { t } = useLocalization();

  const options = [
    { name: 'light', label: t('account.themeLight'), icon: <SunIcon className="h-5 w-5" /> },
    { name: 'dark', label: t('account.themeDark'), icon: <MoonIcon className="h-5 w-5" /> },
    { name: 'system', label: t('account.themeSystem'), icon: <ComputerDesktopIcon className="h-5 w-5" /> },
  ];

  return (
    <div>
        <div className="grid grid-cols-3 gap-4">
            {options.map((option) => (
                <button
                    key={option.name}
                    onClick={() => setTheme(option.name as 'light' | 'dark' | 'system')}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                        theme === option.name
                        ? 'border-brand-primary bg-brand-primary/10 text-brand-primary'
                        : 'border-neutral-900/10 dark:border-neutral-light/10 hover:border-brand-secondary/50 bg-transparent'
                    }`}
                >
                    {option.icon}
                    <span className="mt-2 text-sm font-medium text-neutral-darker dark:text-neutral-light">{option.label}</span>
                </button>
            ))}
        </div>
    </div>
  );
};

const MyAccountPage: React.FC = () => {
    const { t } = useLocalization();

    // Generic states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Password change states
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [mfaCodeForPassword, setMfaCodeForPassword] = useState('');

    // MFA states
    const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
    const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
    const [isMfaSetup, setIsMfaSetup] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [mfaSecret, setMfaSecret] = useState<string | null>(null);
    const [mfaVerificationCode, setMfaVerificationCode] = useState('');
    const [enrollmentFactorId, setEnrollmentFactorId] = useState<string | null>(null);
    const [isDisableMfaModalOpen, setIsDisableMfaModalOpen] = useState(false);
    const [mfaCodeForDisable, setMfaCodeForDisable] = useState('');


    const checkMfaStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const status = await getMfaStatus();
            setMfaEnabled(status.isEnabled);
            setMfaFactorId(status.factorId);
        } catch (err) {
            const errorMessage = err instanceof Error ? t(err.message, { default: 'Failed to fetch MFA status.' }) : 'Failed to fetch MFA status.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        checkMfaStatus();
    }, [checkMfaStatus]);

    const handlePasswordUpdateAttempt = (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (newPassword !== confirmPassword) {
            setError(t('account.passwordMismatch'));
            return;
        }

        const policy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
        if (!policy.test(newPassword)) {
            setError(t('account.passwordPolicy.validationError'));
            return;
        }
        
        if (mfaEnabled) {
             setIsPasswordModalOpen(true);
        } else {
            // This case should ideally ask for current password, but for now, we directly update.
            // The error only occurs for MFA-enabled users.
             handleConfirmPasswordUpdate();
        }
    };

    const handleConfirmPasswordUpdate = async () => {
        setLoading(true);
        setError(null);
        try {
            if (mfaEnabled && mfaFactorId) {
                // Elevate session to AAL2 before updating password
                await challengeAndVerifyMfa(mfaFactorId, mfaCodeForPassword);
            }
            await updatePassword(newPassword);
            setIsPasswordModalOpen(false);
            setNewPassword('');
            setConfirmPassword('');
            setMfaCodeForPassword('');
            // The service will now sign the user out.
            // We just need to show a message.
            setSuccessMessage(t('account.passwordSuccessLogout'));
        } catch (err) {
            const errorMessage = err instanceof Error ? t(err.message) : t('account.passwordError');
            setError(errorMessage);
            setIsPasswordModalOpen(false);
        } finally {
            setLoading(false);
        }
    };


    const handleEnableMfa = async () => {
        setError(null);
        setLoading(true);
        try {
            const data = await enrollMfa();
            setQrCode(data.totp.qr_code);
            setMfaSecret(data.totp.secret);
            setEnrollmentFactorId(data.id);
            setIsMfaSetup(true);
        } catch (err) {
            const errorMessage = err instanceof Error ? t(err.message) : t('account.mfaError');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyMfa = async (e: FormEvent) => {
        e.preventDefault();
        if (!enrollmentFactorId) return;
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            await challengeAndVerifyMfa(enrollmentFactorId, mfaVerificationCode);
            setSuccessMessage(t('account.mfaSuccessEnabled'));
            setIsMfaSetup(false);
            setMfaVerificationCode('');
            await checkMfaStatus();
        } catch(err) {
            const errorMessage = err instanceof Error ? t(err.message, { default: t('account.mfaError') }) : t('account.mfaError');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleDisableMfa = async () => {
        if (!mfaFactorId) return;
        setError(null);
        setSuccessMessage(null);
        setLoading(true);
        try {
            await verifyAndUnenrollMfa(mfaFactorId, mfaCodeForDisable);
            setSuccessMessage(t('account.mfaSuccessDisabled'));
            await checkMfaStatus();
            setIsDisableMfaModalOpen(false);
            setMfaCodeForDisable('');
        } catch (err) {
            const errorMessage = err instanceof Error ? t(err.message, { default: t('account.mfaErrorDisable') }) : t('account.mfaErrorDisable');
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleCopySecret = async () => {
        if (!mfaSecret) return;
        try {
            await navigator.clipboard.writeText(mfaSecret);
            alert(t('account.copySuccess'));
        } catch (err) {
            alert(t('account.copyFail'));
        }
    };

    if (isMfaSetup) {
        return (
            <div className="w-full max-w-2xl animate-fade-in bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-4">{t('account.mfaSetupTitle')}</h3>
                <div className="space-y-6">
                    <div>
                        <p className="text-neutral-700 dark:text-neutral-300 mb-4">{t('account.mfaSetupStep1')}</p>
                        {qrCode ? (
                            <div className="bg-white p-4 rounded-lg inline-block">
                                <img src={qrCode} alt="2FA QR Code" />
                            </div>
                        ) : <Loader message="..." />}
                    </div>
                     <div>
                        <p className="text-neutral-700 dark:text-neutral-300 mb-2">{t('account.mfaSetupStep2')}</p>
                        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-neutral-darker rounded-md border border-neutral-900/20 dark:border-neutral-light/20">
                            <span className="font-mono text-neutral-900 dark:text-neutral-light">{mfaSecret}</span>
                            <button onClick={handleCopySecret} title="Copy" className="ml-auto text-neutral-500 dark:text-neutral-400 hover:text-black dark:hover:text-white">
                                <CopyIcon className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleVerifyMfa}>
                        <label htmlFor="mfa-verification" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">{t('account.mfaSetupStep3')}</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <input
                                id="mfa-verification"
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                value={mfaVerificationCode}
                                onChange={(e) => setMfaVerificationCode(e.target.value)}
                                required
                                className="appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white"
                            />
                            <button type="submit" disabled={loading} className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-wait">
                                {loading ? t('common.processing') : t('account.mfaVerifyButton')}
                            </button>
                        </div>
                    </form>
                    {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
                </div>
            </div>
        )
    }

    const defaultInputClass = "appearance-none block w-full px-3 py-2 border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm placeholder-neutral-500 focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm bg-white dark:bg-neutral-darker text-black dark:text-white";

    return (
        <>
        <Modal
            isOpen={isPasswordModalOpen}
            onClose={() => setIsPasswordModalOpen(false)}
            onConfirm={handleConfirmPasswordUpdate}
            title={t('account.passwordConfirmMfaTitle')}
            confirmText={t('common.confirm')}
        >
            <p className="mb-4">{t('account.passwordConfirmMfaMessage')}</p>
             <input
                id="mfa-password-confirm"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCodeForPassword}
                onChange={(e) => setMfaCodeForPassword(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmPasswordUpdate();
                    }
                }}
                required
                className={defaultInputClass}
                placeholder="123456"
            />
        </Modal>

        <Modal
            isOpen={isDisableMfaModalOpen}
            onClose={() => setIsDisableMfaModalOpen(false)}
            onConfirm={handleDisableMfa}
            title={t('account.mfaDisableTitle')}
            confirmText={t('account.mfaDisableButton')}
            confirmVariant="danger"
        >
            <p className="mb-4">{t('account.mfaDisableConfirm')}</p>
             <input
                id="mfa-disable-confirm"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCodeForDisable}
                onChange={(e) => setMfaCodeForDisable(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        handleDisableMfa();
                    }
                }}
                required
                className={defaultInputClass}
                placeholder="123456"
            />
        </Modal>


        <div className="w-full max-w-4xl animate-fade-in space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light">{t('account.title')}</h2>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('account.description')}</p>
            </div>
            {error && <div className="p-4 bg-red-100 dark:bg-red-900/50 border border-red-500 text-red-800 dark:text-red-300 rounded-lg">{error}</div>}
            {successMessage && <div className="p-4 bg-green-100 dark:bg-green-900/50 border border-green-500 text-green-800 dark:text-green-300 rounded-lg">{successMessage}</div>}
            
             {/* Appearance */}
            <div className="bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-6 sm:p-8">
                <h3 className="text-xl font-bold mb-2">{t('account.themeTitle')}</h3>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">{t('account.themeDescription')}</p>
                <ThemeSwitcher />
            </div>

            {/* Password Change */}
            <div className="bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                    <KeyIcon className="h-6 w-6 text-brand-primary" />
                    <h3 className="text-xl font-bold">{t('account.passwordChangeTitle')}</h3>
                </div>
                <form onSubmit={handlePasswordUpdateAttempt} className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="new-password">{t('account.newPasswordLabel')}</label>
                        <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={defaultInputClass} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1" htmlFor="confirm-password">{t('account.confirmPasswordLabel')}</label>
                        <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required className={defaultInputClass} />
                    </div>
                    <PasswordStrengthIndicator password={newPassword} />
                    <div className="pt-2">
                        <button type="submit" disabled={loading} className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-wait">
                           {loading ? t('common.processing') : t('account.updatePasswordButton')}
                        </button>
                    </div>
                </form>
            </div>

            {/* 2FA Section */}
             <div className="bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border border-neutral-900/10 dark:border-neutral-light/10 rounded-xl shadow-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                    <ShieldCheckIcon className="h-6 w-6 text-brand-secondary" />
                    <h3 className="text-xl font-bold">{t('account.mfaTitle')}</h3>
                </div>
                <p className="text-neutral-700 dark:text-neutral-300 mb-4">{t('account.mfaDescription')}</p>
                {mfaEnabled === null ? <Loader message="..." /> : (
                    mfaEnabled ? (
                        <div>
                            <p className="text-green-600 dark:text-green-400 font-semibold mb-4">{t('account.mfaEnabled')}</p>
                            <button onClick={() => setIsDisableMfaModalOpen(true)} disabled={loading} className="w-full sm:w-auto flex justify-center py-2 px-6 border border-red-500/50 rounded-md shadow-sm text-sm font-medium text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/80 disabled:opacity-50 disabled:cursor-wait">
                                {loading ? t('common.processing') : t('account.mfaDisableButton')}
                            </button>
                        </div>
                    ) : (
                         <div>
                            <p className="text-amber-600 dark:text-amber-400 font-semibold mb-4">{t('account.mfaDisabled')}</p>
                            <button onClick={handleEnableMfa} disabled={loading} className="w-full sm:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 disabled:opacity-50 disabled:cursor-wait">
                                {loading ? t('common.processing') : t('account.mfaEnableButton')}
                            </button>
                        </div>
                    )
                )}
            </div>
        </div>
        </>
    );
};

export default MyAccountPage;