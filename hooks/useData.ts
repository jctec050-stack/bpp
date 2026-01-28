import useSWR from 'swr';
import { getVenues, getBookings, getDisabledSlots } from '@/services/dataService';
import { Venue, Booking, DisabledSlot } from '@/types';

// Fetcher functions
const venuesFetcher = () => getVenues();
const bookingsFetcher = () => getBookings();
const disabledSlotsFetcher = (key: string[]) => {
    const [_, venueId, date] = key;
    return getDisabledSlots(venueId, date);
};

export function useVenues() {
    const { data, error, isLoading, mutate } = useSWR<Venue[]>('venues', venuesFetcher, {
        revalidateOnFocus: false, // Don't revalidate on window focus for static-ish data
        dedupingInterval: 60000, // Cache for 1 minute
    });

    return {
        venues: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

export function useOwnerVenues(ownerId: string | undefined) {
    const { data, error, isLoading, mutate } = useSWR<Venue[]>(
        ownerId ? ['venues', ownerId] : null,
        () => getVenues(ownerId),
        {
            revalidateOnFocus: false,
            dedupingInterval: 60000,
        }
    );

    return {
        venues: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

export function useBookings() {
    // Fetches all bookings (used for availability checking in Home and list in Bookings)
    // Note: This might need optimization to filter by date range in the future
    const { data, error, isLoading, mutate } = useSWR<Booking[]>('bookings', bookingsFetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 10000, // 10 seconds
    });

    return {
        bookings: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

export function useOwnerBookings(ownerId: string | undefined) {
    const { data, error, isLoading, mutate } = useSWR<Booking[]>(
        ownerId ? ['bookings', ownerId] : null,
        () => getBookings(ownerId),
        {
            revalidateOnFocus: true,
            dedupingInterval: 10000,
        }
    );

    return {
        bookings: data || [],
        isLoading,
        isError: error,
        mutate
    };
}

export function usePlayerBookings(userId?: string) {
    const { bookings, isLoading, isError, mutate } = useBookings();

    // Derived state
    const playerBookings = userId ? bookings.filter(b => b.player_id === userId) : [];

    return {
        bookings: playerBookings,
        isLoading,
        isError,
        mutate
    };
}

export function useDisabledSlots(venueId: string | null, date: string | null) {
    const shouldFetch = venueId && date;
    const { data, error, isLoading, mutate } = useSWR<DisabledSlot[]>(
        shouldFetch ? ['disabledSlots', venueId, date] : null,
        disabledSlotsFetcher as any, // Type casting to satisfy SWR generic
        {
            revalidateOnFocus: false,
        }
    );

    return {
        disabledSlots: data || [],
        isLoading,
        isError: error,
        mutate
    };
}
