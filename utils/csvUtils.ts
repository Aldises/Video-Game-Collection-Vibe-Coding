import { GameItem, PriceEstimate } from '../types';

interface CsvExportTranslations {
    headers: {
        title: string;
        platform: string;
        publisher: string;
        releaseYear: string;
        itemType: string;
        ebayLow: string;
        ebayAvg: string;
        ebayHigh: string;
        ebayCurrency: string;
        ricardoLow: string;
        ricardoAvg: string;
        ricardoHigh: string;
        ricardoCurrency: string;
    };
    alertEmpty: string;
}

export const exportCollectionToCsv = (collection: GameItem[], translations: CsvExportTranslations) => {
  if (collection.length === 0) {
    alert(translations.alertEmpty);
    return;
  }

  const headers = [
    translations.headers.title, translations.headers.platform, translations.headers.publisher,
    translations.headers.releaseYear, translations.headers.itemType,
    translations.headers.ebayLow, translations.headers.ebayAvg, translations.headers.ebayHigh,
    translations.headers.ebayCurrency, translations.headers.ricardoLow, translations.headers.ricardoAvg,
    translations.headers.ricardoHigh, translations.headers.ricardoCurrency
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
      ebayPrice?.low ?? '',
      ebayPrice?.average ?? '',
      ebayPrice?.high ?? '',
      ebayPrice?.currency ?? '',
      ricardoPrice?.low ?? '',
      ricardoPrice?.average ?? '',
      ricardoPrice?.high ?? '',
      ricardoPrice?.currency ?? ''
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


export const parseCollectionFromCsv = (file: File): Promise<GameItem[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) {
          return reject(new Error("csv.errorEmptyFile"));
        }
        
        const lines = text.trim().split(/\r\n|\n/);
        const headersLine = lines.shift();
        if (!headersLine) return reject(new Error("csv.errorMissingHeaders"));
        
        // Use a flexible matching for headers to accommodate different languages
        const headers = headersLine.split(',').map(h => h.trim().toLowerCase());
        
        // For simplicity in parsing, we'll still rely on the English-like structure internally for price lookups.
        // A more robust solution might map translated headers back to standard keys.
        const headerMapping: { [key: string]: string } = {
          'title': 'title', 'plattform': 'platform', 'platform': 'platform', 'éditeur': 'publisher', 'herausgeber': 'publisher', 'publisher': 'publisher',
          'release year': 'release year', 'année de sortie': 'release year', 'veröffentlichungsjahr': 'release year',
          'item type': 'item type', "type d'article": 'item type', 'elementtyp': 'item type',
          'ebay price (low)': 'ebay price (low)', 'ricardo price (low)': 'ricardo price (low)',
          'ebay price (avg)': 'ebay price (avg)', 'ricardo price (avg)': 'ricardo price (avg)',
          'ebay price (high)': 'ebay price (high)', 'ricardo price (high)': 'ricardo price (high)',
          'ebay currency': 'ebay currency', 'ricardo currency': 'ricardo currency',
        };
        
        const mappedHeaders = headers.map(h => {
             const found = Object.keys(headerMapping).find(key => h.includes(key));
             return found ? headerMapping[found] : h;
        });

        const requiredHeaders = ['title', 'platform', 'publisher', 'release year', 'item type'];
        if (!requiredHeaders.every(h => mappedHeaders.includes(h))) {
          return reject(new Error(`csv.errorInvalidHeaders`));
        }
  
        const items: GameItem[] = lines.map(line => {
          if (!line) return null;
          
          const values = line.match(/(?:"(?:[^"]|"")*"|[^,]*)(?:,|$)/g);
          if (!values) return null;

          const row = values.map(v => {
            const trimmed = v.trim().replace(/,$/, '');
            if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
              return trimmed.slice(1, -1).replace(/""/g, '"');
            }
            return trimmed;
          });
  
          const itemData: { [key: string]: string } = {};
          mappedHeaders.forEach((header, index) => {
            itemData[header] = row[index];
          });
  
          const ebayPrice: PriceEstimate = {
            source: 'eBay',
            currency: itemData['ebay currency'] || 'USD',
            low: parseFloat(itemData['ebay price (low)']) || 0,
            average: parseFloat(itemData['ebay price (avg)']) || 0,
            high: parseFloat(itemData['ebay price (high)']) || 0,
          };
  
          const ricardoPrice: PriceEstimate = {
            source: 'Ricardo.ch',
            currency: itemData['ricardo currency'] || 'CHF',
            low: parseFloat(itemData['ricardo price (low)']) || 0,
            average: parseFloat(itemData['ricardo price (avg)']) || 0,
            high: parseFloat(itemData['ricardo price (high)']) || 0,
          };
  
          const gameItem: GameItem = {
            title: itemData['title'],
            platform: itemData['platform'],
            publisher: itemData['publisher'],
            releaseYear: parseInt(itemData['release year'], 10),
            itemType: (itemData['item type'] as 'Game' | 'Console' | 'Accessory') || 'Game',
            estimatedPrices: [ebayPrice, ricardoPrice].filter(p => p.average > 0),
          };
          
          if (gameItem.title && gameItem.platform && !isNaN(gameItem.releaseYear)) {
            return gameItem;
          }
          return null;

        }).filter((item): item is GameItem => item !== null);
        
        resolve(items);
      } catch (e) {
        reject(new Error("csv.errorParse"));
      }
    };

    reader.onerror = () => {
      reject(new Error("csv.errorReadFile"));
    };

    reader.readAsText(file);
  });
};