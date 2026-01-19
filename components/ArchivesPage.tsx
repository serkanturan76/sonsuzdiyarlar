
import React, { useEffect, useState } from 'react';
import { fetchAllLogsForPlayer, fetchUniquePlayerNames } from '../services/supabase';

interface ArchivesPageProps {
  characterName: string;
  onContinueGame: (targetName?: string) => void;
}

const ArchivesPage: React.FC<ArchivesPageProps> = ({ characterName, onContinueGame }) => {
  const [logs, setLogs] = useState<{created_at: string, summary: string}[]>([]);
  const [existingCharacters, setExistingCharacters] = useState<string[]>([]);
  const [newCharName, setNewCharName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      // 1. Current character logs
      const currentLogs = await fetchAllLogsForPlayer(characterName);
      setLogs(currentLogs);

      // 2. All unique character names for this account
      const allNames = await fetchUniquePlayerNames();
      // Filter out the current one to show in "Other Characters"
      const others = allNames.filter(n => n !== characterName);
      setExistingCharacters(others);

      setLoading(false);
    };
    loadData();
  }, [characterName]);

  const handleCreateNew = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCharName.trim().length > 0) {
          onContinueGame(newCharName.trim());
      }
  };

  return (
    <div className="relative h-screen w-full flex flex-col bg-deep-black text-slate-300 font-newsreader overflow-hidden">
      {/* Background with Overlay */}
      <div className="absolute inset-0 z-0">
         <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black z-10"></div>
         <img 
           src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLJquojL0bkBmumIyv4xpw6XFGiEz9iSS48wcxwUmo50jOESXKTjsvhE_YpFiJsouJ8kcqO4rT7-x8a-ybkOtev_lp82z1w1fwIBdU63BBODbeUUUjSaF2pmkraGTShG5jG9wXmlA7Nkk2_yQsuolP34LX0hYV8EKEbTgiLyj5zMchxFAeONwBXkyxt0XqaAFpVC1kkp7hSzT9lz-QSeNNhAMZyra2-jgA3fH5RcxO-Xo8CFbr0XpyJoCxV8coaKXi_WWkCkJAe_M" 
           alt="Archives" 
           className="w-full h-full object-cover opacity-20 filter blur-sm grayscale"
         />
      </div>

      {/* Content */}
      <div className="relative z-20 flex flex-col h-full max-w-5xl mx-auto w-full px-6 py-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-6 shrink-0 animate-fade-in-down">
            <h2 className="text-4xl md:text-5xl font-ornate text-white tracking-widest uppercase drop-shadow-lg">
                Zihin Sarayı
            </h2>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"></div>
            <p className="text-gold/80 italic text-lg">{characterName}'in Geçmiş Anıları</p>
        </div>

        {/* Scrollable Log List */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-4 scrollbar-hide mask-image-linear-fade border-b border-white/5 pb-4">
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center text-slate-500 italic py-10">
                    Henüz yazılmış bir kader yok...
                </div>
            ) : (
                logs.map((log, index) => (
                    <div key={index} className="group relative bg-white/5 border border-white/5 hover:border-gold/30 rounded-lg p-5 transition-all hover:bg-white/10 animate-fade-in" style={{animationDelay: `${index * 50}ms`}}>
                        <div className="absolute -left-3 top-5 w-6 h-6 bg-deep-black border border-gold/50 rounded-full flex items-center justify-center z-10">
                            <div className="w-2 h-2 bg-gold rounded-full"></div>
                        </div>
                        <div className="border-l-2 border-white/10 pl-6 ml-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 block font-display">
                                {new Date(log.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="text-slate-200 leading-relaxed text-base font-light">
                                {log.summary}
                            </p>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Footer Actions - Split Layout */}
        <div className="pt-6 shrink-0 grid lg:grid-cols-3 gap-8 items-start animate-fade-in-up">
            
            {/* 1. Continue Current */}
            <div className="lg:col-span-1 flex flex-col gap-4">
                <button 
                    onClick={() => onContinueGame()}
                    className="w-full group relative px-6 py-4 bg-gradient-to-r from-amber-900 to-amber-800 text-white font-ornate tracking-[0.2em] uppercase rounded border border-amber-700/50 hover:border-gold shadow-[0_0_20px_rgba(207,130,23,0.2)] hover:shadow-[0_0_40px_rgba(207,130,23,0.4)] transition-all overflow-hidden"
                >
                    <span className="relative z-10 flex items-center justify-center gap-2 font-bold text-sm">
                       Maceraya Dön
                       <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform text-lg">arrow_forward</span>
                    </span>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                </button>
                <p className="text-[10px] text-center text-slate-500 uppercase tracking-widest">
                    {characterName} olarak devam et
                </p>
            </div>

            {/* 2. Switch Character */}
            <div className="lg:col-span-1 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
                <h4 className="text-xs text-gold font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">history</span>
                    Eski Yüzler
                </h4>
                {existingCharacters.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">Başka bir geçmiş bulunamadı.</p>
                ) : (
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {existingCharacters.map((char, idx) => (
                            <button
                                key={idx}
                                onClick={() => onContinueGame(char)}
                                className="px-3 py-2 bg-slate-900 border border-slate-700 rounded text-xs text-slate-300 hover:text-white hover:border-gold/50 hover:bg-slate-800 transition-colors truncate max-w-[150px]"
                                title={`${char} olarak oyna`}
                            >
                                {char}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 3. New Character */}
            <div className="lg:col-span-1 flex flex-col gap-3 border-t lg:border-t-0 lg:border-l border-white/10 pt-6 lg:pt-0 lg:pl-8">
                <h4 className="text-xs text-white font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Yeni Bir Kader Yaz
                </h4>
                <form onSubmit={handleCreateNew} className="flex gap-2">
                    <input 
                        type="text" 
                        value={newCharName}
                        onChange={(e) => setNewCharName(e.target.value)}
                        placeholder="Yeni İsim..." 
                        className="w-full bg-slate-900/50 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50"
                    />
                    <button 
                        type="submit"
                        disabled={!newCharName.trim()}
                        className="bg-slate-800 hover:bg-primary/80 border border-slate-700 hover:border-primary text-white p-2 rounded disabled:opacity-50 transition-colors"
                    >
                        <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                </form>
                <p className="text-[9px] text-slate-500 leading-tight">
                    Yeni bir isim, sıfır bir envanter ve yazılmamış bir tarih demektir.
                </p>
            </div>

        </div>

      </div>
    </div>
  );
};

export default ArchivesPage;
