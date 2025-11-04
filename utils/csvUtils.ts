import { GameItem, PriceEstimate } from '../types';

interface CsvExportTranslations {
    headers: {
        title: string;
        platform: string;
        publisher: string;
        releaseYear: string;
        itemType: string;
        condition: string;
        ebayComLow: string;
        ebayComAvg: string;
        ebayComHigh: string;
        ebayComCurrency: string;
        ricardoLow: string;
        ricardoAvg: string;
        ricardoHigh: string;
        ricardoCurrency: string;
        anibisLow: string;
        anibisAvg: string;
        anibisHigh: string;
        anibisCurrency: string;
        ebayFrLow: string;
        ebayFrAvg: string;
        ebayFrHigh: string;
        ebayFrCurrency: string;
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
    translations.headers.releaseYear, translations.headers.itemType, translations.headers.condition,
    translations.headers.ebayComLow, translations.headers.ebayComAvg, translations.headers.ebayComHigh, translations.headers.ebayComCurrency,
    translations.headers.ricardoLow, translations.headers.ricardoAvg, translations.headers.ricardoHigh, translations.headers.ricardoCurrency,
    translations.headers.anibisLow, translations.headers.anibisAvg, translations.headers.anibisHigh, translations.headers.anibisCurrency,
    translations.headers.ebayFrLow, translations.headers.ebayFrAvg, translations.headers.ebayFrHigh, translations.headers.ebayFrCurrency,
  ];

  const rows = collection.map(item => {
    const ebayPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('ebay.com'));
    const ricardoPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('ricardo'));
    const anibisPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('anibis'));
    const ebayFrPrice = item.estimatedPrices.find(p => p.source.toLowerCase().includes('ebay.fr'));

    return [
      `"${item.title.replace(/"/g, '""')}"`,
      `"${item.platform.replace(/"/g, '""')}"`,
      `"${item.publisher.replace(/"/g, '""')}"`,
      item.releaseYear,
      item.itemType,
      item.condition,
      ebayPrice?.low ?? '',
      ebayPrice?.average ?? '',
      ebayPrice?.high ?? '',
      ebayPrice?.currency ?? '',
      ricardoPrice?.low ?? '',
      ricardoPrice?.average ?? '',
      ricardoPrice?.high ?? '',
      ricardoPrice?.currency ?? '',
      anibisPrice?.low ?? '',
      anibisPrice?.average ?? '',
      anibisPrice?.high ?? '',
      anibisPrice?.currency ?? '',
      ebayFrPrice?.low ?? '',
      ebayFrPrice?.average ?? '',
      ebayFrPrice?.high ?? '',
      ebayFrPrice?.currency ?? ''
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
        
        const headers = headersLine.split(',').map(h => h.trim().toLowerCase());
        
        const getIndex = (keys: string[]) => {
            for (const key of keys) {
                const index = headers.findIndex(h => h.includes(key));
                if (index !== -1) return index;
            }
            return -1;
        };
        
        const headerIndices = {
            title: getIndex(['title', 'titre']),
            platform: getIndex(['platform', 'plattform', 'plateforme']),
            publisher: getIndex(['publisher', 'herausgeber', 'éditeur']),
            releaseYear: getIndex(['release year', 'veröffentlichungsjahr', 'année de sortie']),
            itemType: getIndex(['item type', 'elementtyp', "type d'article", 'type']),
            condition: getIndex(['condition', 'zustand', 'état']),
            ebayComLow: getIndex(['ebay.com price (low)']),
            ebayComAvg: getIndex(['ebay.com price (avg)']),
            ebayComHigh: getIndex(['ebay.com price (high)']),
            ebayComCurrency: getIndex(['ebay.com currency']),
            ricardoLow: getIndex(['ricardo price (low)']),
            ricardoAvg: getIndex(['ricardo price (avg)']),
            ricardoHigh: getIndex(['ricardo price (high)']),
            ricardoCurrency: getIndex(['ricardo currency']),
            anibisLow: getIndex(['anibis price (low)']),
            anibisAvg: getIndex(['anibis price (avg)']),
            anibisHigh: getIndex(['anibis price (high)']),
            anibisCurrency: getIndex(['anibis currency']),
            ebayFrLow: getIndex(['ebay.fr price (low)']),
            ebayFrAvg: getIndex(['ebay.fr price (avg)']),
            ebayFrHigh: getIndex(['ebay.fr price (high)']),
            ebayFrCurrency: getIndex(['ebay.fr currency']),
        };

        const requiredHeaders = ['title', 'platform', 'publisher', 'releaseYear', 'itemType'];
        if (!requiredHeaders.every(h => headerIndices[h as keyof typeof headerIndices] !== -1)) {
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
          
          const getValue = (index: number) => row[index] || '';

          const estimatedPrices: PriceEstimate[] = [];
          
          const ebayComAvg = parseFloat(getValue(headerIndices.ebayComAvg));
          if (!isNaN(ebayComAvg) && ebayComAvg > 0) {
              estimatedPrices.push({
                  source: 'ebay.com',
                  currency: getValue(headerIndices.ebayComCurrency) || 'USD',
                  low: parseFloat(getValue(headerIndices.ebayComLow)) || 0,
                  average: ebayComAvg,
                  high: parseFloat(getValue(headerIndices.ebayComHigh)) || 0,
              });
          }
          
          const ricardoAvg = parseFloat(getValue(headerIndices.ricardoAvg));
          if (!isNaN(ricardoAvg) && ricardoAvg > 0) {
              estimatedPrices.push({
                  source: 'ricardo.ch',
                  currency: getValue(headerIndices.ricardoCurrency) || 'CHF',
                  low: parseFloat(getValue(headerIndices.ricardoLow)) || 0,
                  average: ricardoAvg,
                  high: parseFloat(getValue(headerIndices.ricardoHigh)) || 0,
              });
          }

          const anibisAvg = parseFloat(getValue(headerIndices.anibisAvg));
          if (!isNaN(anibisAvg) && anibisAvg > 0) {
              estimatedPrices.push({
                  source: 'anibis.ch',
                  currency: getValue(headerIndices.anibisCurrency) || 'CHF',
                  low: parseFloat(getValue(headerIndices.anibisLow)) || 0,
                  average: anibisAvg,
                  high: parseFloat(getValue(headerIndices.anibisHigh)) || 0,
              });
          }

          const ebayFrAvg = parseFloat(getValue(headerIndices.ebayFrAvg));
          if (!isNaN(ebayFrAvg) && ebayFrAvg > 0) {
              estimatedPrices.push({
                  source: 'ebay.fr',
                  currency: getValue(headerIndices.ebayFrCurrency) || 'EUR',
                  low: parseFloat(getValue(headerIndices.ebayFrLow)) || 0,
                  average: ebayFrAvg,
                  high: parseFloat(getValue(headerIndices.ebayFrHigh)) || 0,
              });
          }

          const itemType = (getValue(headerIndices.itemType) as 'Game' | 'Console' | 'Accessory') || 'Game';
          const conditionRaw = getValue(headerIndices.condition).toLowerCase();
          let condition: 'Boxed' | 'Loose' | 'Unknown' = 'Unknown';
          if (conditionRaw === 'boxed') condition = 'Boxed';
          if (conditionRaw === 'loose') condition = 'Loose';
          

          const gameItem: GameItem = {
            title: getValue(headerIndices.title),
            platform: getValue(headerIndices.platform),
            publisher: getValue(headerIndices.publisher),
            releaseYear: parseInt(getValue(headerIndices.releaseYear), 10),
            itemType,
            condition,
            estimatedPrices,
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