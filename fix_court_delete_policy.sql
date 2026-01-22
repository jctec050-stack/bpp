-- Fix RLS policies for courts table to allow deletion
-- This script fixes the Row Level Security policies to properly allow owners to delete courts

-- Drop ALL existing policies for courts table
DROP POLICY IF EXISTS "Owners can manage courts" ON public.courts;
DROP POLICY IF EXISTS "Courts are viewable by everyone" ON public.courts;
DROP POLICY IF EXISTS "Owners can insert courts" ON public.courts;
DROP POLICY IF EXISTS "Owners can update courts" ON public.courts;
DROP POLICY IF EXISTS "Owners can delete courts" ON public.courts;

-- Create separate policies for better control
-- Policy for SELECT (read)
CREATE POLICY "Courts are viewable by everyone" ON public.courts
  FOR SELECT USING (true);

-- Policy for INSERT (create)
CREATE POLICY "Owners can insert courts" ON public.courts
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = courts.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- Policy for UPDATE (modify)
CREATE POLICY "Owners can update courts" ON public.courts
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = courts.venue_id
      AND venues.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = courts.venue_id
      AND venues.owner_id = auth.uid()
    )
  );

-- Policy for DELETE (remove)
CREATE POLICY "Owners can delete courts" ON public.courts
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id = courts.venue_id
      AND venues.owner_id = auth.uid()
    )
  );
