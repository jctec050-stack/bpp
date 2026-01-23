-- ============================================
-- ARREGLO RÁPIDO: ASIGNAR ROL DE OWNER
-- ============================================
-- El error "new row violates row-level security policy for table venues"
-- ocurre porque tu usuario actual no tiene el rol de 'OWNER' en la tabla 'profiles'.
-- (Probablemente se registró como 'PLAYER' por defecto).

-- Este script promueve a TODOS los usuarios actuales a OWNER para que puedan crear complejos.

UPDATE profiles 
SET role = 'OWNER'
WHERE role != 'OWNER';

-- Verificación opcional
SELECT id, email, role FROM profiles;
