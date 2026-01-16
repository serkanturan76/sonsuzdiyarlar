import React, { useState, useEffect, useRef } from 'react';
import { GameState, StorySegment } from './types';
import Sidebar from './components/Sidebar';
import ChatWidget from './components/ChatWidget';
import LandingPage from './components/LandingPage';
import CampsitePage from './components/CampsitePage';
import { generateAdventureStep, generateSceneImage, generateSessionSummary } from './services/gemini';
import { fetchWorldLore, fetchArchives, fetchLastLogForPlayer, saveGameLog, supabase, signOut, getUserLimits, decrementUserLimit } from './services/supabase';
import { ENV } from './utils/env';

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

type ViewState = 'landing' | 'game' | 'campsite';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  
  const [worldLore, setWorldLore] = useState<string | null>(null);
  const [archives, setArchives] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      setUser(session?.user || null);
      supabase?.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user || null);
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

  useEffect(() => {
    if (user && gameState.characterName && gameState.history.length === 0) {
      handleStartAdventure(gameState.characterName);
    }
  }, [user, gameState.characterName]);

  const checkLimitsAndRoute = async () => {
    if (!user) return;
    const limits = await getUserLimits(user.id);
    
    setGameState(prev => ({
      ...prev,
      remainingRequests: limits.request_count,
      nextResetTime: limits.last_reset_at
    }));

    if (limits.request_count <= 0) {
      setCurrentView('campsite');
    } else {
      setCurrentView('game');
    }
  };

  const consumeRequest = async () => {
    if (!user) return;
    const newCount = await decrementUserLimit(user.id);
    setGameState(prev => ({ ...prev, remainingRequests: newCount }));
    if (newCount <= 0) {
      // Allow user to finish reading current result, but next action will be blocked or show button
    }
  };

  const handleLogout = async () => {
    await signOut();
    setGameState(INITIAL_STATE);
    setCurrentView('landing');
  };

  const handleStartAdventure = async (name: string) => {
    // First, check limits
    if (!user) return;
    const limits = await getUserLimits(user.id);
    
    setGameState(prev => ({
      ...prev,
      characterName: name,
      remainingRequests: limits.request_count,
      nextResetTime: limits.last_reset_at
    }));

    if (limits.request_count <= 0) {
      setCurrentView('campsite');
      return;
    } else {
      setCurrentView('game');
    }

    setGameState(prev => ({ ...prev, isLoading: true }));
    setLoadingMessage("Mazi inceleniyor...");
    
    const lastSummary = await fetchLastLogForPlayer(name);
    // Don't consume request for resuming/starting, only for generation
    handleChoice(lastSummary ? `Geçmişten Devam Et: ${lastSummary}` : "Macerayı Başlat", lastSummary);
  };

  // Image probability logic
  const calculateImageProbability = (history: StorySegment[]) => {
    if (history.length === 0) return 1.0; 
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

  const handleChoice = async (choice: string, resumeContext: string | null = null) => {
    if (gameState.isLoading && gameState.history.length > 0) return;
    if (gameState.remainingRequests <= 0 && gameState.history.length > 0) {
        alert("Gücün tükendi. Dinlenmelisin.");
        setCurrentView('campsite');
        return;
    }
    
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    setGameState(prev => ({ ...prev, isLoading: true }));

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

      // Decrement Limit here as API was used
      await consumeRequest();

      const prob = calculateImageProbability(gameState.history);
      const shouldGenerateImage = Math.random() < prob;

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
      setGameState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleSaveAndQuit = async () => {
      if (gameState.history.length === 0) return;
      const confirmSave = window.confirm("Macerayı sonlandırıp kaydetmek istiyor musun?");
      if (!confirmSave) return;
      setLoadingMessage("Hikaye arşivlere yazılıyor...");
      setGameState(prev => ({ ...prev, isLoading: true }));
      try {
          const historyForSummary = gameState.history.map(h => ({ text: h.text, choice: h.userChoice || "Maceranın Sonu" }));
          const summary = await generateSessionSummary(historyForSummary);
          await consumeRequest(); // Summary also uses API
          
          await saveGameLog(gameState.characterName, summary);
          alert(`${gameState.characterName}'in hikayesi mühürlendi.`);
          setGameState(prev => ({ ...INITIAL_STATE, characterName: prev.characterName })); 
          const newArchives = await fetchArchives();
          setArchives(newArchives);
          // Check limits again to see if we should stay on game or go to landing/campsite
          await checkLimitsAndRoute();
      } catch (e) {
          setGameState(prev => ({ ...prev, isLoading: false }));
      }
  };

  const onCampsiteWakeUp = async () => {
      await checkLimitsAndRoute();
  };

  if (isInitializing) {
      return (
        <div className="flex h-screen w-screen items-center justify-center bg-background-dark text-slate-200">
             <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                 <p className="text-primary font-ornate">Dünya Yükleniyor...</p>
             </div>
        </div>
      );
  }

  // --- VIEW ROUTING ---

  if (currentView === 'campsite') {
      return <CampsitePage nextResetTime={gameState.nextResetTime} onReturnToGame={onCampsiteWakeUp} />;
  }

  if (!user || !gameState.characterName || currentView === 'landing') {
    return <LandingPage onAuthSuccess={(name) => handleStartAdventure(name)} />;
  }

  // Game View
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
        onSaveAndQuit={handleSaveAndQuit}
        onGoToCampsite={() => setCurrentView('campsite')}
      />
      <ChatWidget loreContext={worldLore} onMessageSent={consumeRequest} />
    </div>
  );
};

export default App;