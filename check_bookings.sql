-- CHECK BOOKINGS
SELECT count(*) as total_bookings FROM bookings;

SELECT b.id, b.venue_id, b.date, b.status, p.full_name as player_name 
FROM bookings b
LEFT JOIN profiles p ON b.player_id = p.id;

-- CHECK PROFILES RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'profiles';
