-- ==============================================================================
-- ESQUEMA SQL PARA HUB DE MAZOS COMUNITARIOS Y META TIER LIST (Rift Dex)
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase (https://app.supabase.com)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE MAZOS PÚBLICOS DE LA COMUNIDAD
CREATE TABLE IF NOT EXISTS public.public_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Invocador de la Grieta',
  author_avatar TEXT,
  title TEXT NOT NULL,
  description TEXT,
  deck_code TEXT, -- Código RIFT1 para importación rápida
  deck_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- Estructura completa del mazo (RiftCard slots, etc.)
  legend_name TEXT,
  legend_image_url TEXT,
  primary_domain TEXT NOT NULL DEFAULT 'order',
  domains TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}', -- 'Competitivo', 'Budget', 'Fun', 'Aggro', 'Control', etc.
  price_usd NUMERIC(10, 2) DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  clones_count INTEGER DEFAULT 0,
  tier TEXT CHECK (tier IN ('S', 'A', 'B', 'C') OR tier IS NULL),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA DE LIKES (Votos únicos por usuario)
CREATE TABLE IF NOT EXISTS public.deck_likes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deck_id UUID REFERENCES public.public_decks(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_deck_like UNIQUE (deck_id, user_id)
);

-- 3. TRIGGER AUTOMÁTICO PARA CONTADOR DE LIKES
CREATE OR REPLACE FUNCTION public.handle_deck_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.public_decks
    SET likes_count = likes_count + 1
    WHERE id = NEW.deck_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.public_decks
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.deck_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_deck_likes_count ON public.deck_likes;
CREATE TRIGGER tr_deck_likes_count
AFTER INSERT OR DELETE ON public.deck_likes
FOR EACH ROW EXECUTE FUNCTION public.handle_deck_like_count();

-- 4. TABLA DE META TIER LIST OFICIAL Y ARQUETIPOS
CREATE TABLE IF NOT EXISTS public.meta_tier_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  archetype_name TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('S', 'A', 'B', 'C')),
  legend_name TEXT NOT NULL,
  legend_image_url TEXT,
  primary_domain TEXT NOT NULL DEFAULT 'order',
  secondary_domain TEXT,
  popularity_percent NUMERIC(5, 2) DEFAULT 0,
  winrate_percent NUMERIC(5, 2) DEFAULT 0,
  playstyle TEXT DEFAULT 'Midrange',
  key_cards TEXT[] DEFAULT '{}',
  description TEXT,
  sample_deck_id UUID REFERENCES public.public_decks(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_public_decks_likes ON public.public_decks(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_created ON public.public_decks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_public_decks_domain ON public.public_decks(primary_domain);
CREATE INDEX IF NOT EXISTS idx_public_decks_tier ON public.public_decks(tier);
CREATE INDEX IF NOT EXISTS idx_deck_likes_lookup ON public.deck_likes(deck_id, user_id);
CREATE INDEX IF NOT EXISTS idx_meta_tier_order ON public.meta_tier_list(tier, winrate_percent DESC);

-- 6. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.public_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meta_tier_list ENABLE ROW LEVEL SECURITY;

-- Políticas para public_decks
CREATE POLICY "Lectura pública de mazos comunitarios"
  ON public.public_decks FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden publicar mazos"
  ON public.public_decks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Autores pueden editar sus propios mazos"
  ON public.public_decks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Autores pueden eliminar sus propios mazos"
  ON public.public_decks FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para deck_likes
CREATE POLICY "Lectura pública de likes"
  ON public.deck_likes FOR SELECT
  USING (true);

CREATE POLICY "Usuarios autenticados pueden votar mazos"
  ON public.deck_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden retirar su voto"
  ON public.deck_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas para meta_tier_list
CREATE POLICY "Lectura pública del Meta Tier List"
  ON public.meta_tier_list FOR SELECT
  USING (true);

-- 7. DATOS SEMILLA INICIALES PARA EL META TIER LIST
INSERT INTO public.meta_tier_list (archetype_name, tier, legend_name, legend_image_url, primary_domain, popularity_percent, winrate_percent, playstyle, key_cards, description)
VALUES
  ('Vi Hextech Blitz Aggro', 'S', 'Vi, Destructora de Piltover', 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/vi.png', 'fury', 24.5, 58.2, 'Aggro Rápido', ARRAY['Golpe Demoledor', 'Núcleo Hextech Acelerado', 'Fuerza Imparable'], 'Dominio agresivo con alta presión en turno 2 y daño explosivo directo a runas.'),
  ('Zed Sombras Asesinas', 'S', 'Zed, Maestro de las Sombras', 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/zed.png', 'mind', 19.8, 56.4, 'Combo / Evasión', ARRAY['Sombra Viviente', 'Cuchillada Sombría', 'Marca de la Muerte'], 'Control de tempo con unidades elusivas y combos letales de duplicación de sombras.'),
  ('Aatrox Ruina Oscura', 'A', 'Aatrox, la Espada de los Oscuros', 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/aatrox.png', 'chaos', 15.2, 53.7, 'Midrange Sostenido', ARRAY['Espada Darkin', 'Matarreyes', 'Furia Maldita'], 'Alta resiliencia mediante curación continua y criaturas de coste medio implacables.'),
  ('Ahri Encanto Espiritual', 'A', 'Ahri, la Zorra de Nueve Colas', 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/ahri.png', 'calm', 14.1, 52.8, 'Control / Desgaste', ARRAY['Orbe del Engaño', 'Fuego Zorro', 'Viento Envolvente'], 'Negación de recursos, aturdimientos estratégicos y ventaja acumulada de cartas.'),
  ('Garen Baluarte de Demacia', 'B', 'Garen, Poder de Demacia', 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/garen.png', 'order', 11.3, 50.1, 'Defensivo / Valor', ARRAY['Juicio Justo', 'Escudo de Coraje', 'Vanguardia Implacable'], 'Estrategia sólida de bajo coste económico ("Budget Friendly") con unidades de alta defensa.'),
  ('Malphite Firmeza Titánica', 'B', 'Malphite, Fragmento del Monolito', 'https://raw.githubusercontent.com/OpenRift-TCG/card-images/main/malphite.png', 'body', 8.9, 49.2, 'Ramp / Late Game', ARRAY['Fuerza de la Tierra', 'Avalancha Rúnica', 'Impacto Sísmico'], 'Aceleración de recursos de runas para desplegar gigantes arrolladores en juego tardío.')
ON CONFLICT DO NOTHING;
