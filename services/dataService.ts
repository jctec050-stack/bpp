import { supabase } from '@/lib/supabase';
import { Venue, Court, Booking, DisabledSlot, Profile, Subscription, Payment, Notification } from '@/types';
import { venueFromDB, bookingFromDB, disabledSlotFromDB } from '@/utils/adapters';

// ============================================
// HELPER: Upload Image to Supabase Storage
// ============================================
export const uploadImage = async (
    file: File,
    bucket: 'venue-images' | 'court-images' | 'court-photos',
    path: string
): Promise<string | null> => {
    try {
        console.log(`📤 Uploading image to ${bucket}/${path}`);
        console.log(`ℹ️ File details: type=${file.type}, size=${file.size} bytes`);

        // Create a timeout promise (15 seconds)
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Upload request timed out (15s)')), 15000)
        );

        // Upload file with race against timeout
        const uploadPromise = supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: false // Changed to false to avoid potential locking issues
            });

        const result: any = await Promise.race([uploadPromise, timeoutPromise]);

        const { data, error } = result;

        if (error) {
            console.error('❌ Upload error details:', error);
            return null;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        console.log('✅ Image uploaded successfully:', publicUrl);
        return publicUrl;
    } catch (error) {
        console.error('❌ Exception uploading image:', error);
        return null; // Return null handled gracefully by UI
    }
};

// ============================================
// VENUES
// ============================================

export const getVenues = async (): Promise<Venue[]> => {
    try {
        const { data, error } = await supabase
            .from('venues')
            .select(`
                *,
                courts (*)
            `)
            .eq('is_active', true)
            .order('name');

        if (error) throw error;

        return (data || []).map(venueFromDB);
    } catch (error) {
        console.error('❌ Error fetching venues:', error);
        return [];
    }
};

export const getOwnerVenues = async (ownerId: string): Promise<Venue[]> => {
    if (!ownerId) {
        console.error('❌ getOwnerVenues called without ownerId');
        return [];
    }

    try {
        const { data, error } = await supabase
            .from('venues')
            .select(`
                *,
                courts (*)
            `)
            .eq('owner_id', ownerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(venueFromDB);
    } catch (error) {
        console.error('❌ Error fetching owner venues:', error);
        return [];
    }
};

export const createVenue = async (venue: Omit<Venue, 'id' | 'courts'>): Promise<Venue | null> => {
    try {
        // Geocoding logic would go here if needed server-side
        // But we handle it in frontend

        const { data, error } = await supabase
            .from('venues')
            .insert(venue)
            .select()
            .single();

        if (error) {
            console.error('❌ Error creating venue:', error);
            // Log RLS error details if present
            if (error.code === '42501') {
                console.error('🚫 Permission Denied (RLS): Ensure User is OWNER and Policies match.');
            }
            throw error;
        }

        return venueFromDB(data);
    } catch (error) {
        console.error('❌ Error creating venue:', error);
        // Do not swallow error, rethrow to handle in UI
        throw error;
    }
};

export const createVenueWithCourts = async (
    venueData: Omit<Venue, 'id' | 'courts'>,
    newCourts: Omit<Court, 'id'>[]
): Promise<boolean> => {
    try {
        // 1. Create Venue
        const createdVenue = await createVenue(venueData);

        if (!createdVenue) return false;

        // 2. Add Courts if any
        if (newCourts.length > 0) {
            await addCourts(createdVenue.id, newCourts);
        }

        return true;
    } catch (error) {
        console.error('❌ Error in createVenueWithCourts:', error);
        return false;
    }
};

export const updateVenue = async (id: string, updates: Partial<Venue>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('venues')
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error updating venue:', error);
        return false;
    }
};

export const deleteVenue = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('venues')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting venue:', error);
        return false;
    }
};

// ============================================
// COURTS
// ============================================

export const addCourts = async (venueId: string, courts: Omit<Court, 'id'>[]) => {
    try {
        const courtsToInsert = await Promise.all(courts.map(async (court) => {
            let image_url = court.image_url;
            const imageFile = (court as any).imageFile; // Access temporary file property if exists

            // Upload image if provided
            if (imageFile) {
                const cleanFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
                const path = `courts/${venueId}/${Date.now()}_${cleanFileName}`;
                const uploadedUrl = await uploadImage(imageFile, 'venue-images', path); // Use venue-images as fallback
                image_url = uploadedUrl || '';
            }

            return {
                venue_id: venueId,
                name: court.name,
                type: court.type,
                price_per_hour: court.price_per_hour,
                is_active: court.is_active ?? true,
                image_url: image_url
            };
        }));

        const { error } = await supabase
            .from('courts')
            .insert(courtsToInsert);

        if (error) throw error;
    } catch (error) {
        console.error('❌ Error adding courts:', error);
        throw error;
    }
};

export const updateCourt = async (courtId: string, updates: Partial<Court>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('courts')
            .update(updates)
            .eq('id', courtId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error updating court:', error);
        return false;
    }
};

export const deleteCourt = async (courtId: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('courts')
            .delete()
            .eq('id', courtId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting court:', error);
        return false;
    }
};

// ============================================
// BOOKINGS
// ============================================

export const getVenueBookings = async (venueId: string, date: string): Promise<Booking[]> => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                profiles:player_id (full_name, email, phone) 
            `)
            .eq('venue_id', venueId)
            .eq('date', date)
            .order('start_time');

        if (error) throw error;
        return (data || []).map(bookingFromDB);
    } catch (error) {
        console.error('❌ Error fetching bookings:', error);
        return [];
    }
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking | null> => {
    try {
        const { data, error } = await supabase
            .from('bookings')
            .insert(booking)
            .select()
            .single();

        if (error) throw error;
        return bookingFromDB(data);
    } catch (error) {
        console.error('❌ Error creating booking:', error);
        return null;
    }
};

export const updateBookingStatus = async (id: string, status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error updating booking status:', error);
        return false;
    }
};

export const deleteBooking = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting booking:', error);
        return false;
    }
};


// ============================================
// DISABLED SLOTS
// ============================================

export const getDisabledSlots = async (venueId: string, date: string): Promise<DisabledSlot[]> => {
    try {
        const { data, error } = await supabase
            .from('disabled_slots')
            .select('*')
            .eq('venue_id', venueId)
            .eq('date', date);

        if (error) throw error;
        return (data || []).map(disabledSlotFromDB);
    } catch (error) {
        console.error('❌ Error fetching disabled slots:', error);
        return [];
    }
};

export const createDisabledSlot = async (slot: Omit<DisabledSlot, 'id'>): Promise<DisabledSlot | null> => {
    try {
        const { data, error } = await supabase
            .from('disabled_slots')
            .insert(slot)
            .select()
            .single();

        if (error) throw error;
        return disabledSlotFromDB(data);
    } catch (error) {
        console.error('❌ Error creating disabled slot:', error);
        return null;
    }
};

export const deleteDisabledSlot = async (id: string): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('disabled_slots')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error deleting disabled slot:', error);
        return false;
    }
};

// ============================================
// PROFILE
// ============================================
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error) {
            // If error is row not found, return null (it might be created later via trigger)
            if (error.code === 'PGRST116') return null;
            throw error;
        }
        return data as Profile;
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        return null;
    }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('❌ Error updating profile:', error);
        return false;
    }
};

// ============================================
// UPLOAD COURT IMAGE WRAPPER
// ============================================
export const uploadCourtImage = async (file: File, courtId: string): Promise<string | null> => {
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const path = `courts/${courtId}_${Date.now()}_${cleanFileName}`;
    // Use 'venue-images' because it is confirmed to work
    return await uploadImage(file, 'venue-images', path);
};
