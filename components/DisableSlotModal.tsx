import React, { useState, useEffect, useRef } from 'react';

interface DisableSlotModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    timeSlot: string;
    courtName: string;
    date: string;
}

export const DisableSlotModal: React.FC<DisableSlotModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    timeSlot,
    courtName,
    date
}) => {
    const [reason, setReason] = useState('Mantenimiento');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(reason);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-in zoom-in-95 duration-200">
                <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Deshabilitar Horario
                    </h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <p className="text-gray-600 text-sm mb-2">Vas a bloquear el siguiente horario:</p>
                        <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 flex justify-between items-center text-sm font-medium text-indigo-900">
                            <span>{courtName}</span>
                            <span>{date} • {timeSlot}</span>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Motivo del bloqueo
                        </label>
                        <input
                            ref={inputRef}
                            type="text"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition"
                            placeholder="Ej: Mantenimiento, Lluvia, Clase..."
                        />
                        <p className="text-xs text-gray-400 mt-2">
                            Este motivo aparecerá en tu panel de control.
                        </p>
                    </div>

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/30 transition transform active:scale-95"
                        >
                            Bloquear Horario
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
