import React, { useState, useEffect } from 'react';

interface CampsitePageProps {
  nextResetTime: string | null;
  onReturnToGame: () => void;
}

const CampsitePage: React.FC<CampsitePageProps> = ({ nextResetTime, onReturnToGame }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({ h: 24, m: 0, s: 0 });
  const [canReturn, setCanReturn] = useState(false);

  useEffect(() => {
    if (!nextResetTime) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const resetTime = new Date(nextResetTime).getTime();
      const nextReset = resetTime + (24 * 60 * 60 * 1000); // Reset time in DB + 24 hours
      const distance = nextReset - now;

      if (distance < 0) {
        clearInterval(interval);
        setCanReturn(true);
        setTimeLeft({ h: 0, m: 0, s: 0 });
      } else {
        const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ h, m, s });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextResetTime]);

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden font-newsreader text-white bg-black">
      <div className="absolute inset-0 z-0 bg-black">
        <div 
            className="w-full h-full bg-[center_top_30%] bg-no-repeat bg-cover transition-all duration-700" 
            data-alt="Dark forest campsite at night under full moon with embers" 
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBXXPjbmZgd6lSQIJKi5uppL2TfxQeyFIOBQKdLf0H2-2rkfIN-kVk5-8ipQQnj8nFGPlG1IsHUzv_JEcs-QggMjF3JZzwrTWFvBfdTBrcAjHp30BzOeR2JRjOXdbn8VONbwz87qbwPb6-QQZXrY5nLNQmlCDBpDg6z9EIyM4IAGtIfE-1yN4ixQtmpRpxG-FL_8LGnZ3XoFHDWR4rY3kWZfVGKma-tBeVPyk2NX-qtB91NFHTPAKhDZF4QwCG0M5lMlaohe76s2Vk")'}}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 vignette-overlay pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-black via-black/90 to-transparent"></div>
      </div>

      <div className="relative z-10 flex items-center p-4 justify-between bg-gradient-to-b from-black/80 to-transparent pt-8 h-[10%]">
        <div className="text-white flex size-12 shrink-0 items-center justify-start">
            {canReturn && (
                <button onClick={onReturnToGame} className="flex items-center gap-2 hover:text-gold transition-colors">
                    <span className="material-symbols-outlined cursor-pointer">arrow_back_ios</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Uyan</span>
                </button>
            )}
        </div>
        <h2 className="text-white text-xl font-bold leading-tight tracking-tight flex-1 text-center italic opacity-80">Sonsuz Diyarlar</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex size-10 cursor-pointer items-center justify-center rounded-lg bg-white/5 backdrop-blur-sm text-white transition-colors hover:bg-white/10 border border-white/5">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>

      <div className="flex-grow relative z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col justify-end pb-6 px-6 h-[30%]">
        <h2 className="text-gold tracking-wide text-base font-medium leading-tight text-center mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
            Güneşin doğmasına
        </h2>
        
        <div className="flex gap-2 py-2 max-w-[280px] mx-auto w-full items-end justify-center">
          <div className="flex grow basis-0 flex-col items-center gap-1">
            <div className="flex h-10 w-12 items-center justify-center rounded bg-black/40 border border-white/10 backdrop-blur-sm shadow-inner">
              <p className="text-white text-lg font-bold tracking-widest">{timeLeft.h.toString().padStart(2, '0')}</p>
            </div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">Saat</p>
          </div>
          <div className="flex items-center pb-4 h-10 text-gold/80 text-lg font-bold">:</div>
          <div className="flex grow basis-0 flex-col items-center gap-1">
            <div className="flex h-10 w-12 items-center justify-center rounded bg-black/40 border border-white/10 backdrop-blur-sm shadow-inner">
              <p className="text-white text-lg font-bold tracking-widest">{timeLeft.m.toString().padStart(2, '0')}</p>
            </div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">Dakika</p>
          </div>
          <div className="flex items-center pb-4 h-10 text-gold/80 text-lg font-bold">:</div>
          <div className="flex grow basis-0 flex-col items-center gap-1">
            <div className="flex h-10 w-12 items-center justify-center rounded bg-black/40 border border-white/10 backdrop-blur-sm shadow-inner">
              <p className="text-white text-lg font-bold tracking-widest">{timeLeft.s.toString().padStart(2, '0')}</p>
            </div>
            <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">Saniye</p>
          </div>
        </div>

        <div className="flex justify-center mt-3">
          <button 
            disabled={true}
            className="group relative flex w-full max-w-[260px] cursor-not-allowed opacity-50 items-center justify-center overflow-hidden rounded border border-gold/30 h-11 px-4 bg-gradient-to-r from-gold/80 via-gold to-gold/80 text-white gap-2 shadow-[0_0_15px_rgba(207,130,23,0.2)]"
          >
            <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAssBdTJZiQn00Svk0lDiBGMb5cj1zTvDHWAh9uufw3w1aMPFtY-3fNc7eY1fVanPgbIYqKVsHWwFEOSaFd-pBb7lZUZhkpe18ZvdOOkE2kHbKyvFPDGjQfMNnEBNmTvitDKTANUJAdNRLC57sbQVBeD9DPd04cb0MB1yKAyC3dPpIXhavOtl-U00gs19FEfMVHOmMnzhnA6xMuHf3oY7kt3FbLjGpbx2nQV0L5QDpgMbHWR72b4Vs2fYhBMpP79VLNJxmalv4DgaI")'}}></div>
            <span className="material-symbols-outlined text-white text-[18px]">hourglass_empty</span>
            <span className="truncate text-sm font-bold uppercase tracking-wider drop-shadow-md">Zamanı Hızlandır (Yakında)</span>
          </button>
        </div>
        
        <div className="mt-3 text-center">
          <p className="text-white/30 text-[10px] italic font-light tracking-wide">Kamp ateşi yavaşça sönüyor, gece sessiz.</p>
        </div>
      </div>
    </div>
  );
};

export default CampsitePage;