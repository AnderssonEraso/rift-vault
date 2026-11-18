-- ==============================================================================
-- TABLA DE WISHLIST (LISTA DE DESEADOS) - RIFTBOUND TCG (Rift Dex)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  card_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  target_quantity INTEGER NOT NULL DEFAULT 1 CHECK (target_quantity > 0),
  is_foil BOOLEAN NOT NULL DEFAULT false,
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('alta', 'media', 'baja')),
  target_price NUMERIC(10, 2) CHECK (target_price >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_wishlist_card UNIQUE (user_id, card_id, is_foil)
);

-- ÍNDICES PARA BÚSQUEDAS EFICIENTES
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_card_id ON public.wishlists(card_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_priority ON public.wishlists(priority);

-- POLÍTICAS DE SEGURIDAD (RLS - Row Level Security)
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- 1. Los usuarios solo pueden ver sus propios elementos de la Wishlist
CREATE POLICY "Users can view their own wishlist items"
  ON public.wishlists FOR SELECT
  USING (auth.uid() = user_id);

-- 2. Los usuarios pueden insertar elementos en su propia Wishlist
CREATE POLICY "Users can insert their own wishlist items"
  ON public.wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Los usuarios pueden actualizar sus propios elementos de Wishlist
CREATE POLICY "Users can update their own wishlist items"
  ON public.wishlists FOR UPDATE
  USING (auth.uid() = user_id);

-- 4. Los usuarios pueden eliminar elementos de su propia Wishlist
CREATE POLICY "Users can delete their own wishlist items"
  ON public.wishlists FOR DELETE
  USING (auth.uid() = user_id);
