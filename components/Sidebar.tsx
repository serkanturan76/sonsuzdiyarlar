import React from 'react';
import { GameState } from '../types';

interface SidebarProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  isOpen: boolean;
  toggle: () => void;
  onSaveAndQuit: () => void;
  onGoToCampsite: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ gameState, setGameState, isOpen, toggle, onSaveAndQuit, onGoToCampsite }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggle}
      />
      
      {/* Sidebar Content */}
      <aside 
        className={`fixed right-0 top-0 h-full w-80 bg-slate-900 border-l border-slate-700 p-6 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:static md:block shadow-2xl overflow-y-auto flex flex-col`}
      >
        <div className="flex justify-between items-center mb-8 md:hidden">
          <h2 className="text-xl font-bold text-amber-500">Menü</h2>
          <button onClick={toggle} className="text-slate-400 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">
            Karakter
          </h3>
          <div className="flex justify-between items-center">
             <p className="text-white font-ornate text-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-600">person</span>
                {gameState.characterName}
             </p>
             <span className="text-amber-500/80 font-mono text-lg tracking-widest" title="Kalan Eylem Hakkı">
                {'.'.repeat(Math.max(0, 10 - gameState.remainingRequests.toString().length))}{gameState.remainingRequests}
             </span>
          </div>
        </div>

        {/* Long Rest Button */}
        <div className="mb-8">
            <button
                onClick={onGoToCampsite}
                disabled={gameState.remainingRequests > 0}
                className={`w-full py-3 px-4 rounded border font-ornate uppercase tracking-widest transition-all duration-500 flex items-center justify-center gap-2 ${
                    gameState.remainingRequests === 0 
                    ? 'bg-indigo-900/80 border-indigo-500 text-indigo-100 hover:bg-indigo-800 shadow-[0_0_15px_rgba(99,102,241,0.4)] animate-pulse cursor-pointer' 
                    : 'bg-slate-800/50 border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                }`}
            >
                <span className="material-symbols-outlined">bedtime</span>
                Long Rest
            </button>
            {gameState.remainingRequests === 0 && (
                <p className="text-xs text-indigo-300 text-center mt-2 italic">
                    Yorgunluktan bitkin düştün. Dinlenmelisin.
                </p>
            )}
        </div>

        <div className="mb-8">
          <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">
            Mevcut Görev
          </h3>
          <p className="text-slate-300 italic text-lg leading-relaxed">
            {gameState.quest || "Hayatta kal ve keşfet."}
          </p>
        </div>

        <div className="mb-8 flex-1">
          <h3 className="text-amber-500 font-bold uppercase tracking-widest text-sm mb-4 border-b border-slate-700 pb-2">
            Envanter
          </h3>
          {gameState.inventory.length === 0 ? (
            <p className="text-slate-500 text-sm">Çantanız boş.</p>
          ) : (
            <ul className="space-y-2">
              {gameState.inventory.map((item, idx) => (
                <li key={idx} className="flex items-center text-slate-300 bg-slate-800 p-2 rounded border border-slate-700">
                  <span className="mr-2 text-amber-500">❖</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-700">
            <button 
                onClick={onSaveAndQuit}
                disabled={gameState.history.length === 0}
                className="w-full bg-red-900/50 hover:bg-red-800 border border-red-700 text-red-200 py-3 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" transform="rotate(45 10 10)" />
                </svg>
                Oyunu Bitir & Kaydet
            </button>
            <p className="text-xs text-slate-500 text-center mt-2">
                Karakter özeti arşive yazılacak.
            </p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;