-- ============================================
-- ARREGLO DE EMERGENCIA 3: DESACTIVAR RLS EN PROFILES
-- ============================================
-- Para asegurar que el Dueño pueda ver el nombre del Jugador que reservó,
-- necesitamos liberar el acceso de lectura a la tabla profiles.

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Esto garantiza que las consultas JOIN desde bookings funcionen correctamente
-- y devuelvan el nombre del jugador.
