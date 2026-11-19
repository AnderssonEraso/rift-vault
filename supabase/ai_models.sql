-- Migration: AI Models configuration table
-- Allows dynamic management of AI models with active/inactive status, visibility, custom endpoints, and sorting.

CREATE TABLE IF NOT EXISTS public.ai_models (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    model_id TEXT NOT NULL,
    endpoint_url TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aseguramos que la columna is_visible exista si la tabla ya había sido creada previamente
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'ai_models' AND column_name = 'is_visible'
    ) THEN
        ALTER TABLE public.ai_models ADD COLUMN is_visible BOOLEAN NOT NULL DEFAULT true;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

-- Allow public read access to models (so any authenticated or anon user can fetch available models)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ai_models' AND policyname = 'Allow public read access to ai_models'
    ) THEN
        CREATE POLICY "Allow public read access to ai_models"
            ON public.ai_models
            FOR SELECT
            USING (true);
    END IF;
END $$;

-- Allow authenticated users to manage models
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'ai_models' AND policyname = 'Allow authenticated users to manage ai_models'
    ) THEN
        CREATE POLICY "Allow authenticated users to manage ai_models"
            ON public.ai_models
            FOR ALL
            TO authenticated
            USING (true)
            WITH CHECK (true);
    END IF;
END $$;

-- Seed initial models with gemini-3.5-flash-lite as the ONLY active and visible model by default
INSERT INTO public.ai_models (id, name, model_id, endpoint_url, is_active, is_visible, is_default, description, sort_order)
VALUES
    ('gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite', 'gemini-3.5-flash-lite', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent', true, true, true, 'Modelo ultra rápido y ligero configurado por defecto', 1),
    ('gemini-flash-latest', 'Gemini Flash (Latest)', 'gemini-flash-latest', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', false, false, false, 'Modelo estándar oficial de Google AI Studio', 2),
    ('gemini-1.5-flash', 'Gemini 1.5 Flash', 'gemini-1.5-flash', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', false, false, false, 'Versión estable 1.5 para análisis táctico', 3),
    ('gemini-2.0-flash', 'Gemini 2.0 Flash', 'gemini-2.0-flash', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', false, false, false, 'Arquitectura 2.0 de última generación', 4),
    ('gemini-2.0-flash-lite', 'Gemini 2.0 Flash Lite', 'gemini-2.0-flash-lite', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent', false, false, false, 'Versión ligera oficial 2.0', 5)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    model_id = EXCLUDED.model_id,
    endpoint_url = EXCLUDED.endpoint_url,
    is_active = EXCLUDED.is_active,
    is_visible = EXCLUDED.is_visible,
    is_default = EXCLUDED.is_default,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
