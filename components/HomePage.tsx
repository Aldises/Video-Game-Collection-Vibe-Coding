import React, { useState, FormEvent } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { ScanIcon } from './icons/ScanIcon';
import { CollectionIcon } from './icons/CollectionIcon';
import { AnalyticsIcon } from './icons/AnalyticsIcon';
import { WishlistIcon } from './icons/WishlistIcon';

interface HomePageProps {
  onNavigateToLogin: () => void;
}

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="bg-white/5 dark:bg-neutral-dark/30 p-6 rounded-xl border border-neutral-900/10 dark:border-neutral-light/10 transform hover:-translate-y-1 transition-transform duration-300">
    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-br from-glow-start to-glow-end text-white mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-light mb-2">{title}</h3>
    <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
  </div>
);

const MockupCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white dark:bg-neutral-darker rounded-lg shadow-2xl border border-neutral-900/10 dark:border-neutral-light/10 overflow-hidden h-full">
        <div className="p-3 border-b border-neutral-900/10 dark:border-neutral-light/10 flex items-center gap-2 bg-gray-50 dark:bg-neutral-dark">
            <span className="h-3 w-3 rounded-full bg-red-500"></span>
            <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
            <span className="h-3 w-3 rounded-full bg-green-500"></span>
        </div>
        <div className="p-6">{children}</div>
    </div>
);

const HomePage: React.FC<HomePageProps> = ({ onNavigateToLogin }) => {
  const { t } = useLocalization();
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleContactSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
        setIsSubmitted(false);
        setContactForm({ name: '', email: '', message: '' });
    }, 3000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-full max-w-7xl animate-fade-in space-y-20 md:space-y-32">
      {/* Hero Section */}
      <section className="text-center pt-10">
        <h1 className="text-4xl md:text-6xl font-extrabold text-neutral-900 dark:text-neutral-light mb-4 tracking-tight">
          {t('home.heroTitle')}
        </h1>
        <p className="max-w-3xl mx-auto text-lg md:text-xl text-neutral-500 dark:text-neutral-400 mb-8">
          {t('home.heroSubtitle')}
        </p>
        <button
          onClick={onNavigateToLogin}
          className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 px-8 rounded-lg transition-opacity text-lg"
        >
          {t('home.heroCta')}
        </button>
      </section>

      {/* Features Section */}
      <section>
        <h2 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-light mb-12">{t('home.featuresTitle')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard icon={<ScanIcon className="h-6 w-6" />} title={t('home.feature1Title')} description={t('home.feature1Desc')} />
          <FeatureCard icon={<CollectionIcon className="h-6 w-6" />} title={t('home.feature2Title')} description={t('home.feature2Desc')} />
          <FeatureCard icon={<AnalyticsIcon className="h-6 w-6" />} title={t('home.feature3Title')} description={t('home.feature3Desc')} />
          <FeatureCard icon={<WishlistIcon className="h-6 w-6" />} title={t('home.feature4Title')} description={t('home.feature4Desc')} />
        </div>
      </section>

      {/* Mockups Section */}
      <section>
        <h2 className="text-3xl font-bold text-center text-neutral-900 dark:text-neutral-light mb-12">{t('home.mockupsTitle')}</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            <MockupCard title="Scanner">
                <div className="w-full h-40 bg-gray-200 dark:bg-neutral-dark rounded-md flex items-center justify-center mb-4">
                    <p className="text-neutral-500">Image Preview</p>
                </div>
                <div className="h-4 w-full bg-gray-300 dark:bg-neutral-dark/80 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-3/4 bg-gray-300 dark:bg-neutral-dark/80 rounded animate-pulse"></div>
            </MockupCard>
             <MockupCard title="Collection">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-200 dark:bg-neutral-dark flex-shrink-0"></div>
                        <div className="w-full space-y-2">
                           <div className="h-3 w-full bg-gray-300 dark:bg-neutral-dark/80 rounded animate-pulse"></div>
                           <div className="h-3 w-1/2 bg-gray-300 dark:bg-neutral-dark/80 rounded animate-pulse"></div>
                        </div>
                    </div>
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-200 dark:bg-neutral-dark flex-shrink-0"></div>
                        <div className="w-full space-y-2">
                           <div className="h-3 w-full bg-gray-300 dark:bg-neutral-dark/80 rounded animate-pulse"></div>
                           <div className="h-3 w-1/2 bg-gray-300 dark:bg-neutral-dark/80 rounded animate-pulse"></div>
                        </div>
                    </div>
                </div>
            </MockupCard>
             <MockupCard title="Analytics">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-full bg-gray-300 dark:bg-neutral-dark/80 animate-pulse flex-shrink-0"></div>
                    <div className="w-full space-y-3">
                        <div className="h-3 w-full bg-gray-300 dark:bg-neutral-dark/80 rounded"></div>
                        <div className="h-3 w-full bg-gray-300 dark:bg-neutral-dark/80 rounded"></div>
                        <div className="h-3 w-3/4 bg-gray-300 dark:bg-neutral-dark/80 rounded"></div>
                    </div>
                </div>
            </MockupCard>
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="max-w-3xl mx-auto text-center pb-10">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light mb-4">{t('home.contactTitle')}</h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-8">{t('home.contactDesc')}</p>
        <div className="bg-white/5 dark:bg-neutral-dark/30 p-8 rounded-xl border border-neutral-900/10 dark:border-neutral-light/10">
          {isSubmitted ? (
            <p className="text-green-600 dark:text-green-400 font-medium">{t('home.contactSuccess')}</p>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-6 text-left">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('home.contactNameLabel')}</label>
                <input type="text" name="name" id="name" required value={contactForm.name} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('home.contactEmailLabel')}</label>
                <input type="email" name="email" id="email" required value={contactForm.email} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary" />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">{t('home.contactMessageLabel')}</label>
                <textarea name="message" id="message" rows={4} required value={contactForm.message} onChange={handleInputChange} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-darker border border-neutral-900/20 dark:border-neutral-light/20 rounded-md shadow-sm focus:outline-none focus:ring-brand-primary focus:border-brand-primary"></textarea>
              </div>
              <div className="text-right">
                <button type="submit" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-2.5 px-6 rounded-lg transition-opacity">
                  {t('home.contactSend')}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
