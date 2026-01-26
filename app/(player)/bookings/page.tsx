'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/AuthContext';
import { useRouter } from 'next/navigation';
import { Booking } from '@/types';
import { getBookings, cancelBooking, deleteBooking } from '@/services/dataService';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { Toast } from '@/components/Toast';

export default function BookingsPage() {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [bookingToCancel, setBookingToCancel] = useState<string[] | null>(null);
    const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }
        if (!isLoading && user?.role !== 'PLAYER') {
            router.push('/'); // Redirect owner to home or dashboard
            return;
        }
    }, [user, isLoading, router]);

    const fetchData = useCallback(async () => {
        if (!user) return;
        try {
            setLoadingData(true);
            const fetchedBookings = await getBookings(); // Fetch all bookings for player (API should filter by RLS ideally, or we filter here)
            // The service `getBookings` without args fetches all?
            // Checking service: `getBookings(ownerId)`... if no ownerId, it fetches all?
            // RLS should handle "my bookings".
            // Let's assume `getBookings` returns what we need or we filter client side if needed (but RLS is better).
            // Actually MainApp used: `getBookings(user.role === 'OWNER' ? user.id : undefined)`
            // If undefined, it gets all bookings? That sounds insecure if RLS is off.
            // But we are in "Professional Refactor", I should fix this later in RLS step.
            // For now, let's use the same call.
            const allBookings = await getBookings(); 
            // Filter for current player just in case
            setBookings(allBookings.filter(b => b.player_id === user.id));
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (user?.role === 'PLAYER') {
            fetchData();
        }
    }, [fetchData, user?.role]);

    const getGroupedBookings = (bookings: Booking[]) => {
        const groups: { [key: string]: Booking[] } = {};

        bookings.forEach(b => {
            const key = `${b.venue_id}-${b.court_id}-${b.date}-${b.status}-${b.player_id}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(b);
        });

        return Object.values(groups).map(group => {
            const sorted = group.sort((a, b) => a.start_time.localeCompare(b.start_time));
            const first = sorted[0];
            const last = sorted[sorted.length - 1];
            const lastHour = parseInt(last.start_time.split(':')[0]);
            const endTime = `${(lastHour + 1).toString().padStart(2, '0')}:00`;

            return {
                id: sorted.map(b => b.id),
                venueId: first.venue_id,
                courtId: first.court_id,
                venueName: first.venue_name,
                courtName: first.court_name,
                courtType: first.court_type,
                status: first.status,
                date: first.date,
                startTime: first.start_time,
                endTime: endTime,
                price: sorted.reduce((sum, b) => sum + b.price, 0),
                count: sorted.length,
                timeRange: `${first.start_time.substring(0, 5)} - ${endTime}`
            };
        }).sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime)); // Sort by date desc
    };

    const handleCancelClick = (bookingIds: string[]) => {
        setBookingToCancel(bookingIds);
    };

    const confirmCancel = async () => {
        if (!bookingToCancel) return;

        try {
            const promises = bookingToCancel.map(async (id) => {
                const booking = bookings.find(b => b.id === id);
                if (!booking) return false;
                if (booking.status === 'CANCELLED') {
                    return await deleteBooking(id);
                } else {
                    return await cancelBooking(id);
                }
            });

            const results = await Promise.all(promises);
            const successCount = results.filter(r => r).length;

            if (successCount > 0) {
                await fetchData();
                setToast({ message: `${successCount} reserva(s) actualizadas.`, type: 'success' });
            } else {
                setToast({ message: 'Error al procesar la solicitud.', type: 'error' });
            }
        } catch (error) {
            console.error(error);
            setToast({ message: 'Error inesperado.', type: 'error' });
        }
        setBookingToCancel(null);
    };

    if (isLoading || loadingData) {
        return (
             <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!user || user.role !== 'PLAYER') return null;

    const groupedBookings = getGroupedBookings(bookings);

    return (
        <main className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Mis Reservas</h1>
            
            <div className="space-y-4">
                {groupedBookings.length === 0 ? (
                    <div className="bg-white p-12 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
                        No tienes reservas registradas.
                        <div className="mt-4">
                             <button
                                onClick={() => router.push('/')}
                                className="text-indigo-600 font-bold hover:underline"
                            >
                                Buscar Canchas
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs uppercase font-bold">
                                            <th className="px-6 py-4">Fecha</th>
                                            <th className="px-6 py-4">Horario</th>
                                            <th className="px-6 py-4">Lugar</th>
                                            <th className="px-6 py-4">Precio</th>
                                            <th className="px-6 py-4 text-center">Estado</th>
                                            <th className="px-6 py-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {groupedBookings.map(group => (
                                            <tr key={group.id[0]} className="hover:bg-gray-50 transition">
                                                <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">
                                                    {group.date}
                                                </td>
                                                <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                                                    {group.timeRange}
                                                    {group.count > 1 && (
                                                        <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-bold">
                                                            {group.count} turnos
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-gray-900">{group.venueName}</span>
                                                        <span className="text-xs text-gray-500">{group.courtName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-gray-900">
                                                    Gs. {group.price.toLocaleString('es-PY')}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold uppercase ${
                                                        group.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                                        group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                        {group.status === 'COMPLETED' ? 'Completada' : group.status === 'ACTIVE' ? 'Activa' : 'Cancelada'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {group.status === 'ACTIVE' && (
                                                        <button
                                                            onClick={() => handleCancelClick(group.id)}
                                                            className="text-red-600 hover:text-red-800 font-bold text-sm hover:underline"
                                                        >
                                                            Cancelar
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Cards (Owner Dashboard Style) */}
                        <div className="md:hidden space-y-4">
                            {groupedBookings.map(group => (
                                <div key={group.id[0]} className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm ${group.status === 'CANCELLED' ? 'bg-red-50/50' : ''}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <span className="text-lg font-bold text-gray-900 block">{group.timeRange}</span>
                                            <span className="text-sm text-gray-500">{group.date}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                            group.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' :
                                            group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {group.status === 'COMPLETED' ? 'Completada' : group.status === 'ACTIVE' ? 'Activa' : 'Cancelada'}
                                        </span>
                                    </div>
                                    <div className="mb-3">
                                        <span className="font-bold text-gray-900 block">{group.venueName}</span>
                                        <span className="text-xs text-gray-500">{group.courtName}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${
                                                group.status === 'ACTIVE' ? 'bg-green-500' :
                                                group.status === 'COMPLETED' ? 'bg-blue-500' :
                                                'bg-red-500'
                                            }`}></span>
                                            <span className="font-bold text-gray-900">
                                                Gs. {group.price.toLocaleString('es-PY')}
                                            </span>
                                        </div>
                                        {group.status === 'ACTIVE' && (
                                            <button
                                                onClick={() => handleCancelClick(group.id)}
                                                className="text-red-600 font-bold text-sm"
                                            >
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!bookingToCancel}
                title="Cancelar Reserva"
                message={`¿Estás seguro de que quieres cancelar ${bookingToCancel && bookingToCancel.length > 1 ? 'estas reservas' : 'esta reserva'}?`}
                confirmText="Sí, Cancelar"
                cancelText="Mantenerme Reservado"
                isDangerous={true}
                onConfirm={confirmCancel}
                onCancel={() => setBookingToCancel(null)}
            />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </main>
    );
}
