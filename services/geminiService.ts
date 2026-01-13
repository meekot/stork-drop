import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generates a visual representation of a product using Gemini.
 * This is useful when the user provides a link but we can't scrape the image due to CORS.
 */
export const generateProductImage = async (productName: string, category: string): Promise<string | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const prompt = `A clean, high-quality, minimalistic product photography of ${productName} (${category}) on a soft, neutral colored background. Photorealistic.`;
    
    // Using gemini-2.5-flash-image for efficient image generation
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Failed to generate image:", error);
    return null;
  }
};

/**
 * Suggests a category based on the item name using a lightweight text model.
 */
export const suggestCategory = async (itemName: string): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Categorize the baby item "${itemName}" into exactly one of these categories: Essentials, Clothing, Nursery, Toys, Feeding, Other. Return ONLY the category name.`,
        });
        return response.text.trim();
    } catch (e) {
        console.error("Failed to categorize", e);
        return null;
    }
}

/**
 * Extracts product details from a URL string using Gemini's reasoning capabilities.
 */
export const extractProductDetails = async (url: string): Promise<{ name: string; category: string } | null> => {
  const ai = getClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze this product URL: "${url}". 
      1. Extract or infer the likely Product Name from the URL text/slug.
      2. Categorize it into one of: Essentials, Clothing, Nursery, Toys, Feeding, Other.
      
      Return a JSON object: { "name": "...", "category": "..." }`,
      config: {
        responseMimeType: 'application/json'
      }
    });
    
    return JSON.parse(response.text);
  } catch (e) {
    console.error("Failed to extract details", e);
    return null;
  }
};