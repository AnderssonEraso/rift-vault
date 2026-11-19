-- Migration: Tablas de Mazos (Decks) y Cartas de Mazo (deck_cards)
-- Permite persistencia completa relacional entre dispositivos con clave foránea deck_id y boolean is_owned

-- 1. Asegurar extensión pgcrypto/uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Asegurar que la tabla decks soporte id UUID generado automáticamente y columnas completas
CREATE TABLE IF NOT EXISTS public.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT,
  legend_card JSONB,
  domains TEXT[] DEFAULT '{}',
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'sparkles',
  views_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  price_usd NUMERIC(10, 2) DEFAULT 0.00,
  runes JSONB DEFAULT '[]'::jsonb,
  battlefields JSONB DEFAULT '[]'::jsonb,
  main_units JSONB DEFAULT '[]'::jsonb,
  main_gear JSONB DEFAULT '[]'::jsonb,
  main_spells JSONB DEFAULT '[]'::jsonb,
  sideboard JSONB DEFAULT '[]'::jsonb,
  maybeboard JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Asegurar columnas color e icon en decks si ya existía la tabla
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'decks' AND column_name = 'color') THEN
    ALTER TABLE public.decks ADD COLUMN color TEXT DEFAULT '#3B82F6';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'decks' AND column_name = 'icon') THEN
    ALTER TABLE public.decks ADD COLUMN icon TEXT DEFAULT 'sparkles';
  END IF;
END $$;

-- 3. TABLA RELACIONAL deck_cards CON LLAVE FORÁNEA deck_id Y CAMPO is_owned
CREATE TABLE IF NOT EXISTS public.deck_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('legend', 'battlefield', 'unit', 'spell', 'gear', 'sideboard', 'maybeboard')),
  count INTEGER NOT NULL DEFAULT 1 CHECK (count >= 1 AND count <= 3),
  card_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_owned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT deck_cards_deck_card_category_unique UNIQUE(deck_id, card_id, category)
);

-- Índices para optimizar consultas de mazos y sus cartas
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON public.deck_cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_card_id ON public.deck_cards(card_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_category ON public.deck_cards(category);

-- 4. POLÍTICAS RLS CON WITH CHECK (Permite SELECT, INSERT, UPDATE, DELETE para desarrollo y autenticados)
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Permitir acceso total a decks" ON public.decks;
  DROP POLICY IF EXISTS "Permitir acceso público a decks" ON public.decks;
  CREATE POLICY "Permitir acceso total a decks"
    ON public.decks
    FOR ALL
    USING (true)
    WITH CHECK (true);

  DROP POLICY IF EXISTS "Permitir acceso total a deck_cards" ON public.deck_cards;
  DROP POLICY IF EXISTS "Permitir acceso público a deck_cards" ON public.deck_cards;
  CREATE POLICY "Permitir acceso total a deck_cards"
    ON public.deck_cards
    FOR ALL
    USING (true)
    WITH CHECK (true);
END $$;
