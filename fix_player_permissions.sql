-- Enable RLS logic for Players to fully manage their bookings

-- 1. Allow Players to UPDATE their own bookings (e.g., to Cancel)
drop policy if exists "Players can update own bookings" on public.bookings;
create policy "Players can update own bookings" on public.bookings
  for update using (auth.uid() = player_id);

-- 2. Allow Players to DELETE their own bookings (e.g. cleanup cancelled ones)
drop policy if exists "Players can delete own bookings" on public.bookings;
create policy "Players can delete own bookings" on public.bookings
  for delete using (auth.uid() = player_id);

-- 3. Ensure INSERT works too
drop policy if exists "Players can insert own bookings" on public.bookings;
create policy "Players can insert own bookings" on public.bookings
  for insert with check (auth.uid() = player_id);
