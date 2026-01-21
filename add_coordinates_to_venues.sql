-- Add latitude and longitude columns to venues table
ALTER TABLE venues 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add index for geospatial queries (optional, for future optimization)
CREATE INDEX IF NOT EXISTS idx_venues_coordinates ON venues(latitude, longitude);
