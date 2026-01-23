-- ============================================
-- SIMPLIFICACIÓN DE POLÍTICAS DE STORAGE
-- ============================================
-- Este script relaja las políticas de seguridad de Storage para evitar bloqueos
-- relacionados con la verificación de roles en la tabla profiles.

-- 1. Asegurar que los buckets son públicos
UPDATE storage.buckets SET public = true WHERE id IN ('venue-images', 'court-images');

-- 2. Eliminar políticas restrictivas anteriores (Venue Images)
DROP POLICY IF EXISTS "Owners can upload venue images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update venue images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete venue images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view venue images" ON storage.objects;

-- 3. Crear políticas simplificadas (Venue Images)
-- Lectura pública
CREATE POLICY "Public can view venue images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'venue-images');

-- Escritura para cualquier usuario autenticado
CREATE POLICY "Authenticated can upload venue images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update venue images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete venue images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'venue-images' AND auth.role() = 'authenticated');

-- 4. Eliminar políticas restrictivas anteriores (Court Images)
DROP POLICY IF EXISTS "Owners can upload court images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update court images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete court images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view court images" ON storage.objects;

-- 5. Crear políticas simplificadas (Court Images)
-- Lectura pública
CREATE POLICY "Public can view court images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'court-images');

-- Escritura para cualquier usuario autenticado
CREATE POLICY "Authenticated can upload court images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'court-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update court images"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'court-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated can delete court images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'court-images' AND auth.role() = 'authenticated');
