import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Friend } from '@/types/profile';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '@/services/supabaseClient';

export const AVAILABLE_AVATARS = [
  { id: 'zed', name: 'Zed', image: 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Zed.png', color: '#E84057' },
  { id: 'vi', name: 'Vi', image: 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Vi.png', color: '#C8AA6E' },
  { id: 'seraphine', name: 'Seraphine', image: 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Seraphine.png', color: '#EC4899' },
  { id: 'evelynn', name: 'Evelynn', image: 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Evelynn.png', color: '#A855F7' },
  { id: 'shen', name: 'Shen', image: 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Shen.png', color: '#0AC8B9' },
  { id: 'jinx', name: 'Jinx', image: 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Jinx.png', color: '#3B82F6' },
  { id: 'vex', name: 'Vex', image: 'https://ddragon.leagueoflegends.com/cdn/14.3.1/img/champion/Vex.png', color: '#10B981' },
];

interface ProfileContextType {
  profile: UserProfile;
  updateProfile: (updated: Partial<UserProfile>) => void;
  addFriend: (username: string) => boolean;
  removeFriend: (friendId: string) => void;
  reloadProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [profile, setProfile] = useState<UserProfile>({
    id: user?.id || 'usr_guest',
    username: user?.username || 'Invocador',
    tagline: 'Invocador de Riftbound',
    avatarUrl: AVAILABLE_AVATARS[0].image,
    championIcon: 'zed',
    bio: '',
    isPremium: false,
    stats: {
      cardsOwned: 0,
      decksBuilt: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      winRate: 0,
    },
    friends: [],
  });

  // Cargar perfil real desde Supabase cuando el usuario inicia sesión
  const reloadProfile = async () => {
    if (!user) return;

    if (isSupabaseConfigured() && !user.isGuest) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setProfile(prev => ({
            ...prev,
            id: data.id,
            username: data.username || user.username,
            tagline: data.tagline || prev.tagline,
            avatarUrl: data.avatar_url || prev.avatarUrl,
            championIcon: data.champion_icon || prev.championIcon,
            bio: data.bio || '',
            isPremium: data.is_premium || false,
            stats: {
              cardsOwned: data.cards_owned || 0,
              decksBuilt: data.decks_built || 0,
              matchesPlayed: data.matches_played || 0,
              matchesWon: data.matches_won || 0,
              winRate: data.matches_played > 0
                ? Math.round((data.matches_won / data.matches_played) * 100)
                : 0,
            },
          }));
          return;
        }
      } catch (e) {
        console.warn('⚠️ Error al cargar perfil de Supabase:', e);
      }
    }

    // Inicialización limpia con el usuario autenticado
    setProfile(prev => ({
      ...prev,
      id: user.id,
      username: user.username,
    }));
  };

  useEffect(() => {
    reloadProfile();
  }, [user]);

  const updateProfile = async (updated: Partial<UserProfile>) => {
    setProfile(prev => ({
      ...prev,
      ...updated,
    }));

    if (isSupabaseConfigured() && user && !user.isGuest) {
      try {
        await supabase
          .from('profiles')
          .update({
            username: updated.username,
            tagline: updated.tagline,
            bio: updated.bio,
            avatar_url: updated.avatarUrl,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      } catch (e) {
        console.warn('⚠️ Error al actualizar perfil en Supabase:', e);
      }
    }
  };

  const addFriend = (friendUsername: string): boolean => {
    if (!friendUsername.trim()) return false;
    const exists = profile.friends.some(
      f => f.username.toLowerCase() === friendUsername.toLowerCase().trim()
    );
    if (exists) return false;

    const randomAvatar = AVAILABLE_AVATARS[Math.floor(Math.random() * AVAILABLE_AVATARS.length)];
    const newFriend: Friend = {
      id: `fr_${Date.now()}`,
      username: friendUsername.trim(),
      avatarUrl: randomAvatar.image,
      status: 'online',
      level: 1,
      activeDeckName: 'Mazo Nuevo',
      collectionCount: 0,
    };

    setProfile(prev => ({
      ...prev,
      friends: [newFriend, ...prev.friends],
    }));
    return true;
  };

  const removeFriend = (friendId: string) => {
    setProfile(prev => ({
      ...prev,
      friends: prev.friends.filter(f => f.id !== friendId),
    }));
  };

  return (
    <ProfileContext.Provider value={{ profile, updateProfile, addFriend, removeFriend, reloadProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile debe usarse dentro de ProfileProvider');
  }
  return ctx;
};
