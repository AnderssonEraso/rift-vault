import React, { createContext, useContext, useEffect, useState } from 'react';
import { Deck, DeckStats } from '@/types/deck';
import { calculateDeckStats } from '@/utils/deckValidation';
import { RiftCard } from '@/types/card';
import { DeckRepository } from '@/services/deckRepository';
import { useAuth } from './AuthContext';

interface DeckContextType {
  decks: Deck[];
  selectedDeck: Deck | null;
  selectedDeckId: string | null;
  setSelectedDeckId: (id: string | null) => void;
  createDeck: (data: {
    name: string;
    description?: string;
    legendCard?: RiftCard;
    domains?: string[];
    color?: string;
    icon?: string;
  }) => Promise<Deck>;
  importDeck: (deck: Deck) => Promise<Deck>;
  duplicateDeck: (deckId: string, customName?: string) => Promise<Deck>;
  updateDeck: (id: string, updates: Partial<Deck>) => void;
  deleteDeck: (id: string) => Promise<boolean>;
  getDeckStats: (deck: Deck) => DeckStats;
  addCardToDeck: (deckId: string, card: RiftCard, targetSection: 'mainUnits' | 'mainGear' | 'mainSpells' | 'battlefields' | 'sideboard' | 'maybeboard') => void;
  removeCardFromDeck: (deckId: string, cardId: string, targetSection: 'mainUnits' | 'mainGear' | 'mainSpells' | 'battlefields' | 'sideboard' | 'maybeboard') => void;
  setCardCountInDeck: (deckId: string, card: RiftCard, targetCount: number) => void;
}

const DeckContext = createContext<DeckContextType | undefined>(undefined);

export const DeckProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // Inicializa vacío sin datos quemados
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);

  // Cargar mazos reales desde Supabase o repositorio
  useEffect(() => {
    let isMounted = true;
    const loadSavedDecks = async () => {
      try {
        const saved = await DeckRepository.getDecks();
        if (isMounted && saved) {
          setDecks(saved);
        }
      } catch (e) {
        console.warn('⚠️ Error al cargar mazos:', e);
      }
    };
    loadSavedDecks();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const selectedDeck = decks.find(d => d.id === selectedDeckId) || null;

  const getDeckStats = (deck: Deck): DeckStats => {
    return calculateDeckStats(deck);
  };

  const createDeck = async (data: {
    name: string;
    description?: string;
    legendCard?: RiftCard;
    domains?: string[];
    color?: string;
    icon?: string;
  }): Promise<Deck> => {
    const created = await DeckRepository.createDeck(data);
    setDecks(prev => [created, ...prev]);
    return created;
  };

  const importDeck = async (importedDeck: Deck): Promise<Deck> => {
    const created = await DeckRepository.createDeck({
      name: importedDeck.name,
      description: importedDeck.description,
      legendCard: importedDeck.legendCard,
      domains: importedDeck.domains,
      color: importedDeck.color,
      icon: importedDeck.icon,
    });
    const fullDeck: Deck = {
      ...importedDeck,
      id: created.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await DeckRepository.updateDeck(created.id, fullDeck);
    setDecks(prev => [fullDeck, ...prev.filter(d => d.id !== created.id)]);
    return fullDeck;
  };

  const duplicateDeck = async (deckId: string, customName?: string): Promise<Deck> => {
    const target = decks.find(d => d.id === deckId);
    if (!target) throw new Error('Mazo no encontrado');

    const clonedName = customName || `${target.name} (Variante)`;
    const created = await DeckRepository.createDeck({
      name: clonedName,
      description: target.description,
      legendCard: target.legendCard,
      domains: target.domains,
      color: target.color,
      icon: target.icon,
    });

    const fullCloned: Deck = {
      ...target,
      id: created.id,
      name: clonedName,
      viewsCount: 0,
      runes: (target.runes || []).map(r => ({ ...r, id: `r_${Date.now()}_${Math.random()}` })),
      battlefields: (target.battlefields || []).map(b => ({ ...b })),
      mainUnits: (target.mainUnits || []).map(u => ({ ...u })),
      mainGear: (target.mainGear || []).map(g => ({ ...g })),
      mainSpells: (target.mainSpells || []).map(s => ({ ...s })),
      sideboard: (target.sideboard || []).map(sb => ({ ...sb })),
      maybeboard: (target.maybeboard || []).map(mb => ({ ...mb })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await DeckRepository.updateDeck(created.id, fullCloned);
    setDecks(prev => [fullCloned, ...prev.filter(d => d.id !== created.id)]);
    return fullCloned;
  };

  const updateDeck = (id: string, updates: Partial<Deck>) => {
    setDecks(prev =>
      prev.map(d => (d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d))
    );
    DeckRepository.updateDeck(id, updates);
  };

  const deleteDeck = async (id: string): Promise<boolean> => {
    await DeckRepository.deleteDeck(id);
    setDecks(prev => prev.filter(d => d.id !== id));
    if (selectedDeckId === id) setSelectedDeckId(null);
    return true;
  };

  const addCardToDeck = (
    deckId: string,
    card: RiftCard,
    targetSection: 'mainUnits' | 'mainGear' | 'mainSpells' | 'battlefields' | 'sideboard' | 'maybeboard'
  ) => {
    setDecks(prev =>
      prev.map(d => {
        if (d.id !== deckId) return d;
        const currentList = [...(d[targetSection] || [])];
        const existingIdx = currentList.findIndex(slot => slot.cardId === card.id);
        if (existingIdx >= 0) {
          currentList[existingIdx] = {
            ...currentList[existingIdx],
            count: Math.min(3, currentList[existingIdx].count + 1),
          };
        } else {
          currentList.push({ cardId: card.id, card, count: 1 });
        }
        const updated = {
          ...d,
          [targetSection]: currentList,
          updatedAt: new Date().toISOString(),
        };
        DeckRepository.updateDeck(deckId, { [targetSection]: currentList });
        return updated;
      })
    );
  };

  const removeCardFromDeck = (
    deckId: string,
    cardId: string,
    targetSection: 'mainUnits' | 'mainGear' | 'mainSpells' | 'battlefields' | 'sideboard' | 'maybeboard'
  ) => {
    setDecks(prev =>
      prev.map(d => {
        if (d.id !== deckId) return d;
        let currentList = [...(d[targetSection] || [])];
        const existingIdx = currentList.findIndex(slot => slot.cardId === cardId);
        if (existingIdx >= 0) {
          if (currentList[existingIdx].count > 1) {
            currentList[existingIdx] = {
              ...currentList[existingIdx],
              count: currentList[existingIdx].count - 1,
            };
          } else {
            currentList = currentList.filter(slot => slot.cardId !== cardId);
          }
        }
        const updated = {
          ...d,
          [targetSection]: currentList,
          updatedAt: new Date().toISOString(),
        };
        DeckRepository.updateDeck(deckId, { [targetSection]: currentList });
        return updated;
      })
    );
  };

  const setCardCountInDeck = (deckId: string, card: RiftCard, targetCount: number) => {
    const cardType = (card.type || card.cardType || '').toLowerCase();
    const section: 'mainUnits' | 'mainGear' | 'mainSpells' | 'battlefields' =
      cardType.includes('unit')
        ? 'mainUnits'
        : cardType.includes('gear')
        ? 'mainGear'
        : cardType.includes('battlefield') || cardType.includes('landmark')
        ? 'battlefields'
        : 'mainSpells';

    setDecks(prev =>
      prev.map(d => {
        if (d.id !== deckId) return d;
        let list = [...(d[section] || [])];
        const idx = list.findIndex(s => s.cardId === card.id);
        const count = Math.max(0, Math.min(3, targetCount));
        if (count === 0) {
          list = list.filter(s => s.cardId !== card.id);
        } else if (idx >= 0) {
          list[idx] = { ...list[idx], count };
        } else {
          list.push({ cardId: card.id, card, count });
        }
        const updated = {
          ...d,
          [section]: list,
          updatedAt: new Date().toISOString(),
        };
        DeckRepository.updateDeck(deckId, { [section]: list });
        return updated;
      })
    );
  };

  return (
    <DeckContext.Provider
      value={{
        decks,
        selectedDeck,
        selectedDeckId,
        setSelectedDeckId,
        createDeck,
        importDeck,
        duplicateDeck,
        updateDeck,
        deleteDeck,
        getDeckStats,
        addCardToDeck,
        removeCardFromDeck,
        setCardCountInDeck,
      }}
    >
      {children}
    </DeckContext.Provider>
  );
};

export const useDecks = () => {
  const ctx = useContext(DeckContext);
  if (!ctx) {
    throw new Error('useDecks debe usarse dentro de DeckProvider');
  }
  return ctx;
};
