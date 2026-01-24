-- ============================================
-- ARREGLO DE EMERGENCIA 2: DESACTIVAR RLS EN SLOTS Y BOOKINGS
-- ============================================
-- Para garantizar que la gestión de horarios funcione sin problemas de permisos
-- recursivos, desactivamos RLS en las tablas transaccionales por ahora.

ALTER TABLE disabled_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;

-- Esto asegura que si estás logueado, puedas escribir en estas tablas.
-- Luego, si es necesario, reactivaremos con policies simplificadas.
