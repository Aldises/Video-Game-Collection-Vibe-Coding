import React, { useMemo } from 'react';
import { GameItem } from '../types';

interface AnalyticsPageProps {
  collection: GameItem[];
}

const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ collection }) => {

  const analyticsData = useMemo(() => {
    if (collection.length === 0) return null;

    let totalValueUSD = 0;
    let totalValueCHF = 0;
    const platformCounts: { [key: string]: number } = {};
    const platformValuesUSD: { [key: string]: number } = {};
    const decadeCounts: { [key: string]: number } = {};

    collection.forEach(item => {
      // Aggregate totals
      const usdPrice = item.estimatedPrices.find(p => p.currency === 'USD');
      if (usdPrice) totalValueUSD += usdPrice.average;
      
      const chfPrice = item.estimatedPrices.find(p => p.currency === 'CHF');
      if (chfPrice) totalValueCHF += chfPrice.average;

      // Aggregate by platform
      platformCounts[item.platform] = (platformCounts[item.platform] || 0) + 1;
      platformValuesUSD[item.platform] = (platformValuesUSD[item.platform] || 0) + (usdPrice?.average || 0);

      // Aggregate by decade
      const decade = Math.floor(item.releaseYear / 10) * 10;
      decadeCounts[`${decade}s`] = (decadeCounts[`${decade}s`] || 0) + 1;
    });
    
    const sortedPlatformsByCount = Object.entries(platformCounts).sort(([, a], [, b]) => b - a);
    const sortedPlatformsByValue = Object.entries(platformValuesUSD).sort(([, a], [, b]) => b - a);
    const sortedDecades = Object.entries(decadeCounts).sort((a, b) => a[0].localeCompare(b[0]));

    return {
      totalItems: collection.length,
      totalValueUSD,
      totalValueCHF,
      platformsByCount: sortedPlatformsByCount,
      platformsByValue: sortedPlatformsByValue,
      decades: sortedDecades,
    };
  }, [collection]);

  if (collection.length === 0) {
    return (
      <div className="w-full text-center py-16 animate-fade-in">
        <h2 className="text-3xl font-bold text-neutral-light mb-4">Analytics</h2>
        <p className="text-neutral-400">Your collection is empty. Add items via the Scanner to see your stats!</p>
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

  const BarChart: React.FC<{title: string, data: [string, number][], formatter: (value: number) => string}> = ({title, data, formatter}) => {
      const maxValue = Math.max(...data.map(([, value]) => value));
      return (
        <div className="bg-neutral-dark/50 border border-neutral-light/10 rounded-xl p-6">
            <h3 className="text-lg font-bold text-neutral-light mb-4">{title}</h3>
            <div className="space-y-3">
                {data.map(([label, value]) => (
                    <div key={label} className="group">
                        <div className="flex justify-between items-center text-sm mb-1">
                            <span className="font-medium text-neutral-300">{label}</span>
                            <span className="font-semibold text-neutral-light">{formatter(value)}</span>
                        </div>
                        <div className="bg-neutral-dark rounded-full h-3 overflow-hidden">
                            <div 
                                className="bg-gradient-to-r from-glow-start to-glow-end h-3 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${(value / maxValue) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
      );
  }

  return (
    <div className="w-full max-w-7xl animate-fade-in space-y-8">
        <div>
            <h2 className="text-3xl font-bold text-neutral-light">Collection Analytics</h2>
            <p className="text-neutral-400 mt-1">An overview of your video game collection.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total Items" value={analyticsData?.totalItems.toString() ?? '0'} />
            <StatCard title="Total Est. Value (USD)" value={formatCurrency(analyticsData?.totalValueUSD ?? 0, 'USD')} />
            <StatCard title="Total Est. Value (CHF)" value={formatCurrency(analyticsData?.totalValueCHF ?? 0, 'CHF')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BarChart title="Platform Distribution" data={analyticsData?.platformsByCount ?? []} formatter={(v) => `${v} item(s)`} />
            <BarChart title="Value by Platform (USD)" data={analyticsData?.platformsByValue ?? []} formatter={(v) => formatCurrency(v, 'USD')} />
            <BarChart title="Collection by Decade" data={analyticsData?.decades ?? []} formatter={(v) => `${v} item(s)`} />
        </div>
    </div>
  );
};

export default AnalyticsPage;
