import React, { useState } from 'react';
import { useLocalization } from '../hooks/useLocalization';
import { useUser } from '../hooks/useUser';
import { redirectToCheckout } from '../services/stripeService';
import { CheckIcon } from './icons/CheckIcon';
import { XIcon } from './icons/XIcon';
import { Page } from '../App';

interface SubscriptionPageProps {
  onNavigate: (page: Page) => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onNavigate }) => {
  const { t } = useLocalization();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const currentPlan = user?.profile?.subscription_tier || 'free';

  const handleChoosePlan = async (planId: 'lite' | 'premium') => {
    setIsLoading(planId);
    await redirectToCheckout(planId);
    setIsLoading(null);
  };
  
  const plans = [
      {
        id: 'free',
        name: t('plans.free.name'),
        price: '$0',
        priceDetails: t('plans.free.priceDetails'),
        features: [
            { text: t('plans.features.collectionLimit', { limit: 100 }), included: true },
            { text: t('plans.features.wishlistLimit', { limit: 20 }), included: true },
            { text: t('plans.features.manualAdd'), included: true },
            { text: t('plans.features.aiScan'), included: false },
            { text: t('plans.features.unlimitedCollection'), included: false },
        ],
        planId: null
      },
      {
        id: 'lite',
        name: t('plans.lite.name'),
        price: '$2.99',
        priceDetails: t('plans.lite.priceDetails'),
        features: [
            { text: t('plans.features.collectionLimit', { limit: 100 }), included: true },
            { text: t('plans.features.wishlistLimit', { limit: 20 }), included: true },
            { text: t('plans.features.manualAdd'), included: true },
            { text: t('plans.features.aiScanLimited', { limit: 10 }), included: true },
            { text: t('plans.features.unlimitedCollection'), included: false },
        ],
        planId: 'lite' as 'lite' | 'premium'
      },
      {
        id: 'premium',
        name: t('plans.premium.name'),
        price: '$9.99',
        priceDetails: t('plans.premium.priceDetails'),
        features: [
            { text: t('plans.features.collectionLimit', { limit: t('plans.features.unlimited') }), included: true },
            { text: t('plans.features.wishlistLimit', { limit: t('plans.features.unlimited') }), included: true },
            { text: t('plans.features.manualAdd'), included: true },
            { text: t('plans.features.aiScanUnlimited'), included: true },
            { text: t('plans.features.unlimitedCollection'), included: true },
        ],
        planId: 'premium' as 'lite' | 'premium'
      }
  ];

  return (
    <div className="w-full max-w-7xl animate-fade-in space-y-8">
       <div>
            <h2 className="text-3xl font-bold text-neutral-900 dark:text-neutral-light">{t('subscription.title')}</h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">{t('subscription.description')}</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map(plan => {
                const isCurrentPlan = currentPlan === plan.id;
                return (
                    <div 
                        key={plan.id}
                        className={`flex flex-col bg-white/50 dark:bg-neutral-dark/50 backdrop-blur-sm border rounded-xl shadow-2xl transition-all ${isCurrentPlan ? 'border-brand-primary ring-4 ring-brand-primary/20' : 'border-neutral-900/10 dark:border-neutral-light/10'}`}
                    >
                        <div className="p-8">
                            <h3 className="text-2xl font-bold text-neutral-900 dark:text-neutral-light">{plan.name}</h3>
                            <p className="mt-4">
                                <span className="text-4xl font-extrabold text-neutral-900 dark:text-neutral-light">{plan.price}</span>
                                <span className="text-base font-medium text-neutral-500 dark:text-neutral-400"> / {plan.priceDetails}</span>
                            </p>
                        </div>

                        <div className="p-8 bg-black/5 dark:bg-white/5 flex-grow">
                             <ul className="space-y-4">
                                {plan.features.map(feature => (
                                     <li key={feature.text} className="flex items-start">
                                        {feature.included ? <CheckIcon className="h-6 w-6 text-green-500 mr-2 flex-shrink-0" /> : <XIcon className="h-6 w-6 text-red-500 mr-2 flex-shrink-0" />}
                                        <span className="text-neutral-700 dark:text-neutral-300">{feature.text}</span>
                                     </li>
                                ))}
                             </ul>
                        </div>
                        
                        <div className="p-8">
                             {isCurrentPlan ? (
                                <button disabled className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-lg cursor-default">
                                    {t('subscription.currentPlan')}
                                </button>
                             ) : plan.planId ? (
                                <button 
                                    onClick={() => handleChoosePlan(plan.planId!)}
                                    disabled={isLoading !== null}
                                    className="w-full bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90 text-white font-bold py-3 px-6 rounded-lg transition-opacity disabled:opacity-50 disabled:cursor-wait"
                                >
                                    {isLoading === plan.id ? t('common.processing') : t('subscription.choosePlan')}
                                </button>
                             ) : null}
                        </div>
                    </div>
                )
            })}
        </div>
    </div>
  );
};

export default SubscriptionPage;