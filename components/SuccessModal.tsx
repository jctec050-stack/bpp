import React, { useEffect } from 'react';

interface SuccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    buttonText?: string;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    onClose,
    title,
    message,
    buttonText = 'Continuar'
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 text-center transform transition-all scale-100 animate-in zoom-in-95 duration-300 relative overflow-hidden">

                {/* Decorative background element */}
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>

                <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">
                    {title}
                </h3>

                <p className="text-gray-500 font-medium mb-8 leading-relaxed">
                    {message}
                </p>

                <button
                    onClick={onClose}
                    className="w-full py-3.5 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg shadow-green-200 transform hover:-translate-y-0.5"
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
};
