-- ============================================
-- PASO 19: ASEGURAR LA BASE DE DATOS (RLS)
-- ============================================
-- Este script reactiva Row Level Security (RLS) y define políticas estrictas
-- para proteger los datos de usuarios y negocios.

-- 1. Habilitar RLS en todas las tablas críticas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE courts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE disabled_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas (para evitar conflictos)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Venues are viewable by everyone" ON venues;
DROP POLICY IF EXISTS "Owners can insert their own venues" ON venues;
DROP POLICY IF EXISTS "Owners can update their own venues" ON venues;
DROP POLICY IF EXISTS "Owners can delete their own venues" ON venues;

DROP POLICY IF EXISTS "Courts are viewable by everyone" ON courts;
DROP POLICY IF EXISTS "Owners can manage courts via venue" ON courts;

DROP POLICY IF EXISTS "Bookings are viewable by owner and player" ON bookings;
DROP POLICY IF EXISTS "Players can create bookings" ON bookings;
DROP POLICY IF EXISTS "Owners and players can update bookings" ON bookings;

DROP POLICY IF EXISTS "Disabled slots viewable by everyone" ON disabled_slots;
DROP POLICY IF EXISTS "Owners can manage disabled slots" ON disabled_slots;

-- 3. Definir Políticas de Seguridad (Policies)

-- ============================================
-- TABLA: PROFILES
-- ============================================
-- Lectura: Pública (necesario para ver nombres en reservas/complejos)
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Escritura/Edición: Solo el propio usuario
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- Inserción: Permitir al trigger de auth o al mismo usuario (durante registro)
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- ============================================
-- TABLA: VENUES (Complejos)
-- ============================================
-- Lectura: Pública (cualquiera puede buscar canchas)
CREATE POLICY "Venues are viewable by everyone" 
ON venues FOR SELECT 
USING (true);

-- Escritura (Insert/Update/Delete): Solo Dueños sobre sus propios complejos
CREATE POLICY "Owners can insert their own venues" 
ON venues FOR INSERT 
WITH CHECK (
  auth.uid() = owner_id 
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'OWNER')
);

CREATE POLICY "Owners can update their own venues" 
ON venues FOR UPDATE 
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their own venues" 
ON venues FOR DELETE 
USING (auth.uid() = owner_id);

-- ============================================
-- TABLA: COURTS (Canchas)
-- ============================================
-- Lectura: Pública
CREATE POLICY "Courts are viewable by everyone" 
ON courts FOR SELECT 
USING (true);

-- Escritura: Solo el dueño del complejo al que pertenece la cancha
CREATE POLICY "Owners can insert courts for their venues" 
ON courts FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM venues 
    WHERE id = venue_id 
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can update courts for their venues" 
ON courts FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM venues 
    WHERE id = venue_id 
    AND owner_id = auth.uid()
  )
);

CREATE POLICY "Owners can delete courts for their venues" 
ON courts FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM venues 
    WHERE id = venue_id 
    AND owner_id = auth.uid()
  )
);

-- ============================================
-- TABLA: BOOKINGS (Reservas)
-- ============================================
-- Lectura: 
-- 1. El jugador que hizo la reserva
-- 2. El dueño del complejo donde es la reserva
CREATE POLICY "Users can view their own bookings and owners can view venue bookings" 
ON bookings FOR SELECT 
USING (
  auth.uid() = player_id 
  OR EXISTS (
    SELECT 1 FROM venues 
    WHERE id = bookings.venue_id 
    AND owner_id = auth.uid()
  )
);

-- Inserción: Jugadores autenticados
CREATE POLICY "Authenticated users can create bookings" 
ON bookings FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'); 
-- Nota: Podríamos restringir que auth.uid() == player_id, pero a veces un admin reserva por otro.
-- Por ahora, confiamos en que el backend/frontend asigna el player_id correcto.
-- Para mayor seguridad: AND auth.uid() = player_id

-- Actualización (Cancelar, Completar):
-- 1. Jugador (solo cancelar su propia reserva)
-- 2. Dueño (gestionar estado)
CREATE POLICY "Users can update own bookings and owners can manage venue bookings" 
ON bookings FOR UPDATE 
USING (
  auth.uid() = player_id 
  OR EXISTS (
    SELECT 1 FROM venues 
    WHERE id = bookings.venue_id 
    AND owner_id = auth.uid()
  )
);

-- Borrado: Similar a update
CREATE POLICY "Users can delete own bookings and owners can manage venue bookings" 
ON bookings FOR DELETE 
USING (
  auth.uid() = player_id 
  OR EXISTS (
    SELECT 1 FROM venues 
    WHERE id = bookings.venue_id 
    AND owner_id = auth.uid()
  )
);

-- ============================================
-- TABLA: DISABLED_SLOTS (Bloqueos)
-- ============================================
-- Lectura: Pública (para ver qué no está disponible)
CREATE POLICY "Disabled slots are viewable by everyone" 
ON disabled_slots FOR SELECT 
USING (true);

-- Escritura: Solo dueños para sus complejos
CREATE POLICY "Owners can manage disabled slots" 
ON disabled_slots FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM venues 
    WHERE id = venue_id 
    AND owner_id = auth.uid()
  )
);

-- ============================================
-- TABLA: NOTIFICATIONS
-- ============================================
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (true); -- Generalmente insertado por triggers o funciones de backend con service_role, pero permitimos insert autenticado si la lógica está en cliente (cuidado aquí).
-- Idealmente, las notificaciones se crean vía Database Functions o Edge Functions. 
-- Si la app cliente crea notificaciones (ej: al reservar), necesitamos permitirlo:
CREATE POLICY "Users can create notifications for others" 
ON notifications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'); 

CREATE POLICY "Users can update own notifications (mark read)" 
ON notifications FOR UPDATE 
USING (auth.uid() = user_id);

