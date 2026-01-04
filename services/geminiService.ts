
import { GoogleGenAI } from "@google/genai";
import { ImageSize } from '../types';

export const generateColoringPage = async (
  theme: string, 
  pageIndex: number, 
  imageSize: ImageSize
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Use gemini-2.5-flash-image for standard 1K to reduce permission issues.
  // Use gemini-3-pro-image-preview only for high-res 2K/4K.
  const model = imageSize === '1K' ? 'gemini-2.5-flash-image' : 'gemini-3-pro-image-preview';

  const prompt = `Black and white coloring page for children, high contrast, thick bold black outlines, simple shapes, plain white background, no shading, no gray areas, subject: ${theme}. This is page ${pageIndex + 1} of a set, make it unique and whimsical. Only generate the image part.`;

  try {
    // imageSize is only supported for gemini-3-pro-image-preview
    const imageConfig: any = {
      aspectRatio: "3:4"
    };
    
    if (model === 'gemini-3-pro-image-preview') {
      imageConfig.imageSize = imageSize;
    }

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: imageConfig
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error('No image returned from Gemini');
  } catch (error: any) {
    console.error("Gemini API Error details:", error);
    // Extract machine-readable error for App.tsx to handle
    const errorMsg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
    throw new Error(errorMsg);
  }
};

export const getChatResponse = async (history: { role: string; content: string }[], currentPrompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const chat = ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: 'You are a friendly, creative coloring book expert. You help children and parents come up with fun themes for their coloring books and explain why certain themes like "dinosaurs in space" are exciting. Keep your tone encouraging and playful.',
    }
  });

  const response = await chat.sendMessage({ message: currentPrompt });
  return response.text;
};
