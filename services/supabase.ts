import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../utils/env';

// Only create client if credentials exist in Environment Variables
const supabase: SupabaseClient | null = (ENV.SUPABASE_URL && ENV.SUPABASE_KEY) 
  ? createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY) 
  : null;

export const fetchWorldLore = async (): Promise<string | null> => {
  if (!supabase) {
    console.warn("Supabase credentials missing. Using local fallback for World Lore.");
    return null;
  }
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
    console.warn("Supabase Lore Fetch Error (Using fallback):", error);
    return null;
  }
};

export const fetchArchives = async (): Promise<string> => {
  if (!supabase) {
     console.warn("Supabase credentials missing. Using local fallback for Archives.");
     return "";
  }
  try {
    const { data, error } = await supabase
      .from('game_logs')
      .select('player_name, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    if (!data || data.length === 0) return "Henüz kaydedilmiş bir tarihçe yok.";

    return data.map((log: any) => `
[KAYIT - ${new Date(log.created_at).toLocaleDateString()}]
Oyuncu: ${log.player_name || 'Bilinmeyen Gezgin'}
Özet: ${log.summary}
    `).join('\n');
  } catch (error) {
    console.warn("Supabase Archive Fetch Error:", error);
    return "";
  }
};

export const saveGameLog = async (playerName: string, summary: string) => {
  if (!supabase) {
    console.warn("Cannot save log: Supabase not configured.");
    alert("Supabase bağlantısı olmadığı için kayıt yapılamadı (Demo modundasınız).");
    return;
  }
  const { error } = await supabase
    .from('game_logs')
    .insert([{ player_name: playerName, summary: summary }]);
  
  if (error) throw error;
};