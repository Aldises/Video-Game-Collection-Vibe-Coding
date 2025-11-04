import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

interface PasswordStrengthIndicatorProps {
  password?: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password = '' }) => {
  const { t } = useLocalization();

  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };

  const CheckItem: React.FC<{ label: string; isValid: boolean }> = ({ label, isValid }) => (
    <li className={`flex items-center text-sm ${isValid ? 'text-green-500 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-400'}`}>
      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {isValid ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        )}
      </svg>
      {label}
    </li>
  );

  return (
    <div className="mt-4 p-4 bg-gray-200/30 dark:bg-neutral-dark/30 rounded-lg border border-neutral-900/10 dark:border-neutral-light/10">
        <h4 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">{t('account.passwordPolicy.title')}</h4>
        <ul className="space-y-1">
            <CheckItem label={t('account.passwordPolicy.length')} isValid={checks.length} />
            <CheckItem label={t('account.passwordPolicy.lowercase')} isValid={checks.lowercase} />
            <CheckItem label={t('account.passwordPolicy.uppercase')} isValid={checks.uppercase} />
            <CheckItem label={t('account.passwordPolicy.number')} isValid={checks.number} />
            <CheckItem label={t('account.passwordPolicy.special')} isValid={checks.special} />
        </ul>
    </div>
  );
};

export default PasswordStrengthIndicator;