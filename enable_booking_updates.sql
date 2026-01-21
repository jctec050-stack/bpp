-- Allow Players to update their own bookings (e.g., cancel, or auto-complete trigger)
create policy "Players can update own bookings" on public.bookings
  for update using (auth.uid() = player_id);

-- Allow Owners to update bookings for their venues
create policy "Owners can update bookings for their venues" on public.bookings
  for update using (
    exists (
      select 1 from public.venues
      where venues.id = bookings.venue_id
      and venues.owner_id = auth.uid()
    )
  );

-- Allow Players to insert bookings (fixing the likely missing policy for creation)
create policy "Players can insert own bookings" on public.bookings
  for insert with check (auth.uid() = player_id);
