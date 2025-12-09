import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, User, Home, Phone, Save, Loader2 } from 'lucide-react';
import { createVehicle } from '../utils/api';
import ExcelUploadModal from './ExcelUploadModal';

const RegistrationForm = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        plateNumber: '',
        ownerName: '',
        dong: '',
        ho: '',
        phoneNumber: '',
        type: 'resident'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Auto-format phone number
        if (name === 'phoneNumber') {
            const numbers = value.replace(/[^0-9]/g, '');
            let formatted = numbers;
            if (numbers.length > 3 && numbers.length <= 7) {
                formatted = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
            } else if (numbers.length > 7) {
                formatted = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
            }
            setFormData(prev => ({ ...prev, [name]: formatted }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.plateNumber || !formData.ownerName || !formData.dong || !formData.ho || !formData.phoneNumber) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        setIsSubmitting(true);
        try {
            await createVehicle(formData);
            alert('차량이 성공적으로 등록되었습니다.');
            navigate('/');
        } catch (error) {
            alert('차량 등록에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    차량 등록
                </h2>
                <button
                    onClick={() => setIsExcelModalOpen(true)}
                    className="text-sm bg-green-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-green-700 transition-colors"
                >
                    엑셀 일괄 등록
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">차량번호</label>
                    <div className="relative">
                        <Car className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            name="plateNumber"
                            value={formData.plateNumber}
                            onChange={handleChange}
                            placeholder="예: 12가 3456"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">동</label>
                        <div className="relative">
                            <Home className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                name="dong"
                                value={formData.dong}
                                onChange={handleChange}
                                placeholder="101"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">호</label>
                        <div className="relative">
                            <Home className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                            <input
                                type="text"
                                name="ho"
                                value={formData.ho}
                                onChange={handleChange}
                                placeholder="1004"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">차주명</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="text"
                            name="ownerName"
                            value={formData.ownerName}
                            onChange={handleChange}
                            placeholder="홍길동"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">전화번호</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                            type="tel"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            placeholder="010-0000-0000"
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        />
                    </div>
                </div>

                <div className="pt-2">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">차량 구분</label>
                    <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="resident"
                                checked={formData.type === 'resident'}
                                onChange={handleChange}
                                className="hidden peer"
                            />
                            <div className="py-3 text-center rounded-xl border-2 border-gray-200 dark:border-gray-600 peer-checked:border-blue-500 dark:peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/30 peer-checked:text-blue-700 dark:peer-checked:text-blue-400 font-bold text-gray-500 dark:text-gray-400 transition-all">
                                입주민
                            </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                            <input
                                type="radio"
                                name="type"
                                value="staff"
                                checked={formData.type === 'staff'}
                                onChange={handleChange}
                                className="hidden peer"
                            />
                            <div className="py-3 text-center rounded-xl border-2 border-gray-200 dark:border-gray-600 peer-checked:border-purple-500 dark:peer-checked:border-purple-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/30 peer-checked:text-purple-700 dark:peer-checked:text-purple-400 font-bold text-gray-500 dark:text-gray-400 transition-all">
                                직원
                            </div>
                        </label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2 mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                    {isSubmitting ? '등록 중...' : '차량 등록하기'}
                </button>
            </form>

            {isExcelModalOpen && (
                <ExcelUploadModal
                    isOpen={isExcelModalOpen}
                    onClose={() => setIsExcelModalOpen(false)}
                />
            )}
        </div>
    );
};

export default RegistrationForm;
