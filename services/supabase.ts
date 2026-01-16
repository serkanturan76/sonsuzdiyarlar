import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../utils/env';
import { UserLimit } from '../types';

// Only create client if credentials exist in Environment Variables
export const supabase: SupabaseClient | null = (ENV.SUPABASE_URL && ENV.SUPABASE_KEY) 
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY) 
  : null;

export const fetchWorldLore = async (): Promise<string | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('world_lore')
      .select('content')
      .order('id', { ascending: false })
      .limit(1)
      .single();
    if (error) throw error;
    return data?.content || null;
  } catch (error) {
    return null;
  }
};

export const fetchArchives = async (): Promise<string> => {
  if (!supabase) return "";
  try {
    const { data, error } = await supabase
      .from('game_logs')
      .select('player_name, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return data?.map((log: any) => `[${new Date(log.created_at).toLocaleDateString()}] ${log.player_name}: ${log.summary}`).join('\n') || "";
  } catch (error) {
    return "";
  }
};

export const fetchLastLogForPlayer = async (playerName: string): Promise<string | null> => {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('game_logs')
      .select('summary')
      .eq('player_name', playerName)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return data?.summary || null;
  } catch (error) {
    return null;
  }
};

export const saveGameLog = async (playerName: string, summary: string) => {
  if (!supabase) return;
  await supabase.from('game_logs').insert([{ player_name: playerName, summary: summary }]);
};

// --- AUTH METHODS ---
export const signUp = (email: string, pass: string, characterName: string) => 
  supabase?.auth.signUp({ 
    email, 
    password: pass,
    options: {
      data: { character_name: characterName }
    }
  });

export const signIn = (email: string, pass: string) => supabase?.auth.signInWithPassword({ email, password: pass });
export const signOut = () => supabase?.auth.signOut();
export const getUser = () => supabase?.auth.getUser();

// --- LIMIT TRACKING METHODS ---

export const getUserLimits = async (userId: string): Promise<UserLimit> => {
  // Varsayılan değerler (Supabase yoksa veya hata olursa)
  const defaultLimit = { request_count: 10, last_reset_at: new Date().toISOString() };
  if (!supabase) return defaultLimit;

  try {
    const { data, error } = await supabase
      .from('user_limits')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle(); // single yerine maybeSingle kullanıyoruz, kayıt yoksa null döner, hata fırlatmaz.

    const now = new Date();

    // 1. DURUM: Kayıt hiç yoksa (SQL Trigger çalışmadıysa veya eski kullanıcıysa) oluştur.
    if (!data) {
      const newLimitPayload = { 
        user_id: userId, 
        request_count: 10, 
        last_reset_at: now.toISOString() 
      };
      const { error: insertError } = await supabase.from('user_limits').insert(newLimitPayload);
      if (insertError) console.error("Limit oluşturma hatası:", insertError);
      return { request_count: 10, last_reset_at: now.toISOString() };
    }

    // 2. DURUM: Kayıt var, süreyi kontrol et.
    const lastReset = new Date(data.last_reset_at);
    const diffTime = Math.abs(now.getTime() - lastReset.getTime());
    const diffHours = diffTime / (1000 * 60 * 60);

    if (diffHours >= 24) {
      // 24 saat geçmiş, hakları yenile
      const refreshedLimit = { request_count: 10, last_reset_at: now.toISOString() };
      await supabase
        .from('user_limits')
        .update(refreshedLimit)
        .eq('user_id', userId);
      return refreshedLimit;
    }

    // 24 saat geçmemiş, mevcut durumu döndür
    return { 
      request_count: data.request_count, 
      last_reset_at: data.last_reset_at 
    };

  } catch (e) {
    console.error("Supabase Limit Error:", e);
    return defaultLimit;
  }
};

export const decrementUserLimit = async (userId: string): Promise<number> => {
  if (!supabase) return 10;
  
  try {
    // Önce güncel limiti al (transaction benzeri bir işlem için stored procedure daha iyi olurdu ama basit tutuyoruz)
    const { data } = await supabase
      .from('user_limits')
      .select('request_count')
      .eq('user_id', userId)
      .single();
      
    if (data && data.request_count > 0) {
      const newCount = data.request_count - 1;
      await supabase.from('user_limits').update({ request_count: newCount }).eq('user_id', userId);
      return newCount;
    }
    return 0;
  } catch (e) {
    console.error("Decrement Error:", e);
    return 0;
  }
};