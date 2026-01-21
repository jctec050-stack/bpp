-- 1. Fix Booking Status Constraint
-- We need to drop the old check and add the new one including 'COMPLETED'
alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings add constraint bookings_status_check 
  check (status in ('ACTIVE', 'CANCELLED', 'COMPLETED'));

-- 2. Fix Booking RLS (Permissions)
-- Enable RLS just in case
alter table public.bookings enable row level security;

-- Drop old policies to avoid duplicates/conflicts
drop policy if exists "Players can update own bookings" on public.bookings;
drop policy if exists "Owners can update bookings for their venues" on public.bookings;
drop policy if exists "Players can insert own bookings" on public.bookings;

-- Create correct policies
create policy "Players can update own bookings" on public.bookings
  for update using (auth.uid() = player_id);

create policy "Owners can update bookings for their venues" on public.bookings
  for update using (
    exists (
      select 1 from public.venues
      where venues.id = bookings.venue_id
      and venues.owner_id = auth.uid()
    )
  );

create policy "Players can insert own bookings" on public.bookings
  for insert with check (auth.uid() = player_id);


-- 3. Fix Venue RLS (Permissions for Editing)
alter table public.venues enable row level security;

drop policy if exists "Owners can update own venues" on public.venues;
create policy "Owners can update own venues" on public.venues
  for update using (auth.uid() = owner_id);

drop policy if exists "Owners can insert own venues" on public.venues;
create policy "Owners can insert own venues" on public.venues
  for insert with check (auth.uid() = owner_id);
