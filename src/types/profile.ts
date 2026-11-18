export interface Friend {
  id: string;
  username: string;
  avatarUrl: string;
  status: 'online' | 'in_game' | 'offline';
  level: number;
  activeDeckName?: string;
  collectionCount?: number;
}

export interface UserProfile {
  id: string;
  username: string;
  tagline: string;
  avatarUrl: string;
  championIcon: string;
  bio?: string;
  isPremium: boolean;
  stats: {
    cardsOwned: number;
    decksBuilt: number;
    matchesPlayed: number;
    matchesWon: number;
    winRate: number;
  };
  friends: Friend[];
}
