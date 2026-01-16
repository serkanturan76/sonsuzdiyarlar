import React, { useState, useEffect, useRef } from 'react';
import { GameState, StorySegment } from './types';
import Sidebar from './components/Sidebar';
import LandingPage from './components/LandingPage';
import CampsitePage from './components/CampsitePage';
import { generateAdventureStep, generateSceneImage, generateSessionSummary } from './services/gemini';
import { fetchWorldLore, fetchArchives, fetchLastLogForPlayer, saveGameLog, supabase, signOut, getUserLimits, decrementUserLimit } from './services/supabase';

const INITIAL_STATE: GameState = {
  history: [],
  inventory: [],
  quest: "Yolculuğuna başla.",
  isLoading: false,
  characterName: "",
  remainingRequests: 10,
  nextResetTime: null,
};

const LOADING_MESSAGES = [
  "Kader ağlarını örüyor...",
  "Dünya tarihçesi inceleniyor...",
  "Kadim kayıtlar okunuyor...",
  "Gerçeklik perdesi aralanıyor...",
];

type ViewState = 'landing' | 'checking_limits' | 'game' | 'campsite';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  
  const [worldLore, setWorldLore] = useState<string | null>(null);
  const [archives, setArchives] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Strict Mode double-fire prevention
  const adventureStartedRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 1. Initial Data Load (Lore & Archives)
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      setUser(session?.user || null);
      
      supabase?.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
        if (!session?.user) {
             adventureStartedRef.current = false;
        }
      });

      const [loreData, archivesData] = await Promise.all([
        fetchWorldLore(),
        fetchArchives()
      ]);
      setWorldLore(loreData);
      setArchives(archivesData);
      setIsInitializing(false);
    };
    init();
  }, []);

  // 2. CENTRALIZED GAME START LOGIC
  useEffect(() => {
    if (user && gameState.characterName && !adventureStartedRef.current) {
      adventureStartedRef.current = true;
      checkLimitsAndStart();
    }
  }, [user, gameState.characterName]);

  const checkLimitsAndStart = async () => {
      if (!user) return;

      // A) Show Loading
      setCurrentView('checking_limits');
      setLoadingMessage("Yıldızlar hizalanıyor...");
      
      try {
        // B) Check Limits & Reset Logic (handled in getUserLimits)
        const limits = await getUserLimits(user.id);
        
        setGameState(prev => ({
          ...prev,
          remainingRequests: limits.request_count,
          nextResetTime: limits.last_reset_at
        }));

        // C) Route based on limits
        if (limits.request_count <= 0) {
          // No requests left? Go to campsite immediately.
          setCurrentView('campsite');
          // Do NOT proceed to game generation.
          return;
        }

        // D) Requests available? Proceed to Game.
        setCurrentView('game');
        
        // E) Generate Initial Story ONLY if history is empty
        if (gameState.history.length === 0) {
            setGameState(prev => ({ ...prev, isLoading: true }));
            setLoadingMessage("Mazi inceleniyor...");
            
            // Check logs specifically for THIS character name
            const lastSummary = await fetchLastLogForPlayer(gameState.characterName);
            const startPrompt = lastSummary 
                ? `Geçmişten Devam Et: ${lastSummary}` 
                : "Macerayı Başlat (Giriş Sahnesi)";
            
            // Force `isInitialLoad` to true to bypass strict checks in handleChoice
            await handleChoice(startPrompt, lastSummary, true);
        }

      } catch (e) {
        console.error("Init flow error", e);
        setCurrentView('landing'); 
      }
  };

  const consumeRequest = async () => {
    if (!user) return;
    const newCount = await decrementUserLimit(user.id);
    setGameState(prev => ({ ...prev, remainingRequests: newCount }));
  };

  const handleLogout = async () => {
    await signOut();
    adventureStartedRef.current = false;
    setGameState(INITIAL_STATE);
    setCurrentView('landing');
  };

  // Image probability logic
  const calculateImageProbability = (history: StorySegment[]) => {
    if (history.length === 0) return 1.0; // First slide ALWAYS has image
    let gap = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].imageUrl) break;
      gap++;
    }
    if (gap === 0) return 0.05; 
    if (gap === 1) return 0.20; 
    if (gap === 2) return 0.35; 
    if (gap === 3) return 0.50; 
    if (gap === 4) return 0.80; 
    if (gap === 5) return 0.90; 
    return 1.0; 
  };

  const handleChoice = async (choice: string, resumeContext: string | null = null, isInitialLoad = false) => {
    // Safety check: Don't run if loading (unless it's the very first forced load)
    if (gameState.isLoading && !isInitialLoad) return;
    
    // Safety check: Don't run if no requests
    if (gameState.remainingRequests <= 0 && gameState.history.length > 0) {
        alert("Gücün tükendi. Kamp ateşine dönmelisin.");
        // We don't force campsite view here immediately to allow user to save via sidebar
        return;
    }
    
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    setGameState(prev => ({ ...prev, isLoading: true }));

    // Optimistic UI update for user choice
    if (gameState.history.length > 0) {
       setGameState(prev => {
           const newHistory = [...prev.history];
           newHistory[newHistory.length - 1].userChoice = choice;
           return { ...prev, history: newHistory };
       });
    }

    try {
      const historyContext = gameState.history.map(h => ({ 
          text: h.text, 
          choice: h.userChoice || choice 
      }));

      const adventureData = await generateAdventureStep(
        historyContext,
        gameState.inventory,
        gameState.quest,
        worldLore, 
        archives,
        resumeContext
      );

      // Decrement Limit
      await consumeRequest();

      // Image Logic
      const prob = calculateImageProbability(gameState.history);
      const shouldGenerateImage = Math.random() < prob;

      let imageUrl: string | undefined = undefined;
      
      // If it's the very first load or probability hits
      if (isInitialLoad || shouldGenerateImage) {
        setLoadingMessage("Evren resmediliyor...");
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
      console.error("Adventure Step Error:", error);
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const saveToLog = async () => {
    if (gameState.history.length === 0) return;
    setLoadingMessage("Hikaye arşivlere yazılıyor...");
    setGameState(prev => ({ ...prev, isLoading: true }));
    try {
        const historyForSummary = gameState.history.map(h => ({ text: h.text, choice: h.userChoice || "Maceranın Sonu" }));
        const summary = await generateSessionSummary(historyForSummary);
        await consumeRequest(); // Consume 1 for summary generation if needed, or skip
        
        await saveGameLog(gameState.characterName, summary);
        
        const newArchives = await fetchArchives();
        setArchives(newArchives);
    } catch (e) {
        console.error("Save error", e);
    } finally {
        setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleManualSaveAndQuit = async () => {
      const confirmSave = window.confirm("Macerayı sonlandırıp kaydetmek istiyor musun?");
      if (!confirmSave) return;
      
      await saveToLog();
      alert(`${gameState.characterName}'in hikayesi mühürlendi.`);
      
      adventureStartedRef.current = false; 
      setGameState(prev => ({ ...INITIAL_STATE, characterName: prev.characterName })); 
      setCurrentView('landing');
  };

  // Called when sidebar Long Rest button is clicked
  const handleLongRest = async () => {
      const wantToSave = window.confirm("Kamp ateşine dönmeden önce bugünkü maceranı günlüğe kaydetmek ister misin?");
      if (wantToSave) {
          await saveToLog();
          alert("Günlük güncellendi. İyi uykular.");
      }
      
      setGameState(prev => ({ ...prev, isLoading: false }));
      setCurrentView('campsite');
  };

  const onCampsiteWakeUp = async () => {
      // Re-run init flow
      adventureStartedRef.current = true; // Manual lock
      checkLimitsAndStart();
  };

  if (isInitializing || currentView === 'checking_limits') {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background-dark text-slate-200">
             <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-primary font-ornate">{loadingMessage || "Dünya Yükleniyor..."}</p>
             </div>
        </div>
      );
  }

  if (currentView === 'campsite') {
      return <CampsitePage nextResetTime={gameState.nextResetTime} onReturnToGame={onCampsiteWakeUp} />;
  }

  if (!user || !gameState.characterName || currentView === 'landing') {
    return <LandingPage onAuthSuccess={(name) => setGameState(prev => ({ ...prev, characterName: name }))} />;
  }

  return (
    <div className="flex h-screen bg-background-dark text-slate-200 font-display">
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        <header className="absolute top-0 left-0 w-full p-4 z-10 bg-gradient-to-b from-deep-black to-transparent flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary tracking-wider drop-shadow-md font-ornate">SONSUZ DİYARLAR</h1>
            <div className="flex items-center gap-4">
               <span className="hidden md:block text-xs text-slate-500 italic uppercase tracking-widest">{gameState.characterName}</span>
               <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-white underline">Ayrıl</button>
               <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="md:hidden p-2 text-slate-300 bg-black/50 rounded-lg backdrop-blur"
               >
                  <span className="material-symbols-outlined">menu</span>
               </button>
            </div>
        </header>

        <main className="flex-1 overflow-y-auto pt-20 pb-20 px-4 md:px-8 lg:px-20 scroll-smooth">
          <div className="max-w-4xl mx-auto space-y-12">
             {gameState.history.map((segment, index) => (
               <div key={segment.id} className="animate-fade-in flex flex-col">
                  {segment.imageUrl && (
                      <div className="w-full aspect-video bg-slate-900 rounded-t-lg rounded-b-none overflow-hidden shadow-2xl border border-white/5 border-b-0 relative z-0">
                          <img src={segment.imageUrl} alt={segment.imagePrompt} className="w-full h-full object-cover opacity-80"/>
                      </div>
                  )}
                  <div className={`relative z-10 mx-2 md:mx-6 ${segment.imageUrl ? '-mt-6' : 'mt-4'}`}>
                    <div className="bg-charcoal/90 backdrop-blur-sm border border-primary/20 shadow-2xl rounded-xl p-6 md:p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                        <div className="prose prose-invert prose-lg max-w-none">
                            <p className="leading-relaxed text-slate-200 font-display text-lg md:text-xl drop-shadow-sm">{segment.text}</p>
                        </div>
                    </div>
                  </div>
                  {segment.userChoice && index < gameState.history.length - 1 && (
                      <div className="mt-4 flex justify-end mr-6">
                          <span className="bg-primary/20 text-primary px-4 py-1 rounded-full text-xs font-bold border border-primary/30 uppercase tracking-widest flex items-center gap-2 shadow-lg">
                              {segment.userChoice}
                          </span>
                      </div>
                  )}
               </div>
             ))}
             
             {gameState.isLoading && (
                 <div className="flex justify-center items-center py-20 animate-fade-in">
                     <div className="bg-black/80 border border-primary/20 p-8 rounded-full shadow-[0_0_50px_rgba(127,13,242,0.1)] flex flex-col items-center gap-4 text-center max-w-lg">
                        <div className="w-16 h-16 border-4 border-slate-700 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-primary font-ornate text-xl tracking-wide animate-pulse">{loadingMessage}</p>
                     </div>
                 </div>
             )}

             {!gameState.isLoading && gameState.history.length > 0 && (
                <div className="pt-4 pb-12 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {gameState.history[gameState.history.length - 1].options.map((option, idx) => (
                            <button key={idx} onClick={() => handleChoice(option)} className="group relative bg-charcoal/80 backdrop-blur hover:bg-primary/20 border border-white/10 hover:border-primary text-left p-5 rounded-lg transition-all shadow-xl active:scale-95 transform">
                                <span className="absolute top-3 right-3 text-[10px] text-slate-600 font-mono group-hover:text-primary transition-colors tracking-widest uppercase">Eylem {idx + 1}</span>
                                <span className="block text-slate-200 font-bold group-hover:text-white transition-colors pr-8 leading-tight">{option}</span>
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
        onSaveAndQuit={handleManualSaveAndQuit}
        onGoToCampsite={handleLongRest}
      />
    </div>
  );
};

export default App;