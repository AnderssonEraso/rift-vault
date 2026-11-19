import { RiftCard } from './card';
import { Deck } from './deck';
import { UserProfile } from './profile';

export type GeminiModelId = string;

export interface AIModelItem {
  id: string;
  name: string;
  modelId: string;
  endpointUrl: string;
  isActive: boolean;
  isVisible: boolean;
  isDefault?: boolean;
  description?: string;
  sortOrder?: number;
}

export const DEFAULT_AI_MODELS: AIModelItem[] = [
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    modelId: 'gemini-3.5-flash-lite',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent',
    isActive: true,
    isVisible: true,
    isDefault: true,
    description: 'Modelo ultra rápido y ligero configurado por defecto',
    sortOrder: 1,
  },
  {
    id: 'gemini-flash-latest',
    name: 'Gemini Flash (Latest)',
    modelId: 'gemini-flash-latest',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
    isActive: false,
    isVisible: false,
    isDefault: false,
    description: 'Modelo estándar oficial de Google AI Studio',
    sortOrder: 2,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    modelId: 'gemini-1.5-flash',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    isActive: false,
    isVisible: false,
    isDefault: false,
    description: 'Versión estable 1.5 para análisis táctico',
    sortOrder: 3,
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    modelId: 'gemini-2.0-flash',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    isActive: false,
    isVisible: false,
    isDefault: false,
    description: 'Arquitectura 2.0 de última generación',
    sortOrder: 4,
  },
  {
    id: 'gemini-2.0-flash-lite',
    name: 'Gemini 2.0 Flash Lite',
    modelId: 'gemini-2.0-flash-lite',
    endpointUrl: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
    isActive: false,
    isVisible: false,
    isDefault: false,
    description: 'Versión ligera oficial 2.0',
    sortOrder: 5,
  },
];

export interface GeminiModelInfo {
  id: string;
  name: string;
  tagline: string;
  description: string;
  isRecommended?: boolean;
  speed: 'Ultra Rápido' | 'Rápido' | 'Estándar';
  intelligence: 'Alto' | 'Avanzado' | 'Máximo';
}

export const AVAILABLE_GEMINI_MODELS: GeminiModelInfo[] = DEFAULT_AI_MODELS.map(m => ({
  id: m.id,
  name: m.name,
  tagline: m.description || '',
  description: m.description || '',
  isRecommended: m.isDefault,
  speed: 'Ultra Rápido',
  intelligence: 'Avanzado',
}));

export interface AIContextConfig {
  includeProfile: boolean;
  includeDecks: boolean;
  includeCollection: boolean;
  includeGameRules: boolean;
  customInstructions?: string;
  temperature: number;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  deckAttached?: {
    id: string;
    name: string;
  };
}

export interface AIValidationResult {
  isValid: boolean;
  modelUsed?: string;
  error?: string;
}

export interface DeckAiAnalysisRequest {
  deck: Deck;
  question?: string;
}
