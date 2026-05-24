-- =============================================================
-- MIGRACIÓN: Fotos de perfil y portada de plan
-- Ejecutar en Supabase SQL Editor (proyecto > SQL Editor > New query)
-- =============================================================

-- 1. Añadir columna avatar_url a la tabla profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Añadir columna cover_url a la tabla planes
ALTER TABLE planes
  ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- =============================================================
-- STORAGE: crear buckets (también se puede hacer desde la UI)
-- =============================================================
-- Supabase no permite crear buckets vía SQL directamente.
-- Hazlo desde: Storage > New Bucket en el dashboard.
--
-- Bucket 1: avatars      → público ✅
-- Bucket 2: plan-covers  → público ✅
--
-- Política recomendada para cada bucket:
--   Name: "Authenticated users can upload"
--   Allowed operations: SELECT, INSERT, UPDATE, DELETE
--   Target roles: authenticated
--   Policy definition (for INSERT/UPDATE/DELETE):
--     (auth.uid() IS NOT NULL)
--
-- O usa estas políticas SQL (una vez creados los buckets):

-- Permitir a usuarios autenticados subir a avatars
CREATE POLICY "Upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Update own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "Read avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados subir a plan-covers
CREATE POLICY "Upload plan cover" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'plan-covers');

CREATE POLICY "Update plan cover" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'plan-covers');

CREATE POLICY "Read plan covers" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'plan-covers');
