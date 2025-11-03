import { GameItem } from '../types';

export const exportCollectionToCsv = (collection: GameItem[]) => {
  if (collection.length === 0) {
    alert("Your collection is empty.");
    return;
  }

  const headers = [
    'Title', 'Platform', 'Publisher', 'Release Year', 'Item Type', 
    'eBay Price (Low)', 'eBay Price (Avg)', 'eBay Price (High)', 'eBay Currency',
    'Ricardo Price (Low)', 'Ricardo Price (Avg)', 'Ricardo Price (High)', 'Ricardo Currency'
  ];

  const rows = collection.map(item => {
    const ebayPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('ebay'));
    const ricardoPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('ricardo'));

    return [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.platform.replace(/"/g, '""')}"`,
      `"${item.publisher.replace(/"/g, '""')}"`,
      item.releaseYear,
      item.itemType,
      ebayPrice?.low || '',
      ebayPrice?.average || '',
      ebayPrice?.high || '',
      ebayPrice?.currency || '',
      ricardoPrice?.low || '',
      ricardoPrice?.average || '',
      ricardoPrice?.high || '',
      ricardoPrice?.currency || ''
    ].join(',');
  });

  const csvContent = "data:text/csv;charset=utf-8," 
    + headers.join(',') + "\n" 
    + rows.join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  const timestamp = new Date().toISOString().slice(0, 10);
  link.setAttribute("download", `game-collection-${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
