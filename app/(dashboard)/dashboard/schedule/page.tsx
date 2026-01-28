'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/AuthContext';
import { useRouter } from 'next/navigation';
import { Venue, Booking, DisabledSlot } from '@/types';
import { toggleSlotAvailability } from '@/services/dataService';
import { useOwnerVenues, useOwnerBookings, useDisabledSlots } from '@/hooks/useData';
import { ScheduleManager } from '@/components/ScheduleManager';
import { Toast } from '@/components/Toast';

export default function SchedulePage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const { venues, isLoading: venuesLoading } = useOwnerVenues(user?.id);
    const { bookings, isLoading: bookingsLoading } = useOwnerBookings(user?.id);
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const { disabledSlots, isLoading: slotsLoading, mutate: mutateSlots } = useDisabledSlots(venues[0]?.id || null, selectedDate);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }
        if (!isLoading && user?.role !== 'OWNER') {
            router.push('/');
            return;
        }
    }, [user, isLoading, router]);

    const handleToggleSlot = async (courtId: string, date: string, timeSlot: string, reason?: string) => {
        if (!user || !venues[0]) return;

        const success = await toggleSlotAvailability(venues[0].id, courtId, date, timeSlot, reason);

        if (success) {
            await mutateSlots();
        } else {
            setToast({ message: "Error al actualizar el horario.", type: 'error' });
        }
    };

    if (isLoading || venuesLoading || bookingsLoading || (venues.length > 0 && slotsLoading)) {
        return (
             <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user || user.role !== 'OWNER') return null;

     if (venues.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-8">
                 <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">No tienes complejos</h3>
                    <button
                        onClick={() => router.push('/dashboard/venues')}
                        className="text-indigo-600 font-bold hover:underline"
                    >
                        Crear uno ahora
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Gestión de Horarios</h1>
            <ScheduleManager
                venue={venues[0]}
                bookings={bookings}
                disabledSlots={disabledSlots}
                onToggleSlot={handleToggleSlot}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
            />
             {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
    );
}
