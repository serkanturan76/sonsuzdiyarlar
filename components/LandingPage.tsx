import React, { useState } from 'react';
import { signIn, signUp } from '../services/supabase';

interface LandingPageProps {
  onAuthSuccess: (characterName: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [characterName, setCharacterName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        const { data, error: authError } = await signIn(email, password);
        if (authError) throw authError;
        
        // Use the character name provided in the form for the session, 
        // or fall back to metadata if available.
        const metaName = data.user?.user_metadata?.character_name;
        onAuthSuccess(characterName || metaName || 'İsimsiz Gezgin');
      } else {
        if (!characterName) throw new Error("Karakter adı zorunludur.");
        const { data, error: authError } = await signUp(email, password, characterName);
        if (authError) throw authError;
        onAuthSuccess(characterName);
      }
    } catch (err: any) {
      setError(err.message || 'Diyar kapıları şu an mühürlü, bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-background-dark font-display">
      {/* Background with Gothic Image and Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-deep-black via-background-dark/80 to-background-dark/40 z-10"></div>
        <div 
          className="h-full w-full bg-cover bg-center transition-opacity duration-1000"
          style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuCLJquojL0bkBmumIyv4xpw6XFGiEz9iSS48wcxwUmo50jOESXKTjsvhE_YpFiJsouJ8kcqO4rT7-x8a-ybkOtev_lp82z1w1fwIBdU63BBODbeUUUjSaF2pmkraGTShG5jG9wXmlA7Nkk2_yQsuolP34LX0hYV8EKEbTgiLyj5zMchxFAeONwBXkyxt0XqaAFpVC1kkp7hSzT9lz-QSeNNhAMZyra2-jgA3fH5RcxO-Xo8CFbr0XpyJoCxV8coaKXi_WWkCkJAe_M')` }}
        />
      </div>

      <div className="relative z-20 w-full max-w-md px-6 py-8 flex flex-col h-full justify-between min-h-screen">
        {/* Header Section */}
        <div className="flex-1 flex flex-col items-center justify-center pt-12 pb-8 text-center space-y-4">
          <div className="mb-4 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blood-red rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
            <h1 className="relative text-4xl md:text-5xl font-ornate font-bold text-white tracking-wider drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">
              Sonsuz Diyarlar
            </h1>
          </div>
          <p className="text-gray-300 text-sm md:text-base font-light italic leading-relaxed max-w-xs drop-shadow-md">
            Sonsuz diyarlardaki yolculuğun burada başlıyor. Kaderini gölgelerde şekillendir.
          </p>
        </div>

        {/* Auth Module */}
        <div className="w-full backdrop-blur-md bg-black/60 border border-white/10 rounded-2xl shadow-2xl ring-1 ring-white/5 overflow-hidden transition-all duration-500">
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-center font-bold text-sm tracking-wide transition-all ${isLogin ? 'text-white bg-primary/10 border-b-2 border-primary' : 'text-gray-400 border-b-2 border-transparent hover:text-white'}`}
            >
              GİRİŞ YAP
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-center font-bold text-sm tracking-wide transition-all ${!isLogin ? 'text-white bg-primary/10 border-b-2 border-primary' : 'text-gray-400 border-b-2 border-transparent hover:text-white'}`}
            >
              KAYIT OL
            </button>
          </div>

          <div className="p-6">
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">E-POSTA</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 group-focus-within:text-primary transition-colors">mail</span>
                  </div>
                  <input 
                    type="email" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-charcoal/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 sm:text-sm" 
                    placeholder="gezgin@diyar.com" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">KARAKTER ADI</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 group-focus-within:text-primary transition-colors">hiking</span>
                  </div>
                  <input 
                    type="text" 
                    required={!isLogin}
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-charcoal/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 sm:text-sm" 
                    placeholder="Gezginin İsmi" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider ml-1">ŞİFRE</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 group-focus-within:text-primary transition-colors">lock</span>
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg bg-charcoal/50 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200 sm:text-sm" 
                    placeholder="••••••••" 
                  />
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-xs italic text-center animate-pulse">{error}</p>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-bold rounded-lg text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-gray-900 transition-all shadow-[0_0_15px_rgba(127,13,242,0.3)] hover:shadow-[0_0_25px_rgba(127,13,242,0.5)] active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? 'Yollar Hazırlanıyor...' : (isLogin ? 'Yolculuğa Başla' : 'Hükmetmeye Başla')}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-2">
          <p className="text-[10px] text-gray-600 uppercase tracking-widest">Sonsuz Diyarlar v1.1</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;