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

const MAIN_MODEL = "gemini-3-flash-preview"; 
const CHAT_MODEL = "gemini-3-flash-preview";
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

  const relevantHistory = history.slice(-5);
  const historyText = relevantHistory.map(h => `H: ${h.text}\nS: ${h.choice}`).join("\n---\n");

  const systemInstruction = `DM of Aethelgard. 
Lore:\n${activeLore}
Archives:\n${activeArchives}
${characterResumeContext ? `RESUME CONTEXT: Bu karakterin önceki macerasının özeti: ${characterResumeContext}. Bu özeti temel alarak hikayeyi devam ettir.` : ''}
Inventory: ${currentInventory.join(',')}
Quest: ${currentQuest}
RULES: Turkish text (100 words), 3-4 options, update inventory/quest. English image prompt.`;

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
    contents: `Summarize this session in 2 sentences focusing on key achievements and current status: ${history.map(h => h.choice).join(' -> ')}`,
  });
  return response.text || "Summary failed.";
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
  const ai = await getAIClient();
  const fullPrompt = `${prompt}. Fantasy digital painting style, dark atmospheric.`;
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
  history: {role: 'user' | 'model', text: string}[], 
  newMessage: string,
  loreContext: string | null
): Promise<string> => {
  const ai = await getAIClient();
  const chat = ai.chats.create({
    model: CHAT_MODEL,
    history: history.slice(-6).map(h => ({ role: h.role, parts: [{ text: h.text }] })),
    config: { systemInstruction: `Oracle of Aethelgard. Lore: ${loreContext || FALLBACK_LORE}. Speak Turkish, cryptic, helpful.` }
  });
  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "...";
};