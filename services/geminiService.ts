

import { GoogleGenAI, Type } from "@google/genai";
import { GameItem } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const model = 'gemini-2.5-flash';

const prompt = `
  You are an expert in video games and retro consoles.
  Analyze the provided image containing physical video games (boxes, discs, cartridges), gaming consoles, and/or accessories (controllers, memory cards, etc.).
  Identify each distinct item visible.
  For each identified item, provide the following details:
  - title: The main title of the game or the name of the console/accessory.
  - publisher: The publisher of the game, or the manufacturer of the console/accessory.
  - platform: The platform the game is for (e.g., "Nintendo 64", "PlayStation 2"). For consoles and accessories, this should be the console's own name.
  - releaseYear: The year the item was first released in North America.
  - itemType: Classify as either "Game", "Console", or "Accessory".
  - estimatedPrices: An array of market price estimates. You MUST provide two estimates:
    1. From a source like eBay in USD currency.
    2. From the Swiss auction site Ricardo.ch in CHF currency.
    For each, provide "low", "average", and "high" values based on its current used condition.

  Return the result as a JSON array of objects. Do not include any text outside of the JSON array.
  If no items are identifiable, return an empty array.
`;

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        publisher: { type: Type.STRING },
        platform: { type: Type.STRING },
        releaseYear: { type: Type.INTEGER },
        itemType: { type: Type.STRING, enum: ['Game', 'Console', 'Accessory'] },
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
      required: ['title', 'publisher', 'platform', 'releaseYear', 'itemType', 'estimatedPrices'],
    },
};

export const analyzeImage = async (image: { data: string; mimeType: string }): Promise<GameItem[]> => {
  try {
    const imagePart = {
      inlineData: {
        data: image.data,
        mimeType: image.mimeType,
      },
    };

    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
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