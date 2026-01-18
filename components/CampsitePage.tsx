import React, { useState, useEffect } from 'react';
import { resetUserLimitByAd, supabase } from '../services/supabase';

interface CampsitePageProps {
  nextResetTime: string | null;
  onReturnToGame: () => void;
}

// Global adBreak fonksiyonu için tip tanımı
declare global {
  interface Window {
    adBreak: (args: any) => void;
  }
}

const CampsitePage: React.FC<CampsitePageProps> = ({ nextResetTime, onReturnToGame }) => {
  const [timeLeft, setTimeLeft] = useState<{h: number, m: number, s: number}>({ h: 24, m: 0, s: 0 });
  const [canReturn, setCanReturn] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);

  useEffect(() => {
    if (!nextResetTime) {
        setCanReturn(true);
        return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const resetTime = new Date(nextResetTime).getTime();
      const nextReset = resetTime + (24 * 60 * 60 * 1000); 
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
        setCanReturn(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [nextResetTime]);

  const handleWatchAd = () => {
    // SDK'nın yüklü olup olmadığını kontrol et
    if (typeof window.adBreak !== 'function') {
      console.warn("AdSense SDK henüz yüklenmedi veya engellendi.");
      alert("Reklam şu anda yüklenemiyor. Lütfen reklam engelleyicinizi (AdBlock) kapatın.");
      return;
    }

    setIsAdLoading(true);

    // Google H5 Games adBreak API kullanımı
    window.adBreak({
      type: 'reward',
      name: 'refill_adventure_moves',
      beforeAd: () => {
        console.log("Reklam başlıyor, oyun seslerini kısın.");
      },
      afterAd: () => {
        setIsAdLoading(false);
        console.log("Reklam kapandı.");
      },
      adBreakDone: (placementInfo: any) => {
        console.log("AdBreak tamamlandı:", placementInfo);
      },
      beforeReward: (showAdFn: () => void) => {
        // Reklamı göstermeden önce kullanıcıya onay penceresi vs. çıkarılabilir
        showAdFn();
      },
      adDismissed: () => {
        console.log("Kullanıcı reklamı erken kapattı.");
        alert("Ödül kazanmak için reklamı sonuna kadar izlemelisin.");
      },
      adViewed: async () => {
        // REKLAM TAMAMEN İZLENDİ - ÖDÜLÜ VER
        console.log("Reklam başarıyla izlendi, ödül veriliyor...");
        try {
          const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } };
          if (user) {
            await resetUserLimitByAd(user.id);
            alert("Ruhun tazelendi! 10 yeni hamle kazandın.");
            onReturnToGame(); 
          }
        } catch (e) {
          console.error("Reward grant failed:", e);
        }
      }
    });
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden font-newsreader text-white bg-black">
      <div className="absolute inset-0 z-0 bg-black">
        <div 
            className="w-full h-full bg-[center_top_30%] bg-no-repeat bg-cover transition-all duration-700" 
            style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBXXPjbmZgd6lSQIJKi5uppL2TfxQeyFIOBQKdLf0H2-2rkfIN-kVk5-8ipQQnj8nFGPlG1IsHUzv_JEcs-QggMjF3JZzwrTWFvBfdTBrcAjHp30BzOeR2JRjOXdbn8VONbwz87qbwPb6-QQZXrY5nLNQmlCDBpDg6z9EIyM4IAGtIfE-1yN4ixQtmpRpxG-FL_8LGnZ3XoFHDWR4rY3kWZfVGKma-tBeVPyk2NX-qtB91NFHTPAKhDZF4QwCG0M5lMlaohe76s2Vk")'}}
        ></div>
        <div className="absolute inset-0 bg-black/40"></div>
        <div className="absolute inset-0 vignette-overlay pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-black via-black/90 to-transparent"></div>
      </div>

      <div className="relative z-10 flex items-center p-4 justify-between bg-gradient-to-b from-black/80 to-transparent pt-8 h-[10%]">
        <div className="text-white flex size-12 shrink-0 items-center justify-start">
            {canReturn && (
                <button onClick={onReturnToGame} className="flex items-center gap-2 hover:text-gold transition-colors group">
                    <span className="material-symbols-outlined cursor-pointer group-hover:-translate-x-1 transition-transform">arrow_back_ios</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Uyan</span>
                </button>
            )}
        </div>
        <h2 className="text-white text-xl font-bold leading-tight tracking-tight flex-1 text-center italic opacity-80">Kamp Ateşi</h2>
        <div className="flex w-12 items-center justify-end">
          <button className="flex size-10 items-center justify-center rounded-lg bg-white/5 backdrop-blur-sm text-white border border-white/5">
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </button>
        </div>
      </div>

      <div className="flex-grow relative z-10 pointer-events-none"></div>

      <div className="relative z-10 flex flex-col justify-end pb-12 px-6 h-[40%]">
        {!canReturn && (
            <>
                <h2 className="text-gold tracking-wide text-base font-medium leading-tight text-center mb-1 drop-shadow-[0_2px_4px_rgba(0,0,0,1)]">
                    Güneşin doğmasına
                </h2>
                
                <div className="flex gap-2 py-4 max-w-[280px] mx-auto w-full items-end justify-center">
                <div className="flex grow basis-0 flex-col items-center gap-1">
                    <div className="flex h-12 w-14 items-center justify-center rounded bg-black/60 border border-white/10 backdrop-blur-sm shadow-inner">
                    <p className="text-white text-xl font-bold tracking-widest">{timeLeft.h.toString().padStart(2, '0')}</p>
                    </div>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">Saat</p>
                </div>
                <div className="flex items-center pb-4 h-12 text-gold/80 text-lg font-bold">:</div>
                <div className="flex grow basis-0 flex-col items-center gap-1">
                    <div className="flex h-12 w-14 items-center justify-center rounded bg-black/60 border border-white/10 backdrop-blur-sm shadow-inner">
                    <p className="text-white text-xl font-bold tracking-widest">{timeLeft.m.toString().padStart(2, '0')}</p>
                    </div>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">Dakika</p>
                </div>
                <div className="flex items-center pb-4 h-12 text-gold/80 text-lg font-bold">:</div>
                <div className="flex grow basis-0 flex-col items-center gap-1">
                    <div className="flex h-12 w-14 items-center justify-center rounded bg-black/60 border border-white/10 backdrop-blur-sm shadow-inner">
                    <p className="text-white text-xl font-bold tracking-widest">{timeLeft.s.toString().padStart(2, '0')}</p>
                    </div>
                    <p className="text-white/40 text-[9px] uppercase tracking-widest font-semibold">Saniye</p>
                </div>
                </div>

                <div className="flex flex-col items-center gap-4 mt-2">
                    <p className="text-white/60 text-xs italic">Hamle hakkın bitti. Beklemek istemiyor musun?</p>
                    <button 
                        onClick={handleWatchAd}
                        disabled={isAdLoading}
                        className="group relative flex w-full max-w-[300px] items-center justify-center overflow-hidden rounded-full border border-gold/50 h-14 px-6 bg-gradient-to-r from-amber-900 via-gold to-amber-900 text-white gap-3 shadow-[0_0_20px_rgba(207,130,23,0.4)] hover:shadow-[0_0_30px_rgba(207,130,23,0.6)] transition-all active:scale-95"
                    >
                        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay" style={{backgroundImage: 'url("https://www.transparenttextures.com/patterns/carbon-fibre.png")'}}></div>
                        <span className="material-symbols-outlined text-white text-[24px] group-hover:rotate-12 transition-transform">
                            {isAdLoading ? 'sync' : 'play_circle'}
                        </span>
                        <span className="truncate text-sm font-bold uppercase tracking-[0.2em] drop-shadow-md">
                            {isAdLoading ? 'Reklam Hazırlanıyor...' : 'Reklam İzle & Hemen Uyan'}
                        </span>
                    </button>
                    <p className="text-[10px] text-white/30 uppercase tracking-tighter">+10 Hamle Kazan</p>
                </div>
            </>
        )}

        {canReturn && (
            <div className="text-center py-8">
                <button 
                    onClick={onReturnToGame}
                    className="bg-white text-black px-12 py-4 rounded-full font-bold uppercase tracking-widest hover:bg-gold hover:text-white transition-all shadow-2xl animate-bounce"
                >
                    Gözlerini Aç
                </button>
                <p className="mt-4 text-white/60 italic font-light">Yeni bir gün, yeni maceralar...</p>
            </div>
        )}
        
        <div className="mt-8 text-center">
          <p className="text-white/20 text-[10px] italic font-light tracking-widest uppercase">Karanlık orman seni bekliyor.</p>
        </div>
      </div>
    </div>
  );
};

export default CampsitePage;