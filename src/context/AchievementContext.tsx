import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import {
  Achievement,
  ACHIEVEMENTS_CATALOG,
} from '@/constants/achievements';
import {
  evaluateUserAchievements,
  getStoredUnlockedAchievements,
  saveStoredUnlockedAchievements,
  getActionFlags,
  setActionFlag,
  EvaluatedAchievement,
  UnlockedAchievementsMap,
  ActionFlags,
} from '@/utils/achievementEvaluator';
import { useCollection } from '@/context/CollectionContext';
import { useDecks } from '@/context/DeckContext';
import { useProfile } from '@/context/ProfileContext';
import { useWishlist } from '@/context/WishlistContext';
import { MatchRepository } from '@/services/matchRepository';
import { AchievementUnlockedToast } from '@/components/achievements/AchievementUnlockedToast';
import { Deck } from '@/types/deck';

export interface SummonerRank {
  title: string;
  minXp: number;
  nextXp: number;
  badgeColor: string;
}

export function getSummonerRank(xp: number): SummonerRank {
  if (xp < 150) {
    return { title: 'Invocador Novato', minXp: 0, nextXp: 150, badgeColor: '#94A3B8' };
  } else if (xp < 450) {
    return { title: 'Adepto del Nexo', minXp: 150, nextXp: 450, badgeColor: '#3B82F6' };
  } else if (xp < 900) {
    return { title: 'Estratega Arcano', minXp: 450, nextXp: 900, badgeColor: '#8B5CF6' };
  } else if (xp < 1500) {
    return { title: 'Maestro de Dominio', minXp: 900, nextXp: 1500, badgeColor: '#10B981' };
  } else if (xp < 2500) {
    return { title: 'Gran Archimago', minXp: 1500, nextXp: 2500, badgeColor: '#F59E0B' };
  } else {
    return { title: 'Señor de la Grieta', minXp: 2500, nextXp: 3500, badgeColor: '#EF4444' };
  }
}

interface AchievementContextType {
  evaluations: EvaluatedAchievement[];
  unlockedCount: number;
  totalCount: number;
  totalXp: number;
  summonerRank: SummonerRank;
  activeToast: Achievement | null;
  dismissToast: () => void;
  recordAction: (action: 'scannedCard' | 'usedTrade') => Promise<void>;
  refreshAchievements: () => Promise<void>;
}

const AchievementContext = createContext<AchievementContextType | undefined>(undefined);

export const AchievementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { allCollectionItems, stats: collectionStats } = useCollection();
  const { decks } = useDecks();
  const { profile } = useProfile();
  const { items: wishlistItems } = useWishlist();

  const [unlockedMap, setUnlockedMap] = useState<UnlockedAchievementsMap>({});
  const [evaluations, setEvaluations] = useState<EvaluatedAchievement[]>([]);
  const [totalXp, setTotalXp] = useState(0);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);
  const [activeToast, setActiveToast] = useState<Achievement | null>(null);

  // Cargar logros previamente guardados al iniciar
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const stored = await getStoredUnlockedAchievements();
      if (isMounted) {
        setUnlockedMap(stored);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Manejo de la cola de toasts
  useEffect(() => {
    if (!activeToast && toastQueue.length > 0) {
      const next = toastQueue[0];
      setActiveToast(next);
      setToastQueue(prev => prev.slice(1));
    }
  }, [activeToast, toastQueue]);

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  // Función principal de evaluación
  const runEvaluation = useCallback(
    async (flagsOverride?: ActionFlags) => {
      try {
        const storedMatches = await MatchRepository.getAllMatches();
        const actionFlags = flagsOverride || (await getActionFlags());

        // Conteo de cartas por dominio
        const domainCounts: Record<string, number> = {};
        allCollectionItems.forEach(item => {
          const domain = item.card?.domains?.[0] || 'Unknown';
          const copies = (item.regularCount || 0) + (item.foilCount || 0);
          domainCounts[domain] = (domainCounts[domain] || 0) + copies;
        });

        // Contar mazos legales (>= 40 cartas) y leyendas únicas
        let legalDecksCount = 0;
        const uniqueLegends = new Set<string>();

        decks.forEach((deck: Deck) => {
          const mainCount =
            (deck.mainUnits?.reduce((s: number, c) => s + c.count, 0) || 0) +
            (deck.mainGear?.reduce((s: number, c) => s + c.count, 0) || 0) +
            (deck.mainSpells?.reduce((s: number, c) => s + c.count, 0) || 0);
          if (mainCount >= 40) {
            legalDecksCount += 1;
          }
          if (deck.legendCard?.name) {
            uniqueLegends.add(deck.legendCard.name);
          }
        });

        // Estadísticas de partidas y racha invicta
        const totalMatches = storedMatches.length;
        const totalWins = storedMatches.filter(m => m.result === 'win').length;

        // Calcular racha máxima de victorias consecutivas (cronológico)
        let maxStreak = 0;
        let currentStreak = 0;
        // Orden inverso a created_at para evaluar secuencialmente
        const chronologicalMatches = [...storedMatches].reverse();
        chronologicalMatches.forEach(match => {
          if (match.result === 'win') {
            currentStreak += 1;
            if (currentStreak > maxStreak) {
              maxStreak = currentStreak;
            }
          } else if (match.result === 'loss') {
            currentStreak = 0;
          }
        });

        const currentMap = await getStoredUnlockedAchievements();

        const { result, updatedUnlockedMap } = evaluateUserAchievements(
          {
            totalCards: collectionStats.totalCopies,
            foilCards: collectionStats.totalFoil,
            domainCounts,
            decksCount: decks.length,
            legalDecksCount,
            uniqueLegendsCount: uniqueLegends.size,
            totalMatches,
            totalWins,
            winStreak: maxStreak,
            friendsCount: profile.friends.length,
            wishlistCount: wishlistItems.length,
            actionFlags,
          },
          currentMap
        );

        setEvaluations(result.evaluations);
        setUnlockedCount(result.unlockedCount);
        setTotalXp(result.totalXp);
        setUnlockedMap(updatedUnlockedMap);

        // Si hay nuevos logros desbloqueados, guardarlos y añadirlos a la cola de Toasts
        if (result.newlyUnlocked.length > 0) {
          await saveStoredUnlockedAchievements(updatedUnlockedMap);
          setToastQueue(prev => [...prev, ...result.newlyUnlocked]);
        }
      } catch (err) {
        console.warn('⚠️ Error evaluando logros de invocador:', err);
      }
    },
    [allCollectionItems, collectionStats, decks, profile.friends, wishlistItems]
  );

  // Re-evaluar automáticamente ante cambios clave
  useEffect(() => {
    runEvaluation();
  }, [runEvaluation]);

  const recordAction = useCallback(
    async (action: 'scannedCard' | 'usedTrade') => {
      await setActionFlag(action, true);
      const updatedFlags = await getActionFlags();
      await runEvaluation(updatedFlags);
    },
    [runEvaluation]
  );

  const summonerRank = useMemo(() => getSummonerRank(totalXp), [totalXp]);

  return (
    <AchievementContext.Provider
      value={{
        evaluations,
        unlockedCount,
        totalCount: ACHIEVEMENTS_CATALOG.length,
        totalXp,
        summonerRank,
        activeToast,
        dismissToast,
        recordAction,
        refreshAchievements: runEvaluation,
      }}
    >
      {children}
      <AchievementUnlockedToast achievement={activeToast} onDismiss={dismissToast} />
    </AchievementContext.Provider>
  );
};

export const useAchievements = (): AchievementContextType => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};
