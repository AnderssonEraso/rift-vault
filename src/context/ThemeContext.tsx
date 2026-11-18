import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type FactionThemeKey = 'default' | 'fury' | 'calm' | 'mind' | 'body' | 'chaos' | 'order';
export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  // Paleta principal
  primary: string;
  primaryHover: string;
  accent: string;
  glow: string;
  glowSubtle: string;

  // Fondos y superficies
  background: string;
  backgroundElevated: string;
  card: string;
  cardHighlight: string;
  cardBorder: string;
  cardBorderHighlight: string;

  // Tipografía
  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  // Componentes específicos
  tabBarBackground: string;
  tabBarBorder: string;
  activeTabGlow: string;
  headerBackground: string;
  inputBackground: string;
  inputBorder: string;
  success: string;
  danger: string;
  warning: string;
}

export interface FactionMetadata {
  key: FactionThemeKey;
  name: string;
  subtitle: string;
  primaryColor: string;
  accentColor: string;
  iconName: string;
}

const STORAGE_KEY = '@riftdex_theme_settings_v1';
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const FACTIONS_METADATA: FactionMetadata[] = [
  {
    key: 'default',
    name: 'Nexo Astral',
    subtitle: 'Equilibrio estelar clásico',
    primaryColor: '#3B82F6',
    accentColor: '#0AC8B9',
    iconName: 'planet-outline',
  },
  {
    key: 'fury',
    name: 'Furia (Fury)',
    subtitle: 'Rojos volcánicos y fuego ardiente',
    primaryColor: '#EF4444',
    accentColor: '#F97316',
    iconName: 'flame-outline',
  },
  {
    key: 'calm',
    name: 'Calma (Calm)',
    subtitle: 'Esmeralda mística y turquesa marina',
    primaryColor: '#10B981',
    accentColor: '#06B6D4',
    iconName: 'water-outline',
  },
  {
    key: 'mind',
    name: 'Mente (Mind)',
    subtitle: 'Azules arcanos y cian eléctrico',
    primaryColor: '#2563EB',
    accentColor: '#00F0FF',
    iconName: 'flash-outline',
  },
  {
    key: 'body',
    name: 'Cuerpo (Body)',
    subtitle: 'Ámbar, terracota y tonos tierra',
    primaryColor: '#F59E0B',
    accentColor: '#D97706',
    iconName: 'shield-outline',
  },
  {
    key: 'chaos',
    name: 'Caos (Chaos)',
    subtitle: 'Púrpura neón y magenta abisal',
    primaryColor: '#A855F7',
    accentColor: '#EC4899',
    iconName: 'nuclear-outline',
  },
  {
    key: 'order',
    name: 'Orden (Order)',
    subtitle: 'Dorado imperial y azul marino noble',
    primaryColor: '#FBBF24',
    accentColor: '#E2E8F0',
    iconName: 'diamond-outline',
  },
];

// Generador de paletas basadas en la facción y el modo
export function createThemeColors(faction: FactionThemeKey, mode: ThemeMode): ThemeColors {
  const isDark = mode === 'dark';

  // Paletas de acento por facción
  const factionPalettes: Record<
    FactionThemeKey,
    { primary: string; hover: string; accent: string; glow: string; subtleGlow: string; darkTint: string; lightTint: string }
  > = {
    default: {
      primary: '#3B82F6',
      hover: '#60A5FA',
      accent: '#0AC8B9',
      glow: 'rgba(59, 130, 246, 0.35)',
      subtleGlow: 'rgba(10, 200, 185, 0.15)',
      darkTint: '#0B0E14',
      lightTint: '#F1F5F9',
    },
    fury: {
      primary: '#EF4444',
      hover: '#F87171',
      accent: '#F97316',
      glow: 'rgba(239, 68, 68, 0.35)',
      subtleGlow: 'rgba(249, 115, 22, 0.15)',
      darkTint: '#160909',
      lightTint: '#FEF2F2',
    },
    calm: {
      primary: '#10B981',
      hover: '#34D399',
      accent: '#06B6D4',
      glow: 'rgba(16, 185, 129, 0.35)',
      subtleGlow: 'rgba(6, 182, 212, 0.15)',
      darkTint: '#071612',
      lightTint: '#ECFDF5',
    },
    mind: {
      primary: '#3B82F6',
      hover: '#60A5FA',
      accent: '#00F0FF',
      glow: 'rgba(0, 240, 255, 0.35)',
      subtleGlow: 'rgba(59, 130, 246, 0.15)',
      darkTint: '#07121E',
      lightTint: '#F0F9FF',
    },
    body: {
      primary: '#F59E0B',
      hover: '#FBBF24',
      accent: '#D97706',
      glow: 'rgba(245, 158, 11, 0.35)',
      subtleGlow: 'rgba(217, 119, 6, 0.15)',
      darkTint: '#171107',
      lightTint: '#FFFBEB',
    },
    chaos: {
      primary: '#A855F7',
      hover: '#C084FC',
      accent: '#EC4899',
      glow: 'rgba(168, 85, 247, 0.35)',
      subtleGlow: 'rgba(236, 72, 153, 0.15)',
      darkTint: '#14081E',
      lightTint: '#FAF5FF',
    },
    order: {
      primary: '#FBBF24',
      hover: '#FDE047',
      accent: '#94A3B8',
      glow: 'rgba(251, 191, 36, 0.35)',
      subtleGlow: 'rgba(226, 232, 240, 0.15)',
      darkTint: '#0A0F1A',
      lightTint: '#FEFCE8',
    },
  };

  const current = factionPalettes[faction] || factionPalettes.default;

  if (isDark) {
    return {
      primary: current.primary,
      primaryHover: current.hover,
      accent: current.accent,
      glow: current.glow,
      glowSubtle: current.subtleGlow,

      background: current.darkTint,
      backgroundElevated: '#101622',
      card: '#151D2C',
      cardHighlight: '#1E293B',
      cardBorder: '#233047',
      cardBorderHighlight: current.primary,

      textPrimary: '#F8FAFC',
      textSecondary: '#94A3B8',
      textMuted: '#64748B',

      tabBarBackground: '#090D14',
      tabBarBorder: '#1A2333',
      activeTabGlow: current.primary,
      headerBackground: '#090D14',
      inputBackground: '#0F172A',
      inputBorder: '#334155',

      success: '#10B981',
      danger: '#EF4444',
      warning: '#F59E0B',
    };
  } else {
    // Light Mode
    return {
      primary: current.primary,
      primaryHover: current.hover,
      accent: current.accent,
      glow: current.glow,
      glowSubtle: current.subtleGlow,

      background: current.lightTint,
      backgroundElevated: '#FFFFFF',
      card: '#FFFFFF',
      cardHighlight: '#F1F5F9',
      cardBorder: '#E2E8F0',
      cardBorderHighlight: current.primary,

      textPrimary: '#0F172A',
      textSecondary: '#475569',
      textMuted: '#94A3B8',

      tabBarBackground: '#FFFFFF',
      tabBarBorder: '#E2E8F0',
      activeTabGlow: current.primary,
      headerBackground: '#FFFFFF',
      inputBackground: '#F8FAFC',
      inputBorder: '#CBD5E1',

      success: '#059669',
      danger: '#DC2626',
      warning: '#D97706',
    };
  }
}

interface ThemeContextType {
  faction: FactionThemeKey;
  mode: ThemeMode;
  theme: ThemeColors;
  setFaction: (faction: FactionThemeKey) => void;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  factionsList: FactionMetadata[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [faction, setFactionState] = useState<FactionThemeKey>('default');
  const [mode, setModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isServer) {
      setIsLoaded(true);
      return;
    }

    const loadSettings = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.faction) setFactionState(parsed.faction);
          if (parsed.mode) setModeState(parsed.mode);
        }
      } catch (e) {
        console.warn('⚠️ Error cargando configuración de tema:', e);
      } finally {
        setIsLoaded(true);
      }
    };

    loadSettings();
  }, []);

  const persistSettings = async (newFaction: FactionThemeKey, newMode: ThemeMode) => {
    if (isServer) return;
    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ faction: newFaction, mode: newMode })
      );
    } catch (e) {
      console.warn('⚠️ Error guardando tema:', e);
    }
  };

  const setFaction = (newFaction: FactionThemeKey) => {
    setFactionState(newFaction);
    persistSettings(newFaction, mode);
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    persistSettings(faction, newMode);
  };

  const toggleMode = () => {
    const nextMode: ThemeMode = mode === 'dark' ? 'light' : 'dark';
    setModeState(nextMode);
    persistSettings(faction, nextMode);
  };

  const theme = createThemeColors(faction, mode);

  return (
    <ThemeContext.Provider
      value={{
        faction,
        mode,
        theme,
        setFaction,
        setMode,
        toggleMode,
        factionsList: FACTIONS_METADATA,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
