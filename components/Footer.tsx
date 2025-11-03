import React from 'react';
import { useLocalization } from '../hooks/useLocalization';

const Footer: React.FC = () => {
  const { t } = useLocalization();
  return (
    <footer className="mt-auto">
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 text-center text-neutral-500 text-xs">
        <p>{t('footer.poweredBy')}</p>
      </div>
    </footer>
  );
};

export default Footer;