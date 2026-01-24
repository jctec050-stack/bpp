-- ============================================
-- FIX STORAGE PERMISSIONS (FINAL)
-- ============================================

-- 1. Create bucket if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-images', 'venue-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Drop legacy policies to start fresh
DROP POLICY IF EXISTS "Public can view venue images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can upload venue images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can update venue images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete venue images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can upload venue images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can update venue images" ON storage.objects;
DROP POLICY IF EXISTS "Owners can delete venue images" ON storage.objects;
DROP POLICY IF EXISTS "Give me access" ON storage.objects;

-- 3. Create PERMISSIVE policies (Allow ALL operations for testing)
-- This allows anyone (anon or authenticated) to read/write to venue-images
-- We use this to rule out RLS as the cause of the timeout/hang.

CREATE POLICY "Allow Public Access venue-images"
ON storage.objects FOR ALL
USING (bucket_id = 'venue-images')
WITH CHECK (bucket_id = 'venue-images');

-- 4. Verify bucket setup
SELECT id, name, public FROM storage.buckets WHERE id = 'venue-images';
