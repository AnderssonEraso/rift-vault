import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  GeminiModelId,
  AIContextConfig,
  AIMessage,
  AIValidationResult,
  AIModelItem,
  DEFAULT_AI_MODELS,
} from '@/types/ai';
import {
  validateGeminiApiKey,
  buildRiftDexSystemContext,
  generateGeminiContent,
} from '@/services/geminiService';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';
import { useProfile } from './ProfileContext';
import { useDecks } from './DeckContext';
import { useCollection } from './CollectionContext';
import { Deck } from '@/types/deck';

const STORAGE_KEY_API_KEY = 'rift_gemini_api_key';
const STORAGE_KEY_MODEL = 'rift_gemini_model';
const STORAGE_KEY_CONFIG = 'rift_gemini_context_config';
const STORAGE_KEY_MODELS_TABLE = 'rift_gemini_models_table';

const DEFAULT_CONFIG: AIContextConfig = {
  includeProfile: true,
  includeDecks: true,
  includeCollection: true,
  includeGameRules: true,
  customInstructions: '',
  temperature: 0.7,
};

interface AIContextType {
  apiKey: string | null;
  isConfigured: boolean;
  isValidating: boolean;
  activeModel: GeminiModelId;
  activeModelItem: AIModelItem;
  modelsTable: AIModelItem[];
  visibleModels: AIModelItem[];
  contextConfig: AIContextConfig;
  messages: AIMessage[];
  isGenerating: boolean;
  lastError: string | null;
  saveApiKey: (key: string) => Promise<AIValidationResult>;
  removeApiKey: () => Promise<void>;
  changeModel: (modelId: string) => Promise<void>;
  toggleModelActive: (id: string, isActive: boolean) => Promise<void>;
  toggleModelVisible: (id: string, isVisible: boolean) => Promise<void>;
  setDefaultModel: (id: string) => Promise<void>;
  addCustomModel: (model: {
    name: string;
    endpointUrl: string;
    description?: string;
    isVisible?: boolean;
    isActive?: boolean;
  }) => Promise<void>;
  deleteCustomModel: (id: string) => Promise<void>;
  resetModelsToDefault: () => Promise<void>;
  updateContextConfig: (updates: Partial<AIContextConfig>) => Promise<void>;
  askOracle: (prompt: string, currentDeckFocus?: Deck) => Promise<string>;
  clearChat: () => void;
  getPreviewContext: (currentDeckFocus?: Deck) => string;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useProfile();
  const { decks } = useDecks();
  const { allCollectionItems } = useCollection();

  const [apiKey, setApiKey] = useState<string | null>(null);
  const [modelsTable, setModelsTable] = useState<AIModelItem[]>(DEFAULT_AI_MODELS);
  const [activeModel, setActiveModel] = useState<GeminiModelId>('gemini-3.5-flash-lite');
  const [contextConfig, setContextConfig] = useState<AIContextConfig>(DEFAULT_CONFIG);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Saludos, invocador! Soy el Oráculo del Nexo impulsado por Google AI Studio. Puedo analizar tus mazos, calcular probabilidades de robo, evaluar sinergias con tu leyenda o resolver cualquier duda táctica. ¿Qué deseas consultar hoy?',
      timestamp: Date.now(),
    },
  ]);

  // Modelos que tienen isVisible activado (los que el usuario común puede ver para activar/elegir)
  const visibleModels = useMemo(() => {
    return modelsTable.filter(m => m.isVisible !== false);
  }, [modelsTable]);

  // Modelo activo resuelto: busca el seleccionado si está activo; o el default si está activo; o el primer activo
  const activeModelItem: AIModelItem = useMemo(() => {
    const found = modelsTable.find(m => (m.id === activeModel || m.modelId === activeModel) && m.isActive);
    if (found) return found;

    const defaultModel = modelsTable.find(m => m.isDefault && m.isActive);
    if (defaultModel) return defaultModel;

    const firstActiveVisible = modelsTable.find(m => m.isActive && m.isVisible);
    if (firstActiveVisible) return firstActiveVisible;

    const firstActive = modelsTable.find(m => m.isActive);
    if (firstActive) return firstActive;

    return DEFAULT_AI_MODELS[0];
  }, [modelsTable, activeModel]);

  // Cargar credenciales, tabla de modelos y configuración guardadas
  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const [savedKey, savedModel, savedConfig, savedModelsTable] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_API_KEY),
          AsyncStorage.getItem(STORAGE_KEY_MODEL),
          AsyncStorage.getItem(STORAGE_KEY_CONFIG),
          AsyncStorage.getItem(STORAGE_KEY_MODELS_TABLE),
        ]);

        let loadedModels: AIModelItem[] = DEFAULT_AI_MODELS;

        // Intentar sincronizar desde Supabase si está disponible
        if (isSupabaseConfigured()) {
          try {
            const { data, error } = await supabase
              .from('ai_models')
              .select('*')
              .order('sort_order', { ascending: true });

            if (!error && data && data.length > 0) {
              loadedModels = data.map((r: any) => ({
                id: r.id,
                name: r.name,
                modelId: r.model_id,
                endpointUrl: r.endpoint_url,
                isActive: r.is_active,
                isVisible: r.is_visible !== false,
                isDefault: r.is_default,
                description: r.description,
                sortOrder: r.sort_order,
              }));
            } else if (savedModelsTable) {
              loadedModels = JSON.parse(savedModelsTable);
            }
          } catch (e) {
            console.warn('No se pudo sincronizar ai_models de Supabase, usando local:', e);
            if (savedModelsTable) {
              loadedModels = JSON.parse(savedModelsTable);
            }
          }
        } else if (savedModelsTable) {
          try {
            loadedModels = JSON.parse(savedModelsTable);
          } catch (e) {
            console.warn('Error al parsear modelsTable de AsyncStorage:', e);
          }
        }

        if (isMounted) {
          setModelsTable(loadedModels);
          if (savedKey) setApiKey(savedKey);

          // Si hay modelo guardado y existe en la lista y está activo, usarlo
          if (savedModel && loadedModels.some(m => m.id === savedModel && m.isActive)) {
            setActiveModel(savedModel);
          } else {
            const defaultModel = loadedModels.find(m => m.isDefault && m.isActive) || loadedModels.find(m => m.isActive) || loadedModels[0];
            setActiveModel(defaultModel?.id || 'gemini-3.5-flash-lite');
          }

          if (savedConfig) {
            try {
              setContextConfig(JSON.parse(savedConfig));
            } catch (e) {
              console.warn('Error al parsear config de IA:', e);
            }
          }
        }
      } catch (err) {
        console.warn('⚠️ Error al cargar credenciales de IA de AsyncStorage:', err);
      }
    };

    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveApiKey = async (key: string): Promise<AIValidationResult> => {
    setIsValidating(true);
    setLastError(null);

    const validation = await validateGeminiApiKey(key, activeModelItem.endpointUrl);

    if (validation.isValid) {
      const clean = key.trim();
      setApiKey(clean);
      await AsyncStorage.setItem(STORAGE_KEY_API_KEY, clean);
    } else {
      setLastError(validation.error || 'La clave no pudo ser validada.');
    }

    setIsValidating(false);
    return validation;
  };

  const removeApiKey = async () => {
    setApiKey(null);
    setLastError(null);
    await AsyncStorage.removeItem(STORAGE_KEY_API_KEY);
  };

  const changeModel = async (modelId: string) => {
    setActiveModel(modelId);
    await AsyncStorage.setItem(STORAGE_KEY_MODEL, modelId);
  };

  const toggleModelActive = async (id: string, isActive: boolean) => {
    const updated = modelsTable.map(m => (m.id === id ? { ...m, isActive } : m));
    setModelsTable(updated);
    await AsyncStorage.setItem(STORAGE_KEY_MODELS_TABLE, JSON.stringify(updated));

    // Si desactivó el modelo que estaba en uso, seleccionar otro que sí esté activo
    if (!isActive && activeModel === id) {
      const nextActive = updated.find(m => m.isActive && m.id !== id);
      if (nextActive) {
        await changeModel(nextActive.id);
      }
    }

    // Si Supabase está disponible, sincronizar
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ai_models').update({ is_active: isActive }).eq('id', id);
      } catch (e) {
        console.warn('Error al actualizar estado en Supabase:', e);
      }
    }
  };

  const toggleModelVisible = async (id: string, isVisible: boolean) => {
    const updated = modelsTable.map(m => (m.id === id ? { ...m, isVisible } : m));
    setModelsTable(updated);
    await AsyncStorage.setItem(STORAGE_KEY_MODELS_TABLE, JSON.stringify(updated));

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ai_models').update({ is_visible: isVisible }).eq('id', id);
      } catch (e) {
        console.warn('Error al actualizar visibilidad en Supabase:', e);
      }
    }
  };

  const setDefaultModel = async (id: string) => {
    const updated = modelsTable.map(m => ({
      ...m,
      isDefault: m.id === id,
      isActive: m.id === id ? true : m.isActive,
      isVisible: m.id === id ? true : m.isVisible,
    }));
    setModelsTable(updated);
    await AsyncStorage.setItem(STORAGE_KEY_MODELS_TABLE, JSON.stringify(updated));
    await changeModel(id);

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ai_models').update({ is_default: false }).neq('id', id);
        await supabase.from('ai_models').update({ is_default: true, is_active: true, is_visible: true }).eq('id', id);
      } catch (e) {
        console.warn('Error al actualizar modelo por defecto en Supabase:', e);
      }
    }
  };

  const addCustomModel = async (model: {
    name: string;
    endpointUrl: string;
    description?: string;
    isVisible?: boolean;
    isActive?: boolean;
  }) => {
    const rawId = model.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
    const newId = `custom-${rawId}-${Date.now().toString().slice(-4)}`;
    const modelId = model.endpointUrl.split('/').pop()?.replace(':generateContent', '') || newId;

    const newModelItem: AIModelItem = {
      id: newId,
      name: model.name.trim(),
      modelId,
      endpointUrl: model.endpointUrl.trim(),
      isActive: model.isActive !== false,
      isVisible: model.isVisible !== false,
      isDefault: false,
      description: model.description?.trim() || 'Modelo personalizado agregado por el invocador',
      sortOrder: modelsTable.length + 1,
    };

    const updated = [...modelsTable, newModelItem];
    setModelsTable(updated);
    await AsyncStorage.setItem(STORAGE_KEY_MODELS_TABLE, JSON.stringify(updated));
    if (newModelItem.isActive) {
      await changeModel(newId);
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ai_models').insert({
          id: newModelItem.id,
          name: newModelItem.name,
          model_id: newModelItem.modelId,
          endpoint_url: newModelItem.endpointUrl,
          is_active: newModelItem.isActive,
          is_visible: newModelItem.isVisible,
          is_default: false,
          description: newModelItem.description,
          sort_order: newModelItem.sortOrder,
        });
      } catch (e) {
        console.warn('Error al guardar modelo en Supabase:', e);
      }
    }
  };

  const deleteCustomModel = async (id: string) => {
    const updated = modelsTable.filter(m => m.id !== id);
    setModelsTable(updated);
    await AsyncStorage.setItem(STORAGE_KEY_MODELS_TABLE, JSON.stringify(updated));

    if (activeModel === id) {
      const next = updated.find(m => m.isActive) || updated[0];
      if (next) {
        await changeModel(next.id);
      }
    }

    if (isSupabaseConfigured()) {
      try {
        await supabase.from('ai_models').delete().eq('id', id);
      } catch (e) {
        console.warn('Error al eliminar modelo de Supabase:', e);
      }
    }
  };

  const resetModelsToDefault = async () => {
    setModelsTable(DEFAULT_AI_MODELS);
    await AsyncStorage.setItem(STORAGE_KEY_MODELS_TABLE, JSON.stringify(DEFAULT_AI_MODELS));
    await changeModel('gemini-3.5-flash-lite');
  };

  const updateContextConfig = async (updates: Partial<AIContextConfig>) => {
    const updated = { ...contextConfig, ...updates };
    setContextConfig(updated);
    await AsyncStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
  };

  const getPreviewContext = useCallback(
    (currentDeckFocus?: Deck): string => {
      return buildRiftDexSystemContext({
        profile,
        decks,
        collectionItems: allCollectionItems,
        contextConfig,
        currentDeckFocus,
      });
    },
    [profile, decks, allCollectionItems, contextConfig]
  );

  const askOracle = async (prompt: string, currentDeckFocus?: Deck): Promise<string> => {
    if (!apiKey) {
      const err = 'No has configurado tu API Key de Google AI Studio. Configúrala en la pestaña IA de tu Perfil.';
      setLastError(err);
      throw new Error(err);
    }

    setIsGenerating(true);
    setLastError(null);

    const userMessage: AIMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      text: prompt,
      timestamp: Date.now(),
      deckAttached: currentDeckFocus
        ? { id: currentDeckFocus.id, name: currentDeckFocus.name }
        : undefined,
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const systemContext = getPreviewContext(currentDeckFocus);

      // Fallbacks: otros modelos que estén marcados como activos
      const fallbackEndpoints = modelsTable
        .filter(m => m.isActive && m.id !== activeModelItem.id)
        .map(m => m.endpointUrl);

      const generatedText = await generateGeminiContent({
        apiKey,
        model: activeModelItem.modelId,
        endpointUrl: activeModelItem.endpointUrl,
        fallbackEndpoints,
        systemInstruction: systemContext,
        prompt,
        history: messages,
        temperature: contextConfig.temperature,
      });

      const modelMessage: AIMessage = {
        id: `mod_${Date.now()}`,
        role: 'model',
        text: generatedText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, modelMessage]);
      setIsGenerating(false);
      return generatedText;
    } catch (err: any) {
      const errorMsg = err?.message || 'Error al comunicarse con el Oráculo de Google.';
      setLastError(errorMsg);
      setIsGenerating(false);

      const errorNoticeMessage: AIMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `⚠️ **Error del Nexo:** ${errorMsg}\n\nVerifica tu clave de Google AI Studio en el Perfil o prueba nuevamente en unos momentos.`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorNoticeMessage]);

      throw err;
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome_reset',
        role: 'model',
        text: 'He reiniciado nuestra sesión táctica. ¿Qué nueva consulta tienes para el Oráculo?',
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <AIContext.Provider
      value={{
        apiKey,
        isConfigured: Boolean(apiKey && apiKey.length > 5),
        isValidating,
        activeModel,
        activeModelItem,
        modelsTable,
        visibleModels,
        contextConfig,
        messages,
        isGenerating,
        lastError,
        saveApiKey,
        removeApiKey,
        changeModel,
        toggleModelActive,
        toggleModelVisible,
        setDefaultModel,
        addCustomModel,
        deleteCustomModel,
        resetModelsToDefault,
        updateContextConfig,
        askOracle,
        clearChat,
        getPreviewContext,
      }}
    >
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI debe ser usado dentro de un AIProvider');
  }
  return context;
};
