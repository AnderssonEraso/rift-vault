-- ==============================================================================
-- ESQUEMA SQL PARA SUPABASE - RIFTBOUND TCG (RiftVault)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase (https://app.supabase.com)
-- ==============================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLA DE PERFILES DE USUARIO
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username TEXT NOT NULL UNIQUE,
  tagline TEXT DEFAULT 'Maestro de las Runas',
  avatar_url TEXT,
  champion_icon TEXT DEFAULT 'zed',
  bio TEXT,
  is_premium BOOLEAN DEFAULT false,
  cards_owned INTEGER DEFAULT 0,
  decks_built INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  matches_won INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA DE CARPETAS DE COLECCIÓN
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA DE CARTAS EN CARPETAS (Inventario físico de colección)
CREATE TABLE IF NOT EXISTS public.folder_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_data JSONB NOT NULL, -- Datos de la carta traídos de OpenRift
  regular_count INTEGER DEFAULT 1,
  foil_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_folder_card UNIQUE (folder_id, card_id)
);

-- 5. TABLA DE MAZOS (Riftbound Decks)
CREATE TABLE IF NOT EXISTS public.decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  legend_card JSONB,
  domains TEXT[] DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  price_usd NUMERIC(10, 2) DEFAULT 0.00,
  runes JSONB DEFAULT '[]'::jsonb, -- 12 Runas exactas
  battlefields JSONB DEFAULT '[]'::jsonb, -- 3 Campos de batalla
  main_units JSONB DEFAULT '[]'::jsonb, -- Unidades mazo principal
  main_gear JSONB DEFAULT '[]'::jsonb, -- Gear mazo principal
  main_spells JSONB DEFAULT '[]'::jsonb, -- Hechizos mazo principal
  sideboard JSONB DEFAULT '[]'::jsonb, -- Mazo secundario (máx 10)
  maybeboard JSONB DEFAULT '[]'::jsonb, -- En consideración (máx 100)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA DE PARTIDAS Y MARCADORES (Match Tracking)
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  max_points INTEGER DEFAULT 8,
  player_count INTEGER DEFAULT 2,
  enable_xp BOOLEAN DEFAULT true,
  players JSONB NOT NULL, -- Datos de jugadores, campeones y puntuaciones
  winner_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- 7. TABLA DE HISTORIAL DE INTERCAMBIOS
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  my_cards JSONB NOT NULL,
  their_cards JSONB NOT NULL,
  my_total NUMERIC(10, 2) NOT NULL,
  their_total NUMERIC(10, 2) NOT NULL,
  difference NUMERIC(10, 2) NOT NULL,
  is_fair BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. POLÍTICAS DE ACCESO RLS (Permitir lectura y escritura anónima para desarrollo inicial)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso público a profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Permitir acceso público a folders" ON public.folders FOR ALL USING (true);
CREATE POLICY "Permitir acceso público a folder_cards" ON public.folder_cards FOR ALL USING (true);
CREATE POLICY "Permitir acceso público a decks" ON public.decks FOR ALL USING (true);
CREATE POLICY "Permitir acceso público a matches" ON public.matches FOR ALL USING (true);
CREATE POLICY "Permitir acceso público a trades" ON public.trades FOR ALL USING (true);
