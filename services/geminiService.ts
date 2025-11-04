

import { GoogleGenAI, Type } from "@google/genai";
import { GameItem, PriceEstimate } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const imageAnalysisPrompt = `
  You are an expert in video games and retro consoles.
  Analyze the provided image containing physical video games (boxes, discs, cartridges), gaming consoles, and/or accessories (controllers, memory cards, etc.).
  Identify each distinct item visible.
  For each identified item, provide the following details:
  - title: The main title of the game or the name of the console/accessory.
  - publisher: The publisher of the game, or the manufacturer of the console/accessory.
  - platform: The platform the game is for (e.g., "Nintendo 64", "PlayStation 2"). For consoles and accessories, this should be the console's own name.
  - releaseYear: The year the item was first released in North America.
  - itemType: Classify as either "Game", "Console", or "Accessory".
  - condition: Determine the physical state. Classify as "Boxed" if it appears to be in its original packaging, or "Loose" if it is just the cartridge/disc. If you cannot determine, classify as "Unknown".
  - estimatedPrices: An array of market price estimates. You MUST provide up to four estimates, using these exact source names:
    1. From ebay.com, using English search terms, source name should be "ebay.com", in USD currency.
    2. From the Swiss auction site Ricardo.ch, using French search terms, source name should be "ricardo.ch", in CHF currency.
    3. From the Swiss classifieds site Anibis.ch, using French search terms, source name should be "anibis.ch", in CHF currency.
    4. From ebay.fr, using French search terms, source name should be "ebay.fr", in EUR currency.
    For each, provide "low", "average", and "high" values based on its current used condition.
    If you cannot find a price for a specific source, omit that source's price object entirely from the array.

  Return the result as a JSON array of objects. Do not include any text outside of the JSON array.
  If no items are identifiable, return an empty array.
`;

const priceUpdatePrompt = `
  You are an expert in video games and retro consoles.
  For the item specified below, find its current used market price estimates from up to four sources.
  Item Title: {title}
  Item Platform: {platform}

  - estimatedPrices: An array of market price estimates. You MUST provide up to four estimates, using these exact source names:
    1. From ebay.com, using English search terms, source name should be "ebay.com", in USD currency.
    2. From the Swiss auction site Ricardo.ch, using French search terms, source name should be "ricardo.ch", in CHF currency.
    3. From the Swiss classifieds site Anibis.ch, using French search terms, source name should be "anibis.ch", in CHF currency.
    4. From ebay.fr, using French search terms, source name should be "ebay.fr", in EUR currency.
    For each, provide "low", "average", and "high" values based on its current used condition.
    If you cannot find a price for a specific source, omit that source's price object entirely from the array.

  Return the result as a JSON object containing only the "estimatedPrices" array. Do not include any text outside of the JSON object.
  If no prices can be found, return an object with an empty "estimatedPrices" array.
`;


const imageResponseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        publisher: { type: Type.STRING },
        platform: { type: Type.STRING },
        releaseYear: { type: Type.INTEGER },
        itemType: { type: Type.STRING, enum: ['Game', 'Console', 'Accessory'] },
        condition: { type: Type.STRING, enum: ['Boxed', 'Loose', 'Unknown'] },
        estimatedPrices: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              source: { type: Type.STRING },
              currency: { type: Type.STRING },
              low: { type: Type.NUMBER },
              average: { type: Type.NUMBER },
              high: { type: Type.NUMBER },
            },
            required: ['source', 'currency', 'low', 'average', 'high'],
          }
        },
      },
      required: ['title', 'publisher', 'platform', 'releaseYear', 'itemType', 'condition', 'estimatedPrices'],
    },
};

const priceResponseSchema = {
    type: Type.OBJECT,
    properties: {
        estimatedPrices: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                  source: { type: Type.STRING },
                  currency: { type: Type.STRING },
                  low: { type: Type.NUMBER },
                  average: { type: Type.NUMBER },
                  high: { type: Type.NUMBER },
                },
                required: ['source', 'currency', 'low', 'average', 'high'],
            }
        },
    },
    required: ['estimatedPrices'],
};


export const analyzeImage = async (image: { data: string; mimeType: string }): Promise<GameItem[]> => {
  try {
    const imagePart = {
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    };

    const textPart = { text: imageAnalysisPrompt };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: imageResponseSchema,
      }
    });
    
    const jsonString = response.text.trim();
    if (!jsonString) {
        throw new Error("scanner.error.empty");
    }

    const parsedData: GameItem[] = JSON.parse(jsonString);
    if (!Array.isArray(parsedData)) {
      throw new Error("scanner.error.json");
    }
    return parsedData;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    if (error instanceof Error && error.message.includes('json')) {
         throw new Error("scanner.error.json");
    }
    throw new Error(`scanner.error.failed`);
  }
};


export const fetchPriceForItem = async (item: { title: string; platform: string }): Promise<PriceEstimate[]> => {
    try {
        const filledPrompt = priceUpdatePrompt
            .replace('{title}', item.title)
            .replace('{platform}', item.platform);
        
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: filledPrompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: priceResponseSchema,
            }
        });
        
        const jsonString = response.text.trim();
        if (!jsonString) {
            return [];
        }

        const parsedData = JSON.parse(jsonString) as { estimatedPrices: PriceEstimate[] };
        return parsedData.estimatedPrices || [];

    } catch (error) {
        console.error(`Error fetching prices for ${item.title}:`, error);
        // Return empty array on error to not break the bulk update process
        return [];
    }
};
