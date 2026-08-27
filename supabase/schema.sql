-- ============================================================================
-- K.K. Tour — Supabase PostgreSQL Schema & Security Policies (RLS)
-- ============================================================================

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Role-based access: admin / editor)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Trigger to automatically create a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'editor')
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function: Check if current authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if current authenticated user is admin or editor
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'editor')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Tours Table
CREATE TABLE IF NOT EXISTS public.tours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug TEXT UNIQUE NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    photo TEXT NOT NULL DEFAULT 'assets/images/album_lake.jpg',
    duration_days INTEGER NOT NULL DEFAULT 1,
    category TEXT NOT NULL DEFAULT 'lakes' CHECK (category IN ('lakes', 'canyons', 'mountains', 'history', 'jeep', 'custom')),
    featured BOOLEAN NOT NULL DEFAULT false,
    featured_order INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index for fast public catalog queries
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_featured ON public.tours(featured, featured_order);
CREATE INDEX IF NOT EXISTS idx_tours_category ON public.tours(category);
CREATE INDEX IF NOT EXISTS idx_tours_slug ON public.tours(slug);


-- 3. Tour Translations Table (RU / KZ / EN)
CREATE TABLE IF NOT EXISTS public.tour_translations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('ru', 'kz', 'en')),
    name TEXT NOT NULL,
    description TEXT,
    full_description TEXT,
    duration_label TEXT,
    days_label TEXT,
    badge TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_tour_language UNIQUE (tour_id, language)
);

CREATE INDEX IF NOT EXISTS idx_translations_tour_lang ON public.tour_translations(tour_id, language);


-- 4. Tour Includes Table (What's Included checklist items)
CREATE TABLE IF NOT EXISTS public.tour_includes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('ru', 'kz', 'en')),
    text TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_includes_tour_lang ON public.tour_includes(tour_id, language, sort_order);


-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_includes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies for: profiles
-- ----------------------------------------------------------------------------
-- Authenticated users can view their own profile; Admins can view all profiles
CREATE POLICY "Profiles view policy"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (id = auth.uid() OR public.is_admin());

-- Users can update their own non-role fields; Admins can update all
CREATE POLICY "Profiles update policy"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid() OR public.is_admin())
    WITH CHECK (
        (id = auth.uid() AND role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
        OR public.is_admin()
    );

-- Only admins can delete profiles
CREATE POLICY "Profiles delete policy"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- Policies for: tours
-- ----------------------------------------------------------------------------
-- Public can read ONLY published tours; Editors/Admins can read ALL tours
CREATE POLICY "Public and Admin read tours"
    ON public.tours FOR SELECT
    USING (
        status = 'published' 
        OR (auth.role() = 'authenticated' AND public.is_editor_or_admin())
    );

-- Editors and Admins can create tours
CREATE POLICY "Editor and Admin insert tours"
    ON public.tours FOR INSERT
    TO authenticated
    WITH CHECK (public.is_editor_or_admin());

-- Editors and Admins can update tours
CREATE POLICY "Editor and Admin update tours"
    ON public.tours FOR UPDATE
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- Only Admins can permanently delete tours
CREATE POLICY "Admin only delete tours"
    ON public.tours FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- Policies for: tour_translations
-- ----------------------------------------------------------------------------
-- Public can read translations for published tours; Staff can read all
CREATE POLICY "Public and Admin read translations"
    ON public.tour_translations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tours 
            WHERE tours.id = tour_translations.tour_id 
              AND tours.status = 'published'
        )
        OR (auth.role() = 'authenticated' AND public.is_editor_or_admin())
    );

-- Editors and Admins can insert translations
CREATE POLICY "Editor and Admin insert translations"
    ON public.tour_translations FOR INSERT
    TO authenticated
    WITH CHECK (public.is_editor_or_admin());

-- Editors and Admins can update translations
CREATE POLICY "Editor and Admin update translations"
    ON public.tour_translations FOR UPDATE
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- Only Admins can delete translations
CREATE POLICY "Admin only delete translations"
    ON public.tour_translations FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- Policies for: tour_includes
-- ----------------------------------------------------------------------------
-- Public can read includes for published tours; Staff can read all
CREATE POLICY "Public and Admin read includes"
    ON public.tour_includes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.tours 
            WHERE tours.id = tour_includes.tour_id 
              AND tours.status = 'published'
        )
        OR (auth.role() = 'authenticated' AND public.is_editor_or_admin())
    );

-- Editors and Admins can insert includes
CREATE POLICY "Editor and Admin insert includes"
    ON public.tour_includes FOR INSERT
    TO authenticated
    WITH CHECK (public.is_editor_or_admin());

-- Editors and Admins can update includes
CREATE POLICY "Editor and Admin update includes"
    ON public.tour_includes FOR UPDATE
    TO authenticated
    USING (public.is_editor_or_admin())
    WITH CHECK (public.is_editor_or_admin());

-- Only Admins can delete includes
CREATE POLICY "Admin only delete includes"
    ON public.tour_includes FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ============================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION & POLICIES
-- ============================================================================

-- Create 'tour-images' bucket if it does not exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-images', 'tour-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policy: Public Read Access
CREATE POLICY "Public can view tour images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'tour-images');

-- Storage Policy: Editors and Admins can upload images
CREATE POLICY "Staff can upload tour images"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'tour-images' AND public.is_editor_or_admin());

-- Storage Policy: Editors and Admins can update images
CREATE POLICY "Staff can update tour images"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'tour-images' AND public.is_editor_or_admin());

-- Storage Policy: Admins can delete tour images
CREATE POLICY "Admin can delete tour images"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'tour-images' AND public.is_admin());
