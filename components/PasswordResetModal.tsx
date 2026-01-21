'use client';

import React, { useState } from 'react';

interface PasswordResetModalProps {
    onClose: () => void;
    onSubmit: (email: string) => Promise<void>;
}

export const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onClose, onSubmit }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setLoading(true);
        try {
            await onSubmit(email);
            setSent(true);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {!sent ? (
                    <>
                        {/* Header */}
                        <div className="text-center mb-6">
                            <div className="inline-block p-3 bg-indigo-100 rounded-full mb-4">
                                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">¿Olvidaste tu contraseña?</h2>
                            <p className="text-gray-500 text-sm">
                                Ingresa tu email y te enviaremos un link para recuperar tu cuenta.
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="reset-email" className="block text-sm font-bold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    id="reset-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3.5 md:py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-base"
                                    placeholder="tu@email.com"
                                    required
                                    autoFocus
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                            >
                                {loading ? 'Enviando...' : 'Enviar Email de Recuperación'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        {/* Success State */}
                        <div className="text-center py-4">
                            <div className="inline-block p-3 bg-green-100 rounded-full mb-4">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">¡Email Enviado!</h3>
                            <p className="text-gray-600 mb-6">
                                Revisa tu bandeja de entrada en <span className="font-bold text-indigo-600">{email}</span>
                            </p>
                            <p className="text-sm text-gray-500 mb-6">
                                Si no ves el email, revisa tu carpeta de spam.
                            </p>
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition"
                            >
                                Cerrar
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
