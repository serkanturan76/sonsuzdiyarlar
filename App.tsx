import React, { useState, useEffect, useRef } from 'react';
import { GameState, StorySegment } from './types';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';
import { generateAdventureStep, generateSceneImage, generateSessionSummary } from './services/gemini';
import { fetchWorldLore, fetchArchives, saveGameLog } from './services/supabase';
import { ENV } from './utils/env';

const INITIAL_STATE: GameState = {
  history: [],
  inventory: [],
  quest: "Yolculuğuna başla.",
  isLoading: false,
};

const LOADING_MESSAGES = [
  "Kader ağlarını örüyor...",
  "Dünya tarihçesi inceleniyor...",
  "Kadim kayıtlar okunuyor...",
  "Yıldızların konumu hesaplanıyor...",
  "Gerçeklik perdesi aralanıyor...",
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [needsApiKey, setNeedsApiKey] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  
  // Data from Supabase
  const [worldLore, setWorldLore] = useState<string | null>(null);
  const [archives, setArchives] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Initial Setup: Check Key & Fetch Supabase Data
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      
      // Fetch Data parallel
      const [loreData, archivesData] = await Promise.all([
        fetchWorldLore(),
        fetchArchives()
      ]);
      
      setWorldLore(loreData);
      setArchives(archivesData);

      // --- AUTHENTICATION LOGIC ---
      
      // Case A: Deployment with Env Vars (Netlify)
      if (ENV.GEMINI_API_KEY) {
         setNeedsApiKey(false);
         if (gameState.history.length === 0) {
             handleChoice("Macerayı Başlat");
         }
      } 
      // Case B: Dev Mode with AI Studio Window (IDX)
      else if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
          setNeedsApiKey(true);
        } else {
            if (gameState.history.length === 0) {
               handleChoice("Macerayı Başlat");
            }
        }
      } 
      // Case C: No Key Found
      else {
         setNeedsApiKey(true);
      }
      
      setIsInitializing(false);
    };
    
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (hasKey) {
        setNeedsApiKey(false);
        if (gameState.history.length === 0) handleChoice("Macerayı Başlat");
      }
    } else {
      // Manual Prompt for fallback (Not ideal for production but helpful if env var missing)
      const key = prompt("Lütfen Gemini API Anahtarınızı giriniz:");
      if (key) {
        // Warning: This is a hacky fallback. In React proper state management is better,
        // but for this specific architecture we need to reload to set the env var or modify the service.
        // For now, we will ask the user to configure Netlify properly.
        alert("Lütfen bu anahtarı Netlify panelinde 'VITE_GEMINI_API_KEY' olarak ayarlayın ve sayfayı yenileyin.");
      }
    }
  };

  const handleChoice = async (choice: string) => {
    if (gameState.isLoading) return;

    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    setGameState(prev => ({ ...prev, isLoading: true }));

    if (gameState.history.length > 0) {
       setGameState(prev => {
           const newHistory = [...prev.history];
           newHistory[newHistory.length - 1].userChoice = choice;
           return { ...prev, history: newHistory };
       });
    }

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    try {
      const historyContext = gameState.history.map(h => ({ 
          text: h.text, 
          choice: h.userChoice || choice 
      }));

      // Pass the fetched Lore and Archives to Gemini
      const adventureData = await generateAdventureStep(
        historyContext,
        gameState.inventory,
        gameState.quest,
        worldLore, 
        archives
      );

      // Image generation logic
      let shouldGenerateImage = false;
      const historyLen = gameState.history.length;

      if (historyLen === 0) {
        shouldGenerateImage = true;
      } else {
        let noImageCount = 0;
        for (let i = historyLen - 1; i >= 0; i--) {
            if (!gameState.history[i].imageUrl) noImageCount++;
            else break;
        }
        if (noImageCount === 0) shouldGenerateImage = Math.random() < 0.05;
        else if (noImageCount === 1) shouldGenerateImage = Math.random() < 0.35;
        else if (noImageCount === 2) shouldGenerateImage = Math.random() < 0.50;
        else if (noImageCount === 3) shouldGenerateImage = Math.random() < 0.80;
        else shouldGenerateImage = true;
      }

      let imageUrl: string | undefined = undefined;
      if (shouldGenerateImage) {
        try {
            imageUrl = await generateSceneImage(adventureData.imagePrompt);
        } catch (imgError) {
            console.error("Image generation failed", imgError);
        }
      }

      const newSegment: StorySegment = {
        id: Date.now().toString(),
        text: adventureData.text,
        imagePrompt: adventureData.imagePrompt,
        options: adventureData.options,
        imageUrl: imageUrl 
      };

      setGameState(prev => {
        let newInventory = [...prev.inventory];
        if (adventureData.inventoryUpdate.remove) {
             newInventory = newInventory.filter(item => !adventureData.inventoryUpdate.remove.includes(item));
        }
        if (adventureData.inventoryUpdate.add) {
            const adds = adventureData.inventoryUpdate.add.filter(item => !newInventory.includes(item));
            newInventory = [...newInventory, ...adds];
        }

        return {
          ...prev,
          history: [...prev.history, newSegment],
          inventory: newInventory,
          quest: adventureData.questUpdate || prev.quest,
          isLoading: false
        };
      });

      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

    } catch (error) {
      console.error("Adventure generation failed", error);
      setGameState(prev => ({ ...prev, isLoading: false }));
      alert("Bağlantı hatası veya API Anahtarı eksik.");
    }
  };

  const handleSaveAndQuit = async () => {
      if (gameState.history.length === 0) return;
      
      const confirmSave = window.confirm("Macerayı sonlandırıp kaydetmek istiyor musun? Bu hikaye Dünya Arşivlerine yazılacak.");
      if (!confirmSave) return;

      setLoadingMessage("Hikaye arşivlere yazılıyor...");
      setGameState(prev => ({ ...prev, isLoading: true }));

      try {
          const historyForSummary = gameState.history.map(h => ({ 
              text: h.text, 
              choice: h.userChoice || "Son" 
          }));
          const summary = await generateSessionSummary(historyForSummary);
          const playerName = `Gezgin ${Math.floor(Math.random() * 1000)}`;
          await saveGameLog(playerName, summary);

          alert(`Maceranız kaydedildi! \n\nÖzet: ${summary}`);
          setGameState(INITIAL_STATE);
          const newArchives = await fetchArchives();
          setArchives(newArchives);
          
      } catch (e) {
          console.error(e);
          alert("Kaydetme sırasında bir hata oluştu.");
          setGameState(prev => ({ ...prev, isLoading: false }));
      }
  };

  if (isInitializing) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200">
             <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-amber-500 font-serif">Dünya Yükleniyor...</p>
             </div>
        </div>
      );
  }

  // Modified Empty State Screen for Netlify users
  if (needsApiKey) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="text-center p-8 max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl">
          <h1 className="text-4xl text-amber-500 font-bold mb-4 font-serif">SONSUZ DİYARLAR</h1>
          <p className="mb-6 text-slate-400">
            {window.aistudio 
              ? "Kaderini dokumak için bir API anahtarı seçmelisin." 
              : "Bu oyunun çalışması için API anahtarı gereklidir."}
          </p>
          
          {!window.aistudio && (
             <div className="text-xs text-left bg-slate-950 p-4 rounded border border-red-900/50 text-slate-400 mb-6">
                <p className="font-bold text-red-400 mb-2">Kurulum Hatası:</p>
                <p>Netlify ayarlarında API Anahtarı bulunamadı.</p>
                <p className="mt-2">Lütfen Netlify Panelinde &rarr; <strong>Site Configuration &rarr; Environment Variables</strong> kısmına şu anahtarı ekleyin:</p>
                <code className="block bg-black p-2 mt-1 text-amber-500">VITE_GEMINI_API_KEY</code>
             </div>
          )}

          {window.aistudio ? (
             <button onClick={handleSelectKey} className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                Kapıları Aç (Local Mode)
             </button>
          ) : (
             <button onClick={() => window.location.reload()} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg">
                Sayfayı Yenile
             </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <header className="absolute top-0 left-0 w-full p-4 z-10 bg-gradient-to-b from-slate-950 to-transparent flex justify-between items-center">
            <h1 className="text-2xl font-bold text-amber-500 tracking-wider drop-shadow-md">SONSUZ DİYARLAR</h1>
            <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="md:hidden p-2 text-slate-300 bg-slate-900/50 rounded-lg backdrop-blur"
            >
                <span className="text-xl">☰</span>
            </button>
        </header>

        <main className="flex-1 overflow-y-auto pt-20 pb-20 px-4 md:px-8 lg:px-20 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-12">
             {gameState.history.map((segment, index) => (
               <div key={segment.id} className="animate-fade-in flex flex-col">
                  {segment.imageUrl && (
                      <div className="w-full aspect-video bg-slate-900 rounded-t-lg rounded-b-none overflow-hidden shadow-2xl border border-slate-800 border-b-0 relative z-0">
                          <img src={segment.imageUrl} alt={segment.imagePrompt} className="w-full h-full object-cover animate-fade-in"/>
                      </div>
                  )}
                  <div className={`relative z-10 mx-2 md:mx-6 ${segment.imageUrl ? '-mt-6' : 'mt-4'}`}>
                    <div className="bg-slate-900/95 backdrop-blur-sm border border-amber-600/30 shadow-xl rounded-xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-600 to-transparent opacity-70"></div>
                        <div className="prose prose-invert prose-lg max-w-none">
                            <p className="leading-relaxed text-slate-200 font-serif text-lg md:text-xl drop-shadow-sm">{segment.text}</p>
                        </div>
                    </div>
                  </div>
                  {segment.userChoice && index < gameState.history.length - 1 && (
                      <div className="mt-4 flex justify-end mr-6">
                          <span className="bg-slate-800 text-amber-500 px-4 py-1 rounded-full text-sm border border-slate-700 italic flex items-center gap-2 shadow-lg">
                              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                              Seçimin: {segment.userChoice}
                          </span>
                      </div>
                  )}
               </div>
             ))}
             
             {gameState.isLoading && (
                 <div className="flex justify-center items-center py-20 animate-fade-in">
                     <div className="bg-slate-900/80 border border-amber-500/20 p-8 rounded-full shadow-[0_0_50px_rgba(245,158,11,0.1)] flex flex-col items-center gap-4 text-center max-w-lg">
                        <div className="w-16 h-16 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin"></div>
                        <p className="text-amber-500 font-serif text-xl tracking-wide animate-pulse">{loadingMessage}</p>
                     </div>
                 </div>
             )}

             {!gameState.isLoading && gameState.history.length > 0 && (
                <div className="pt-4 pb-12 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {gameState.history[gameState.history.length - 1].options.map((option, idx) => (
                            <button key={idx} onClick={() => handleChoice(option)} className="group relative bg-slate-900/90 backdrop-blur hover:bg-slate-800 border border-slate-600 hover:border-amber-500 text-left p-4 rounded-lg transition-all shadow-lg hover:shadow-amber-900/30 active:scale-95 transform hover:-translate-y-1">
                                <span className="absolute top-3 left-3 text-xs text-slate-500 font-mono group-hover:text-amber-500 transition-colors">0{idx + 1}</span>
                                <span className="block mt-4 text-slate-200 font-bold group-hover:text-white transition-colors">{option}</span>
                            </button>
                        ))}
                    </div>
                </div>
             )}
             <div ref={bottomRef} />
          </div>
        </main>
      </div>

      <Sidebar 
        gameState={gameState} 
        setGameState={setGameState}
        isOpen={isSidebarOpen} 
        toggle={() => setIsSidebarOpen(!isSidebarOpen)}
        onSaveAndQuit={handleSaveAndQuit}
      />

      {/* Chat now needs context */}
      <ChatWidget loreContext={worldLore} />
    </div>
  );
};

export default App;