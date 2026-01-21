-- Enable RLS for venues if not already enabled (safety check)
alter table public.venues enable row level security;

-- Drop implementation if it exists to clean up
drop policy if exists "Owners can update own venues" on public.venues;

-- Create the policy explicitly
create policy "Owners can update own venues" on public.venues
  for update using (auth.uid() = owner_id);

-- Verify/Add insert policy just in case
drop policy if exists "Owners can insert own venues" on public.venues;
create policy "Owners can insert own venues" on public.venues
  for insert with check (auth.uid() = owner_id);
