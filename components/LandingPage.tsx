
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
        const metaName = data.user?.user_metadata?.character_name;
        onAuthSuccess(characterName || metaName || 'İsimsiz Gezgin');
      } else {
        if (!characterName) throw new Error("Karakter adı zorunludur.");
        const { error: authError } = await signUp(email, password, characterName);
        if (authError) throw authError;
        onAuthSuccess(characterName);
      }
    } catch (err: any) {
      setError(err.message || 'Diyar kapıları şu an mühürlü.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-deep-black text-slate-300 font-newsreader selection:bg-primary/30 overflow-y-auto overflow-x-hidden scroll-smooth">
      
      {/* --- HERO SECTION --- */}
      <section className="relative h-screen w-full flex flex-col items-center justify-center text-center px-6 overflow-hidden shrink-0">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-deep-black z-10"></div>
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLJquojL0bkBmumIyv4xpw6XFGiEz9iSS48wcxwUmo50jOESXKTjsvhE_YpFiJsouJ8kcqO4rT7-x8a-ybkOtev_lp82z1w1fwIBdU63BBODbeUUUjSaF2pmkraGTShG5jG9wXmlA7Nkk2_yQsuolP34LX0hYV8EKEbTgiLyj5zMchxFAeONwBXkyxt0XqaAFpVC1kkp7hSzT9lz-QSeNNhAMZyra2-jgA3fH5RcxO-Xo8CFbr0XpyJoCxV8coaKXi_WWkCkJAe_M" 
            alt="Aethelgard" 
            className="w-full h-full object-cover opacity-50 scale-110 animate-pulse-slow blur-[2px]"
          />
        </div>

        <div className="relative z-20 space-y-4 max-w-5xl">
          <h1 className="text-6xl md:text-9xl font-ornate font-bold text-white tracking-[0.15em] drop-shadow-[0_10px_30px_rgba(127,13,242,0.6)]">
            SONSUZ DİYARLAR
          </h1>
          <div className="flex flex-col items-center">
            <p className="text-xl md:text-3xl text-gold font-ornate tracking-[0.3em] uppercase opacity-90 mb-2">
              AETHELGARD
            </p>
            <p className="text-sm md:text-base text-slate-400 font-display italic tracking-[0.4em] uppercase">
              KADİM TOPRAKLARIN GÖLGESİNDE
            </p>
          </div>
          <div className="h-px w-48 bg-gradient-to-r from-transparent via-gold/50 to-transparent mx-auto mt-6"></div>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed pt-8 drop-shadow-md">
            Hayatta kalmanın bir başarı sayıldığı, geçmişin hatalarının bugünü zehirlediği bir yer. 
            Gerçeklik zarı inceliyor... Hazır mısın?
          </p>
          
          <div className="pt-12 flex flex-col md:flex-row gap-6 justify-center">
             <button 
                onClick={() => document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-primary hover:bg-primary/80 text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest transition-all shadow-[0_0_25px_rgba(127,13,242,0.4)] hover:scale-105 active:scale-95"
             >
                Yolculuğa Başla
             </button>
             <button 
                onClick={() => document.getElementById('world-guide')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/5 hover:bg-white/10 border border-white/20 text-white px-12 py-5 rounded-full font-bold uppercase tracking-widest transition-all backdrop-blur-md"
             >
                Dünyayı Keşfet
             </button>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-30 cursor-pointer" onClick={() => document.getElementById('world-guide')?.scrollIntoView({ behavior: 'smooth' })}>
           <span className="material-symbols-outlined text-4xl">keyboard_double_arrow_down</span>
        </div>
      </section>

      {/* --- WORLD GUIDE SECTION --- */}
      <section id="world-guide" className="py-24 px-6 max-w-6xl mx-auto space-y-32">
        <div className="text-center space-y-4">
          <h2 className="text-5xl font-ornate text-white tracking-widest">AETHELGARD: KADİM TOPRAKLAR</h2>
          <div className="h-1 w-24 bg-primary mx-auto"></div>
          <p className="text-slate-500 italic uppercase tracking-[0.3em] text-sm pt-4">Dünya Rehberi</p>
        </div>

        {/* --- INTRO --- */}
        <div className="relative">
          <div className="absolute -left-10 top-0 text-9xl text-white/5 font-ornate pointer-events-none select-none">Intro</div>
          <p className="text-2xl md:text-3xl leading-relaxed text-slate-200 text-center max-w-4xl mx-auto font-light italic">
            "Aethelgard, ihtişamlı bir fantezi dünyası değil; hayatta kalmanın bir başarı sayıldığı, geçmişin hatalarının bugünü zehirlediği bir yerdir."
          </p>
          <div className="mt-12 grid md:grid-cols-2 gap-12 text-lg text-slate-400 leading-relaxed">
            <p>
              500 yıl önce büyü yüzünden medeniyet neredeyse yok oldu. Bugün, "Büyük Çöküş"ün külleri üzerinde kurulan yeni düzen, korku ve çelik üzerine inşa edilmiştir.
            </p>
            <p>
              Kahramanlık nadirdir; açgözlülük ve korku ise boldur. Engizisyon her köşe başında bir cadı avı yürütürken, 
              loncalar altın için birbirinin boğazına çökmüş durumda.
            </p>
          </div>
        </div>

        {/* --- TIMELINE --- */}
        <div className="space-y-16">
           <div className="flex items-center gap-6">
              <h3 className="text-3xl font-ornate text-white shrink-0">1. TARİHÇE</h3>
              <div className="h-px bg-white/10 w-full"></div>
           </div>
           
           <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
              {[
                { y: "Yıl -100", t: "Eski İmparatorluk (The Old Empire)", d: "Büyücü-kralların yönettiği, gökyüzüne değen kristal kulelerin olduğu bir dönemdi. Ancak sınırsız büyü kullanımı, gerçekliğin dokusunu yırttı." },
                { y: "Yıl 0", t: "Büyük Çöküş (The Great Collapse)", d: "Tek bir günde gökyüzü mora döndü ve 'Yırtık' açıldı. Şehirler yerin dibine girdi, insanlar 'Wraith'lere (Hayaletlere) dönüştü." },
                { y: "Yıl 100", t: "Karanlık Yüzyıl", d: "Hayatta kalan insanlar mağaralara ve dağlara kaçtığı dönem. Büyüye olan nefret bu dönemde kök saldı." },
                { y: "Yıl 200", t: "Solaris'in Yükselişi", d: "Kral I. Aethel, 'Demir Kanunları' ilan ederek büyüyü yasakladı ve Engizisyon'u kurdu." },
                { y: "Yıl 500", t: "Şimdiki Zaman (Kıtlık Çağı)", d: "Medeniyet yeniden kuruldu ancak kaynaklar sınırlı. Kraliyet yozlaşmış, Engizisyon ise paranoyak." }
              ].map((item, i) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-700 bg-deep-black text-primary shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-all shadow-xl">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-gold font-ornate uppercase tracking-widest">{item.y}</div>
                    </div>
                    <div className="text-white font-bold mb-2">{item.t}</div>
                    <div className="text-slate-400 text-sm leading-relaxed">{item.d}</div>
                  </div>
                </div>
              ))}
           </div>
        </div>

        {/* --- GEOGRAPHY --- */}
        <div className="space-y-16">
           <div className="flex items-center gap-6">
              <h3 className="text-3xl font-ornate text-white shrink-0">2. COĞRAFYA VE BÖLGELER</h3>
              <div className="h-px bg-white/10 w-full"></div>
           </div>

           <div className="grid md:grid-cols-3 gap-8">
              {/* North */}
              <div className="group bg-deep-black border border-white/5 rounded-2xl overflow-hidden hover:border-blue-500/30 transition-all flex flex-col shadow-2xl">
                 <div className="h-40 bg-gradient-to-br from-slate-900 to-blue-950 relative">
                    <div className="absolute inset-0 bg-blue-900/10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-black to-transparent"></div>
                    <h4 className="absolute bottom-4 left-6 text-2xl font-ornate text-white uppercase">Kuzey</h4>
                 </div>
                 <div className="p-6 space-y-4 flex-1">
                    <h5 className="text-blue-400 font-bold uppercase tracking-widest text-xs">Buzul Dişleri</h5>
                    <p className="text-sm text-slate-400 leading-relaxed italic">"Dünyanın çatısı. Burası zayıfları affetmez."</p>
                    <p className="text-sm text-slate-300">
                      <strong>Demirhisar:</strong> Madenci şehri. Aethelgard'ın çeliği burada dövülür. Halkı serttir.
                    </p>
                    <p className="text-xs text-slate-500 border-t border-white/5 pt-3">
                      <em>Efsane:</em> Donmuş Göl'ün altında devasa bir gölge (Leviathan) hareket eder.
                    </p>
                 </div>
              </div>

              {/* Center */}
              <div className="group bg-deep-black border border-gold/20 rounded-2xl overflow-hidden hover:border-gold/50 transition-all flex flex-col scale-105 shadow-[0_20px_50px_rgba(207,130,23,0.1)] z-10">
                 <div className="h-40 bg-gradient-to-br from-slate-900 to-amber-950 relative">
                    <div className="absolute inset-0 bg-gold/10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-black to-transparent"></div>
                    <h4 className="absolute bottom-4 left-6 text-2xl font-ornate text-white uppercase">Merkez</h4>
                 </div>
                 <div className="p-6 space-y-4 flex-1">
                    <h5 className="text-gold font-bold uppercase tracking-widest text-xs">Altın Ovalar</h5>
                    <p className="text-sm text-slate-400 leading-relaxed italic">"Görünüşte cennet, özünde bir hapishane."</p>
                    <p className="text-sm text-slate-300">
                      <strong>Solaris:</strong> Altın kaplama kulelerin ve Engizisyon'un merkezi. Alt Şehir'de (The Gut) hırsız loncaları hakimdir.
                    </p>
                    <p className="text-xs text-slate-500 border-t border-white/5 pt-3">
                      <em>Durum:</em> Kraliyet zayıf, asıl güç loncalar ve Engizisyon'da.
                    </p>
                 </div>
              </div>

              {/* South */}
              <div className="group bg-deep-black border border-white/5 rounded-2xl overflow-hidden hover:border-red-500/30 transition-all flex flex-col shadow-2xl">
                 <div className="h-40 bg-gradient-to-br from-slate-900 to-red-950 relative">
                    <div className="absolute inset-0 bg-red-900/10"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-deep-black to-transparent"></div>
                    <h4 className="absolute bottom-4 left-6 text-2xl font-ornate text-white uppercase">Güney</h4>
                 </div>
                 <div className="p-6 space-y-4 flex-1">
                    <h5 className="text-red-400 font-bold uppercase tracking-widest text-xs">Köz Bataklıkları</h5>
                    <p className="text-sm text-slate-400 leading-relaxed italic">"Eski günahların mezarlığı."</p>
                    <p className="text-sm text-slate-300">
                      <strong>Kül Harabeleri:</strong> Çamura batan eski metropol. Tehlikeli eserler ve Wraith'lerle dolu kanunsuz bir bölge.
                    </p>
                    <p className="text-xs text-slate-500 border-t border-white/5 pt-3">
                      <em>Tehlike:</em> Çamur İzcileri pusu kurar, geceleri hayaletler gezer.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* --- RULES --- */}
        <div className="grid md:grid-cols-2 gap-12">
           <div className="space-y-8 bg-primary/5 p-10 rounded-3xl border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">auto_fix_high</span>
              </div>
              <h3 className="text-3xl font-ornate text-white">3. BÜYÜ VE DELİLİK</h3>
              <p className="text-slate-400 leading-relaxed">
                Büyü bir yetenek değil, bir lanettir. Gerçeklik zarı incedir; büyü yapmak bu zarı yırtarak "Öteki Taraf"ın içeri sızmasına neden olur.
              </p>
              <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded bg-primary/20 flex items-center justify-center text-primary">
                       <span className="material-symbols-outlined text-sm">skull</span>
                    </div>
                    <p className="text-sm text-slate-300"><strong>Bedel:</strong> Damarların siyahlaşması, gözlerden kan gelmesi veya kalıcı delilik.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded bg-red-900/20 flex items-center justify-center text-red-500">
                       <span className="material-symbols-outlined text-sm">shield_person</span>
                    </div>
                    <p className="text-sm text-slate-300"><strong>Engizisyon:</strong> Gümüş maskeli fanatikler. Büyücüleri anında infaz ederler.</p>
                 </div>
              </div>
           </div>

           <div className="space-y-8 bg-gold/5 p-10 rounded-3xl border border-gold/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-symbols-outlined text-8xl">payments</span>
              </div>
              <h3 className="text-3xl font-ornate text-white">4. EKONOMİ VE ESERLER</h3>
              <p className="text-slate-400 leading-relaxed">
                Altın bir anahtardır, ama bazen mezarını kazar. Aethelgard Altını çok değerlidir ve her kapıyı açabilir.
              </p>
              <div className="space-y-4">
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded bg-gold/20 flex items-center justify-center text-gold">
                       <span className="material-symbols-outlined text-sm">potted_plant</span>
                    </div>
                    <p className="text-sm text-slate-300"><strong>Eserler (Relics):</strong> Antik çağlardan kalma objeler. Servet değerindedir ama bulundurmak idam sebebidir.</p>
                 </div>
                 <div className="flex gap-4">
                    <div className="shrink-0 w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-slate-400">
                       <span className="material-symbols-outlined text-sm">sell</span>
                    </div>
                    <p className="text-sm text-slate-300"><strong>Ticaret:</strong> Bir kese altınla bir yıl yaşayabilir ya da o gece öldürülebilirsiniz.</p>
                 </div>
              </div>
           </div>
        </div>

        {/* --- NPCs --- */}
        <div className="space-y-12">
           <h3 className="text-3xl font-ornate text-center text-white">DİYAR SAKİNLERİ</h3>
           <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { n: "Solaris Tüccarı", i: "storefront", d: "Açgözlü, ipek giysili, rüşvetçi." },
                { n: "Demirhisar Madencisi", i: "construction", d: "Sert, kömür karası, batıl inançlı." },
                { n: "Kül Yağmacısı", i: "travel_explore", d: "Güvenilmez, kurnaz, yara izli." },
                { n: "Engizisyon Rahibi", i: "shield_person", d: "Duygusuz, gümüş maskeli, acımasız." }
              ].map((npc, i) => (
                <div key={i} className="text-center space-y-4 p-8 bg-white/5 border border-white/5 rounded-2xl group hover:bg-white/10 transition-all">
                   <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="material-symbols-outlined text-3xl text-primary">{npc.i}</span>
                   </div>
                   <h4 className="text-white font-bold text-sm uppercase tracking-widest">{npc.n}</h4>
                   <p className="text-xs text-slate-500 italic leading-relaxed">{npc.d}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- AUTH SECTION --- */}
      <section id="auth" className="py-32 px-6 bg-gradient-to-t from-primary/10 via-deep-black to-deep-black">
        <div className="max-w-md mx-auto space-y-12">
           <div className="text-center space-y-4">
             <h2 className="text-4xl font-ornate text-white uppercase tracking-widest">Kaderini Mühürle</h2>
             <p className="text-slate-500 italic">Yolculuk Şimdi Başlıyor</p>
           </div>

           <div className="w-full backdrop-blur-2xl bg-white/[0.02] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,1)] overflow-hidden">
             <div className="flex border-b border-white/10">
               <button 
                 onClick={() => setIsLogin(true)}
                 className={`flex-1 py-6 text-center font-bold text-xs tracking-[0.3em] transition-all uppercase ${isLogin ? 'text-white bg-white/5 border-b-2 border-primary' : 'text-gray-600 hover:text-white'}`}
               >
                 Giriş Yap
               </button>
               <button 
                 onClick={() => setIsLogin(false)}
                 className={`flex-1 py-6 text-center font-bold text-xs tracking-[0.3em] transition-all uppercase ${!isLogin ? 'text-white bg-white/5 border-b-2 border-primary' : 'text-gray-600 hover:text-white'}`}
               >
                 Kayıt Ol
               </button>
             </div>

             <div className="p-10">
               <form onSubmit={handleAuth} className="space-y-8">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">E-Posta</label>
                   <input 
                     type="email" 
                     required 
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="block w-full px-5 py-4 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-display text-sm" 
                     placeholder="gezgin@aethelgard.com" 
                   />
                 </div>

                 {!isLogin && (
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">Karakter Adı</label>
                      <input 
                        type="text" 
                        required={!isLogin}
                        value={characterName}
                        onChange={(e) => setCharacterName(e.target.value)}
                        className="block w-full px-5 py-4 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-display text-sm" 
                        placeholder="Örn: Gezgin Kael" 
                      />
                    </div>
                 )}

                 <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em] ml-1">Şifre</label>
                   <input 
                     type="password" 
                     required 
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     className="block w-full px-5 py-4 border border-white/10 rounded-xl bg-black/40 text-white focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-display text-sm" 
                     placeholder="••••••••" 
                   />
                 </div>

                 {error && (
                   <div className="bg-red-950/30 border border-red-500/30 p-4 rounded-xl text-red-400 text-xs text-center italic animate-shake">
                      {error}
                   </div>
                 )}

                 <button 
                   type="submit"
                   disabled={loading}
                   className="w-full flex items-center justify-center px-4 py-5 border border-transparent text-sm font-bold rounded-xl text-white bg-primary hover:bg-primary/90 transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 uppercase tracking-[0.2em]"
                 >
                   {loading ? 'Bağlantı Kuruluyor...' : (isLogin ? 'Mührü Çöz' : 'Adını Arşivlere Yaz')}
                 </button>
               </form>
             </div>
           </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-20 border-t border-white/5 text-center bg-black">
        <div className="mb-8">
            <h2 className="text-2xl font-ornate text-white tracking-[0.2em]">SONSUZ DİYARLAR</h2>
            <p className="text-[9px] text-gray-600 uppercase tracking-[0.5em] mt-2">© 500 Kıtlık Çağı • Tüm Hakları Saklıdır</p>
        </div>
        <div className="flex justify-center gap-10 text-slate-500 text-[10px] uppercase tracking-[0.3em] italic">
           <a href="#" className="hover:text-primary transition-colors">Kader Kitabı</a>
           <a href="#" className="hover:text-primary transition-colors">Topluluk</a>
           <a href="#" className="hover:text-primary transition-colors">Destek</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
