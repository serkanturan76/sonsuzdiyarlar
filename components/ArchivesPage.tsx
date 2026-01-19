
import React, { useEffect, useState } from 'react';
import { fetchAllLogsForPlayer } from '../services/supabase';

interface ArchivesPageProps {
  characterName: string;
  onContinueGame: () => void;
}

const ArchivesPage: React.FC<ArchivesPageProps> = ({ characterName, onContinueGame }) => {
  const [logs, setLogs] = useState<{created_at: string, summary: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      const data = await fetchAllLogsForPlayer(characterName);
      setLogs(data);
      setLoading(false);
    };
    loadLogs();
  }, [characterName]);

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
      <div className="relative z-20 flex flex-col h-full max-w-4xl mx-auto w-full px-6 py-12">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-10 shrink-0 animate-fade-in-down">
            <h2 className="text-4xl md:text-5xl font-ornate text-white tracking-widest uppercase drop-shadow-lg">
                Zihin Sarayı
            </h2>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto"></div>
            <p className="text-gold/80 italic text-lg">{characterName}'in Geçmiş Anıları</p>
        </div>

        {/* Scrollable Log List */}
        <div className="flex-1 overflow-y-auto pr-4 space-y-8 scrollbar-hide mask-image-linear-fade">
            {loading ? (
                <div className="flex justify-center items-center h-40">
                    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="text-center text-slate-500 italic py-20">
                    Henüz yazılmış bir kader yok...
                </div>
            ) : (
                logs.map((log, index) => (
                    <div key={index} className="group relative bg-white/5 border border-white/5 hover:border-gold/30 rounded-lg p-6 transition-all hover:bg-white/10 animate-fade-in" style={{animationDelay: `${index * 100}ms`}}>
                        <div className="absolute -left-3 top-6 w-6 h-6 bg-deep-black border border-gold/50 rounded-full flex items-center justify-center z-10">
                            <div className="w-2 h-2 bg-gold rounded-full"></div>
                        </div>
                        <div className="border-l-2 border-white/10 pl-6 ml-0">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block font-display">
                                {new Date(log.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <p className="text-slate-200 leading-relaxed text-lg font-light">
                                {log.summary}
                            </p>
                        </div>
                    </div>
                ))
            )}
            
            {/* Bottom Spacer */}
            <div className="h-10"></div>
        </div>

        {/* Footer Action */}
        <div className="pt-8 mt-4 border-t border-white/10 flex justify-center shrink-0 animate-fade-in-up">
            <button 
                onClick={onContinueGame}
                className="group relative px-10 py-4 bg-gradient-to-r from-amber-900 to-amber-700 text-white font-ornate tracking-[0.2em] uppercase rounded-sm shadow-[0_0_30px_rgba(207,130,23,0.3)] hover:shadow-[0_0_50px_rgba(207,130,23,0.5)] hover:scale-105 transition-all overflow-hidden"
            >
                <span className="relative z-10 flex items-center gap-3 font-bold">
                   Maceraya Dön
                   <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </button>
        </div>

      </div>
    </div>
  );
};

export default ArchivesPage;
