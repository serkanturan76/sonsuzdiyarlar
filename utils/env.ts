// Helper to read environment variables safely
// Supports both Vite (import.meta.env) and standard (process.env)

export const getEnv = (key: string): string => {
  // 1. Try Vite standard (import.meta.env)
  try {
    // @ts-ignore
    if (import.meta && import.meta.env && import.meta.env[key]) {
      // @ts-ignore
      return import.meta.env[key];
    }
  } catch (e) {
    // Ignore error if import.meta is not defined
  }

  // 2. Try standard process.env
  try {
    if (process.env && process.env[key]) {
      return process.env[key];
    }
  } catch (e) {
    // Ignore
  }

  return "";
};

// Define keys mapping
export const ENV = {
  GEMINI_API_KEY: getEnv('VITE_GEMINI_API_KEY') || getEnv('REACT_APP_GEMINI_API_KEY') || getEnv('API_KEY'),
  SUPABASE_URL: getEnv('VITE_SUPABASE_URL') || getEnv('REACT_APP_SUPABASE_URL'),
  SUPABASE_KEY: getEnv('VITE_SUPABASE_ANON_KEY') || getEnv('REACT_APP_SUPABASE_KEY'),
};