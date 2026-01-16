import { GoogleGenAI, Type } from "@google/genai";
import { AdventureResponse } from "../types";
import { WORLD_LORE as FALLBACK_LORE } from "../data/lore";
import { SESSION_ARCHIVES as FALLBACK_ARCHIVES } from "../data/archives";
import { ENV } from "../utils/env";

const getAIClient = async () => {
  if (ENV.GEMINI_API_KEY) return new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  if (window.aistudio) {
      await window.aistudio.hasSelectedApiKey();
      const fallbackKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
      return new GoogleGenAI({ apiKey: fallbackKey || '' });
  }
  throw new Error("API Key missing");
};

// MALİYET OPTİMİZASYONU: Pro modeller yerine Flash modelleri kullanılıyor
const MAIN_MODEL = "gemini-3-flash-preview"; 
const IMAGE_MODEL = "gemini-2.5-flash-image"; 

export const generateAdventureStep = async (
  history: { text: string; choice: string }[],
  currentInventory: string[],
  currentQuest: string,
  dynamicLore: string | null,
  dynamicArchives: string | null,
  characterResumeContext: string | null = null
): Promise<AdventureResponse> => {
  const ai = await getAIClient();
  const activeLore = dynamicLore || FALLBACK_LORE;
  const activeArchives = dynamicArchives || FALLBACK_ARCHIVES;

  // Bağlam Yönetimi: Sadece son 5 turu göndererek token tasarrufu sağlıyoruz
  const relevantHistory = history.slice(-5);
  const historyText = relevantHistory.map(h => `H: ${h.text}\nS: ${h.choice}`).join("\n---\n");

  const systemInstruction = `DM of Aethelgard. 
Lore:\n${activeLore}
Archives:\n${activeArchives}
${characterResumeContext ? `RESUME CONTEXT: Bu karakterin önceki macerasının özeti: ${characterResumeContext}.` : ''}
Inventory: ${currentInventory.join(',')}
Quest: ${currentQuest}
RULES: Turkish text (100 words), 3-4 options, update inventory/quest. English image prompt. BE CONCISE.`;

  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: history.length === 0 ? "Start a new adventure." : `Continue:\n${historyText}`,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          imagePrompt: { type: Type.STRING },
          inventoryUpdate: {
            type: Type.OBJECT,
            properties: {
              add: { type: Type.ARRAY, items: { type: Type.STRING } },
              remove: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          questUpdate: { type: Type.STRING, nullable: true }
        },
        required: ["text", "options", "imagePrompt", "inventoryUpdate"]
      }
    }
  });

  return JSON.parse(response.text || "{}") as AdventureResponse;
};

export const generateSessionSummary = async (history: { text: string; choice: string }[]): Promise<string> => {
  const ai = await getAIClient();
  const response = await ai.models.generateContent({
    model: MAIN_MODEL,
    contents: `Summarize this session in 2 sentences: ${history.map(h => h.choice).join(' -> ')}`,
  });
  return response.text || "Summary failed.";
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
  const ai = await getAIClient();
  const fullPrompt = `${prompt}. Dark fantasy digital painting.`;
  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: { parts: [{ text: fullPrompt }] },
    config: { imageConfig: { aspectRatio: "16:9" } }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("No image");
};

export const chatWithBot = async (
  history: { role: string; text: string }[],
  message: string,
  loreContext: string | null
): Promise<string> => {
  const ai = await getAIClient();
  const activeLore = loreContext || FALLBACK_LORE;
  
  const chat = ai.chats.create({
    model: MAIN_MODEL,
    config: {
      systemInstruction: `You are the Oracle of Aethelgard. 
Lore:\n${activeLore}
Constraint: Be cryptic, mystical, but helpful. Keep answers short.`,
    },
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    }))
  });

  const response = await chat.sendMessage({ message });
  return response.text || "The spirits are silent.";
};