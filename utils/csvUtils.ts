import { GameItem, PriceEstimate } from '../types';

export const exportToCsv = (filename: string, items: GameItem[]) => {
  if (!items || items.length === 0) {
    console.warn("No items to export.");
    return;
  }
  
  const getPrice = (prices: PriceEstimate[], source: string) => prices.find(p => p.source.toLowerCase().includes(source));

  const headers = [
    'Title', 'Publisher', 'Platform', 'Release Year', 'Item Type', 
    'eBay Price (Low, USD)', 'eBay Price (Avg, USD)', 'eBay Price (High, USD)',
    'Ricardo Price (Low, CHF)', 'Ricardo Price (Avg, CHF)', 'Ricardo Price (High, CHF)'
  ];
  const csvRows = [headers.join(',')];

  for (const item of items) {
    const ebayPrice = getPrice(item.estimatedPrices, 'ebay');
    const ricardoPrice = getPrice(item.estimatedPrices, 'ricardo');

    const values = [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.publisher.replace(/"/g, '""')}"`,
      `"${item.platform.replace(/"/g, '""')}"`,
      item.releaseYear,
      item.itemType,
      ebayPrice?.low ?? 'N/A',
      ebayPrice?.average ?? 'N/A',
      ebayPrice?.high ?? 'N/A',
      ricardoPrice?.low ?? 'N/A',
      ricardoPrice?.average ?? 'N/A',
      ricardoPrice?.high ?? 'N/A',
    ].join(',');
    csvRows.push(values);
  }

  const csvString = csvRows.join('\n');
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
