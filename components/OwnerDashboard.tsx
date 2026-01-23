
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Booking, Venue } from '../types';


interface OwnerDashboardProps {
  bookings: Booking[];
  venue: Venue;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ bookings, venue, selectedDate, onDateChange }) => {
  // Internal state removed, using props now

  // Filter bookings for the specific selected date
  const dailyBookings = bookings.filter(b => b.date === selectedDate);
  const dailyActiveBookings = dailyBookings.filter(b => b.status === 'ACTIVE' || b.status === 'COMPLETED');
  const dailyRevenue = dailyActiveBookings.reduce((sum, b) => sum + b.price, 0);

  // Calculate comparisons (vs previous day)
  const prevDateObj = new Date(selectedDate);
  prevDateObj.setDate(prevDateObj.getDate() - 1);
  const prevDate = prevDateObj.toISOString().split('T')[0];

  const prevDayBookings = bookings.filter(b => b.date === prevDate && (b.status === 'ACTIVE' || b.status === 'COMPLETED'));
  const prevDayRevenue = prevDayBookings.reduce((sum, b) => sum + b.price, 0);

  const revenueGrowth = prevDayRevenue === 0 ? 100 : ((dailyRevenue - prevDayRevenue) / prevDayRevenue) * 100;

  // Chart Data: Last 7 days ending on selected date
  const chartData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];

    const dayRevenue = bookings
      .filter(b => b.date === dStr && (b.status === 'ACTIVE' || b.status === 'COMPLETED'))
      .reduce((sum, b) => sum + b.price, 0);

    chartData.push({ name: dStr, revenue: dayRevenue });
  }

  // Pie Chart: Distribution for the selected date
  const sportDistribution = dailyActiveBookings.reduce((acc: any[], b) => {
    const sport = (b.court_name || '').includes('Beach') ? 'Beach Tennis' : 'Padel';
    const existing = acc.find(item => item.name === sport);
    if (existing) {
      existing.value += 1;
    } else {
      acc.push({ name: sport, value: 1 });
    }
    return acc;
  }, []);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* Date Filter Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800">Resumen Diario</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - 1);
              onDateChange(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
          >
            ←
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="font-bold text-gray-700 border-none focus:ring-0 cursor-pointer bg-transparent"
          />
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + 1);
              onDateChange(d.toISOString().split('T')[0]);
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-500"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Ingresos ({selectedDate})</p>
          <h4 className="text-3xl font-bold text-gray-900 mt-1">Gs. {dailyRevenue.toLocaleString('es-PY')}</h4>
          <span className={`text-xs font-semibold ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth).toFixed(1)}% vs ayer
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Reservas Activas</p>
          <h4 className="text-3xl font-bold text-gray-900 mt-1">{dailyActiveBookings.length}</h4>
          <span className="text-blue-500 text-xs font-semibold">Para el {selectedDate}</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Cancelaciones</p>
          <h4 className="text-3xl font-bold text-gray-900 mt-1">{dailyBookings.filter(b => b.status === 'CANCELLED').length}</h4>
          <span className="text-red-500 text-xs font-semibold">En este día</span>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-sm font-medium">Canchas</p>
          <h4 className="text-3xl font-bold text-gray-900 mt-1">{venue.courts.length}</h4>
          <span className="text-gray-400 text-xs">{venue.name}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h5 className="text-lg font-bold text-gray-800 mb-6">Ingresos (Últimos 7 días hasta {selectedDate})</h5>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} tickFormatter={(val) => val.split('-')[2] + '/' + val.split('-')[1]} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(value: any) => [`Gs. ${(value || 0).toLocaleString('es-PY')}`, 'Ingresos']} />
                <Bar dataKey="revenue" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h5 className="text-lg font-bold text-gray-800 mb-6">Distribución por Deporte ({selectedDate})</h5>
          <div className="h-64 flex flex-col items-center">
            {sportDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={256}>
                  <PieChart>
                    <Pie data={sportDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                      {sportDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4 mt-2">
                  {sportDistribution.map((entry: any, index: number) => (
                    <div key={entry.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                      <span className="text-xs text-gray-600 font-medium">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No hay datos para este día
              </div>
            )}

          </div>
        </div>
      </div>


    </div>
  );
};
