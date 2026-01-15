import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV } from '../utils/env';

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