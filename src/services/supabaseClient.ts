import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Comprueba si las variables de entorno de Supabase fueron configuradas
 * con valores válidos (no los placeholders por defecto).
 */
export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(supabaseUrl) &&
    Boolean(supabaseAnonKey) &&
    !supabaseUrl.includes('TU_PROYECTO') &&
    supabaseUrl.startsWith('https://')
  );
};

// Adaptador de almacenamiento seguro para SSR en Expo Router (evita ReferenceError: window is not defined en Node.js)
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

const authStorage = {
  getItem: (key: string) => {
    if (isServer) {
      return Promise.resolve(null);
    }
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (isServer) {
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (isServer) {
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

// Cliente Supabase oficial con persistencia automática de sesión
export const supabase: SupabaseClient = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: authStorage,
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      detectSessionInUrl: false,
    },
  })
  : createClient('https://placeholder-domain.supabase.co', 'placeholder-anon-key', {
    auth: {
      storage: authStorage,
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

console.info('⚡ Supabase conectado exitosamente a:', supabaseUrl);
