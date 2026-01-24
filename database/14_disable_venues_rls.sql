-- ============================================
-- ARREGLO DE EMERGENCIA: DESACTIVAR RLS EN VENUES
-- ============================================
-- Si las políticas siguen fallando, esto desactivará la seguridad RLS
-- SOLAMENTE en la tabla 'venues' para permitirte crear el complejo.

-- ADVERTENCIA: Esto permite que cualquiera (público) inserte venues si tuviera la URL.
-- Usar solo para desbloquear el error y luego volver a activar.

ALTER TABLE venues DISABLE ROW LEVEL SECURITY;

-- Si esto funciona, sabremos 100% que era una policy rebelde.
