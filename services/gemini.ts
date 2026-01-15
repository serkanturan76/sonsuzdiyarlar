import { GoogleGenAI, Type } from "@google/genai";
import { AdventureResponse } from "../types";
import { WORLD_LORE as FALLBACK_LORE } from "../data/lore";
import { SESSION_ARCHIVES as FALLBACK_ARCHIVES } from "../data/archives";
import { ENV } from "../utils/env";

// Helper to ensure we have an API key or prompt selection
const getAIClient = async () => {
  // 1. Priority: Check Environment Variable (For Netlify Deployment)
  if (ENV.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
  }

  // 2. Fallback: Check AI Studio window object (For Local Dev in IDX)
  if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
          throw new Error("API Key selection required");
      }
      // Note: In AI Studio environment, the key is injected automatically if selected
      // We often access it via process.env.API_KEY, but here we assume the environment handles it
      // if we are in the specific `window.aistudio` context.
      return new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  
  throw new Error("API Key not found. Please set VITE_GEMINI_API_KEY in your environment variables.");
};

// Modified to accept dynamic lore and archives
export const generateAdventureStep = async (
  history: { text: string; choice: string }[],
  currentInventory: string[],
  currentQuest: string,
  dynamicLore: string | null,
  dynamicArchives: string | null
): Promise<AdventureResponse> => {
  const ai = await getAIClient();
  
  // Use dynamic data if available, otherwise fallback to local files
  const activeLore = dynamicLore || FALLBACK_LORE;
  const activeArchives = dynamicArchives || FALLBACK_ARCHIVES;

  const systemInstruction = `
    Sen "Aethelgard" dünyasında geçen sonsuz bir macera oyunu için Zindan Efendisisin (DM).
    Görevin, oyuncuyu aşağıda belirtilen KESİN VE DEĞİŞMEZ dünya kuralları (Lore) ve geçmiş olaylar (Archives) ışığında yönetmektir.
    
    === DÜNYA İNCİLİ (LORE) ===
    ${activeLore}
    
    === GEÇMİŞ OLAYLAR VE DÜNYA DURUMU (ARCHIVES) ===
    ${activeArchives}
    
    KURALLAR:
    1. Etkileyici, betimleyici bir anlatı metni yaz (100-150 kelime). DİL: TÜRKÇE.
    2. Sadece "Aethelgard" coğrafyasını kullan. Yeni kıtalar veya büyük şehirler uydurma. Lore'a sadık kal.
    3. Arşivdeki olaylara ince atıflarda bulun (Örn: "Güneyden gelen kara bulutlar..." veya "Kuzeydeki kayıp amulet söylentileri...").
    4. Oyuncu için 3-4 farklı, anlamlı seçenek sun.
    5. Oyuncunun Envanterini Yönet: Buldukları eşyaları ekle, kullandıklarını çıkar.
    6. Mevcut Görevi (Quest) Yönet: Hikaye akışı önemli ölçüde değişirse güncelle.
    7. Görsel İstemi (Image Prompt): Ortamı, karakteri ve ışığı betimleyen İngilizce bir prompt yaz.
    
    Mevcut Durum:
    - Envanter: ${JSON.stringify(currentInventory)}
    - Görev: ${currentQuest}
  `;

  const model = "gemini-flash-lite-latest";

  const historyText = history.map(h => `Hikaye: ${h.text}\nOyuncu Seçimi: ${h.choice}`).join("\n---\n");
  const prompt = history.length === 0 
    ? "Yeni bir maceraya başla. Oyuncuyu Lore'a uygun rastgele bir bölgede (Kuzey, Güney, Doğu, Batı veya Merkez) başlat. Nerede olduğunu betimle." 
    : `Aşağıdaki geçmişe dayanarak hikayeyi devam ettir. Lore'a sadık kal.\n\n${historyText}`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Bu bölüm için anlatı metni (Türkçe)." },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Kullanıcı için 3-4 seçenek (Türkçe)."
          },
          imagePrompt: { type: Type.STRING, description: "Görüntü oluşturma için açıklama (İngilizce)." },
          inventoryUpdate: {
            type: Type.OBJECT,
            properties: {
              add: { type: Type.ARRAY, items: { type: Type.STRING } },
              remove: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          questUpdate: { type: Type.STRING, nullable: true, description: "Değiştiyse yeni görev metni (Türkçe), yoksa null." }
        },
        required: ["text", "options", "imagePrompt", "inventoryUpdate"]
      }
    }
  });

  if (!response.text) throw new Error("No response from AI");
  return JSON.parse(response.text) as AdventureResponse;
};

// New function to summarize the session for the archives
export const generateSessionSummary = async (history: { text: string; choice: string }[]): Promise<string> => {
  const ai = await getAIClient();
  const model = "gemini-flash-lite-latest";
  
  const historyText = history.map(h => `Olay: ${h.text}\nSeçim: ${h.choice}`).join("\n");
  
  const prompt = `
    Aşağıdaki oyun oturumunu 2-3 cümlelik kısa bir özet haline getir.
    Önemli olayları, gidilen şehirleri ve yapılan büyük değişiklikleri belirt.
    Üçüncü şahıs ağzından yaz (Örn: "Oyuncu Solaris'e gitti...").
    
    OTURUM GEÇMİŞİ:
    ${historyText}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text || "Özet oluşturulamadı.";
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
  const ai = await getAIClient();
  const model = "gemini-3-pro-image-preview";
  const fullPrompt = `${prompt}. World setting: Aethelgard fantasy realm. Art style: High fantasy digital painting, detailed textures, dramatic lighting, consistent character design, cinematic composition.`;

  const response = await ai.models.generateContent({
    model,
    contents: { parts: [{ text: fullPrompt }] },
    config: {
      imageConfig: { imageSize: "1K", aspectRatio: "16:9" }
    }
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

export const chatWithBot = async (
  history: {role: 'user' | 'model', text: string}[], 
  newMessage: string,
  loreContext: string | null
): Promise<string> => {
  const ai = await getAIClient();
  const model = "gemini-3-pro-preview";
  const activeLore = loreContext || FALLBACK_LORE;

  const chat = ai.chats.create({
    model,
    history: history.map(h => ({
      role: h.role,
      parts: [{ text: h.text }]
    })),
    config: {
      systemInstruction: `Sen 'Aethelgard' (Sonsuz Diyarlar) dünyasındaki Diyar Kahinisin. 
      REFERANS BİLGİLER: ${activeLore}
      Görevin: Oyuncuya dünya hakkında bilgi ver, gizemli konuş, karakterden çıkma. Türkçe konuş.`
    }
  });

  const result = await chat.sendMessage({ message: newMessage });
  return result.text || "Sessiz kalıyorum.";
};