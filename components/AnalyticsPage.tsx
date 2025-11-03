import React, { useMemo } from 'react';
import { GameItem } from '../types';
import { useLocalization } from '../hooks/useLocalization';

interface AnalyticsPageProps {
  collection: GameItem[];
}

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

const PieChart: React.FC<{title: string, data: [string, number][], formatter: (value: number) => string, noDataText: string}> = ({title, data, formatter, noDataText}) => {
    const COLORS = ['#8b5cf6', '#6366f1', '#3b82f6', '#14b8a6', '#84cc16', '#f59e0b', '#ef4444', '#ec4899'];
    const total = data.reduce((acc, [, value]) => acc + value, 0);

    if (total === 0) {
        return (
            <div className="bg-neutral-dark/50 border border-neutral-light/10 rounded-xl p-6 h-full flex flex-col">
                <h3 className="text-lg font-bold text-neutral-light mb-4">{title}</h3>
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-neutral-400">{noDataText}</p>
                </div>
            </div>
        );
    }
    
    let cumulativePercentage = 0;
    const gradientStops = data.map(([_, value], index) => {
        const percentage = (value / total) * 100;
        const color = COLORS[index % COLORS.length];
        const start = cumulativePercentage;
        cumulativePercentage += percentage;
        const end = cumulativePercentage;
        return `${color} ${start}% ${end}%`;
    });
    
    const conicGradient = `conic-gradient(${gradientStops.join(', ')})`;
    const topItems = data.slice(0, 7);
    const otherItemsValue = data.slice(7).reduce((acc, [, value]) => acc + value, 0);

    return (
        <div className="bg-neutral-dark/50 border border-neutral-light/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-neutral-light mb-4">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="relative w-40 h-40 lg:w-48 lg:h-48 mx-auto">
                    <div 
                        className="w-full h-full rounded-full"
                        style={{ background: conicGradient }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 lg:w-24 lg:h-24 bg-neutral-dark/80 backdrop-blur-sm rounded-full border border-neutral-light/10"></div>
                    </div>
                </div>
                <ul className="space-y-2 text-sm">
                    {topItems.map(([label, value], index) => {
                        const percentage = (value / total) * 100;
                        return (
                            <li key={label} className="flex items-center justify-between gap-2">
                                <div className="flex items-center overflow-hidden">
                                    <span className="w-3 h-3 rounded-sm mr-2 flex-shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                                    <span className="font-medium text-neutral-300 truncate" title={label}>{label}</span>
                                </div>
                                <span className="font-semibold text-neutral-light text-right flex-shrink-0">{formatter(value)} ({percentage.toFixed(0)}%)</span>
                            </li>
                        )
                    })}
                    {otherItemsValue > 0 && (
                         <li className="flex items-center justify-between gap-2">
                            <div className="flex items-center">
                                <span className="w-3 h-3 rounded-sm mr-2 flex-shrink-0 bg-neutral-500"></span>
                                <span className="font-medium text-neutral-300">Other</span>
                            </div>
                            <span className="font-semibold text-neutral-light text-right flex-shrink-0">{formatter(otherItemsValue)} ({(otherItemsValue/total * 100).toFixed(0)}%)</span>
                        </li>
                    )}
                </ul>
            </div>
        </div>
    );
};


const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ collection }) => {
  const { t } = useLocalization();
  const analyticsData = useMemo(() => {
    if (collection.length === 0) return null;

    let totalValueUSD = 0;
    let totalValueCHF = 0;
    const platformCounts: { [key: string]: number } = {};
    const platformValuesUSD: { [key: string]: number } = {};
    const platformValuesCHF: { [key: string]: number } = {};
    const decadeCounts: { [key: string]: number } = {};

    collection.forEach(item => {
      // Aggregate totals using specific sources
      const ebayPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('ebay'));
      if (ebayPrice) totalValueUSD += ebayPrice.average;
      
      const ricardoPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('ricardo'));
      if (ricardoPrice) totalValueCHF += ricardoPrice.average;

      // Aggregate by platform
      platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
      platformValuesUSD[item.platform] = (platformValuesUSD[item.platform] || 0) + (ebayPrice?.average || 0);
      platformValuesCHF[item.platform] = (platformValuesCHF[item.platform] || 0) + (ricardoPrice?.average || 0);

      // Aggregate by decade
      const decade = Math.floor(item.releaseYear / 10) * 10;
      decadeCounts[`${decade}s`] = (decadeCounts[`${decade}s`] || 0) + 1;
    });
    
    const sortedPlatformsByCount = Object.entries(platformCounts).sort(([, a], [, b]) => b - a);
    const sortedPlatformsByValueUSD = Object.entries(platformValuesUSD).sort(([, a], [, b]) => b - a);
    const sortedPlatformsByValueCHF = Object.entries(platformValuesCHF).sort(([, a], [, b]) => b - a);
    const sortedDecades = Object.entries(decadeCounts).sort((a, b) => a[0].localeCompare(b[0]));

    return {
      totalItems: collection.length,
      totalValueUSD,
      totalValueCHF,
      platformsByCount: sortedPlatformsByCount,
      platformsByValueUSD: sortedPlatformsByValueUSD,
      platformsByValueCHF: sortedPlatformsByValueCHF,
      decades: sortedDecades,
    };
  }, [collection]);

  if (collection.length === 0) {
    return (
      <div className="w-full text-center py-16 animate-fade-in">
        <h2 className="text-3xl font-bold text-neutral-light mb-4">{t('analytics.emptyTitle')}</h2>
        <p className="text-neutral-400">{t('analytics.emptyDesc')}</p>
      </div>
    );
  }
  
  const StatCard: React.FC<{title: string, value: string, subvalue?: string}> = ({title, value, subvalue}) => (
      <div className="bg-neutral-dark/50 border border-neutral-light/10 rounded-xl p-6">
          <h3 className="text-sm font-medium text-neutral-400 mb-2">{title}</h3>
          <p className="text-3xl font-bold text-neutral-light">{value}</p>
          {subvalue && <p className="text-sm text-neutral-300">{subvalue}</p>}
      </div>
  );

  return (
    <div className="w-full max-w-7xl animate-fade-in space-y-8">
        <div>
            <h2 className="text-3xl font-bold text-neutral-light">{t('analytics.title')}</h2>
            <p className="text-neutral-400 mt-1">{t('analytics.description')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title={t('analytics.totalItems')} value={analyticsData?.totalItems.toString() ?? '0'} />
            <StatCard title={t('analytics.totalValueUsd')} value={formatCurrency(analyticsData?.totalValueUSD ?? 0, 'USD')} />
            <StatCard title={t('analytics.totalValueChf')} value={formatCurrency(analyticsData?.totalValueCHF ?? 0, 'CHF')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PieChart title={t('analytics.chartPlatformDist')} data={analyticsData?.platformsByCount ?? []} formatter={(v) => t('analytics.chartItemsSuffix', { value: v })} noDataText={t('analytics.chartNoData')} />
            <PieChart title={t('analytics.chartValueUsd')} data={analyticsData?.platformsByValueUSD ?? []} formatter={(v) => formatCurrency(v, 'USD')} noDataText={t('analytics.chartNoData')} />
            <PieChart title={t('analytics.chartValueChf')} data={analyticsData?.platformsByValueCHF ?? []} formatter={(v) => formatCurrency(v, 'CHF')} noDataText={t('analytics.chartNoData')} />
            <PieChart title={t('analytics.chartDecade')} data={analyticsData?.decades ?? []} formatter={(v) => t('analytics.chartItemsSuffix', { value: v })} noDataText={t('analytics.chartNoData')} />
        </div>
    </div>
  );
};

export default AnalyticsPage;