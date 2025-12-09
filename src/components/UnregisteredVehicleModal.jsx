import React, { useState, useEffect } from 'react';
import { Car, AlertTriangle, Save, Loader2, X } from 'lucide-react';
import { createVehicle } from '../utils/api';

const UnregisteredVehicleModal = ({ isOpen, onClose, searchDigits, onRegister }) => {
    const [frontPlate, setFrontPlate] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setFrontPlate('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!frontPlate.trim()) {
            alert('차량번호 앞자리를 입력해주세요.');
            return;
        }

        const fullPlate = `${frontPlate.trim()} ${searchDigits}`;

        setIsSubmitting(true);
        try {
            const newVehicle = {
                plateNumber: fullPlate,
                ownerName: '확인불가',
                dong: '?',
                ho: '?',
                phoneNumber: '',
                type: 'unidentified'
            };

            const createdVehicle = await createVehicle(newVehicle);
            onRegister(createdVehicle);
            onClose();
        } catch (error) {
            console.error("Failed to register vehicle:", error);
            alert('차량 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-200 transition-colors">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        미등록 차량 등록
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                        검색된 차량이 없습니다.<br />
                        신고를 위해 차량번호 앞자리를 입력하여 등록해주세요.
                    </p>

                    <form onSubmit={handleSubmit}>
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <div className="relative w-32">
                                <input
                                    type="text"
                                    value={frontPlate}
                                    onChange={(e) => setFrontPlate(e.target.value)}
                                    placeholder="12가"
                                    className="w-full text-center text-2xl font-black p-3 bg-gray-50 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none rounded-t-lg transition-colors text-gray-900 dark:text-white"
                                    autoFocus
                                />
                                <label className="block text-xs text-center text-gray-400 mt-1">앞자리</label>
                            </div>
                            <span className="text-2xl font-black text-gray-300 dark:text-gray-600">-</span>
                            <div className="relative w-32">
                                <div className="w-full text-center text-2xl font-black p-3 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-b-2 border-gray-200 dark:border-gray-700 rounded-t-lg">
                                    {searchDigits}
                                </div>
                                <label className="block text-xs text-center text-gray-400 mt-1">뒷자리</label>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                            {isSubmitting ? '등록 중...' : '등록 후 신고하기'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UnregisteredVehicleModal;
