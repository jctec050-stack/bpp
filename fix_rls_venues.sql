-- ============================================
-- SCRIPT DE DIAGNÓSTICO Y CORRECCIÓN RLS
-- Para resolver problemas de timeout en INSERT de venues
-- ============================================

-- PASO 1: DIAGNÓSTICO
-- Ejecuta esto primero para ver qué está pasando
-- ============================================

SELECT '=== DIAGNÓSTICO DE SESIÓN ===' as step;

-- Ver usuario actual
SELECT 
  auth.uid() as user_id,
  auth.role() as user_role,
  CASE 
    WHEN auth.uid() IS NULL THEN '❌ NO HAY SESIÓN ACTIVA'
    ELSE '✅ Sesión activa'
  END as session_status;

-- Ver perfil del usuario actual
SELECT 
  '=== PERFIL DEL USUARIO ===' as step,
  id,
  email,
  full_name,
  role,
  created_at
FROM public.profiles 
WHERE id = auth.uid();

-- Ver políticas actuales de venues
SELECT 
  '=== POLÍTICAS ACTUALES DE VENUES ===' as step,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'venues';

-- PASO 2: CORRECCIÓN
-- Si el diagnóstico muestra problemas, ejecuta esto
-- ============================================

SELECT '=== APLICANDO CORRECCIONES ===' as step;

-- Eliminar políticas antiguas que puedan estar causando conflictos
DROP POLICY IF EXISTS "Owners can insert own venues" ON public.venues;
DROP POLICY IF EXISTS "Owners can update own venues" ON public.venues;
DROP POLICY IF EXISTS "Owners can delete own venues" ON public.venues;

-- Recrear política de INSERT (más permisiva para usuarios autenticados)
CREATE POLICY "Owners can insert own venues" 
ON public.venues
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = owner_id);

-- Recrear política de UPDATE
CREATE POLICY "Owners can update own venues" 
ON public.venues
FOR UPDATE 
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- Agregar política de DELETE (si no existe)
CREATE POLICY "Owners can delete own venues" 
ON public.venues
FOR DELETE 
TO authenticated
USING (auth.uid() = owner_id);

SELECT '✅ Políticas recreadas correctamente' as result;

-- PASO 3: VERIFICACIÓN
-- Ejecuta esto para confirmar que todo está bien
-- ============================================

SELECT '=== VERIFICACIÓN FINAL ===' as step;

-- Ver políticas actualizadas
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Tiene WITH CHECK'
    ELSE '⚠️ Sin WITH CHECK'
  END as check_status
FROM pg_policies 
WHERE tablename = 'venues'
ORDER BY cmd;

-- PASO 4: TEST (OPCIONAL)
-- Si quieres probar temporalmente sin RLS
-- ============================================

-- ⚠️ SOLO PARA TESTING - DESCOMENTAR SI ES NECESARIO
-- ALTER TABLE public.venues DISABLE ROW LEVEL SECURITY;
-- SELECT '⚠️ RLS DESACTIVADO TEMPORALMENTE - RECUERDA REACTIVARLO' as warning;

-- Para reactivar RLS después del test:
-- ALTER TABLE public.venues ENABLE ROW LEVEL SECURITY;
-- SELECT '✅ RLS REACTIVADO' as result;

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. Si auth.uid() es NULL, el problema es la sesión
--    Solución: Hacer logout/login en la app
-- 
-- 2. Si las políticas están bien pero sigue lento,
--    el problema puede ser:
--    - Imágenes base64 muy grandes
--    - Conexión lenta a internet
--    - Geocoding tardando mucho
--
-- 3. Las políticas ahora usan "TO authenticated" que es
--    más explícito y compatible con email confirmation
-- ============================================
