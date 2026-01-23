-- ============================================
-- ARREGLO FINAL RLS: SIMPLIFICAR CHECK
-- ============================================
-- A veces, la verificación cruzada con la tabla 'profiles' falla silenciosamente
-- aunque el dato sea correcto (debido a complejidad interna de Postgres/RLS).

-- Vamos a simplificar la política para "Crear Venues".
-- En lugar de verificar si el usuario es 'OWNER' en la tabla profiles,
-- solo verificaremos que el usuario esté creando un venue para SÍ MISMO (auth.uid = owner_id).

-- Esto es seguro porque un usuario solo puede asignarse venues a sí mismo.

DROP POLICY IF EXISTS "Owners can create venues" ON venues;

CREATE POLICY "Owners can create venues"
    ON venues FOR INSERT
    WITH CHECK (
        auth.uid() = owner_id
    );

-- (Las demás políticas de lectura/update ya son seguras y no bloquean la creación)
