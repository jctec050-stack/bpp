-- Drop the restrictive policy
drop policy if exists "Players can read own bookings" on public.bookings;

-- Create a new permissive policy for visibility
-- This allows any authenticated user to see all bookings, which is necessary to calculate availability.
create policy "Bookings are viewable by everyone" on public.bookings
  for select using (true);
