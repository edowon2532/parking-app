import React, { useState, useEffect } from 'react';
import { Search, Car, AlertTriangle, X, Home, User, Delete, Plus } from 'lucide-react';
import { fetchVehicles } from '../utils/api';
import VehicleActionCard from './VehicleActionCard';
import UnregisteredVehicleModal from './UnregisteredVehicleModal';

const VehicleList = () => {
    const [vehicles, setVehicles] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all', 'registered', 'unregistered'
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [loading, setLoading] = useState(true);

    const [showUnregisteredModal, setShowUnregisteredModal] = useState(false);

    useEffect(() => {
        loadVehicles();
    }, []);

    const unidentifiedCount = vehicles.filter(v => v.type === 'unidentified').length;
    const registeredCount = vehicles.length - unidentifiedCount;

    // Filter by type first
    const typeFilteredVehicles = vehicles.filter(vehicle => {
        if (filterType === 'all') return true;
        if (filterType === 'registered') return vehicle.type !== 'unidentified';
        if (filterType === 'unregistered') return vehicle.type === 'unidentified';
        return true;
    });

    // Then filter by search term
    const filteredVehicles = typeFilteredVehicles.filter(vehicle => {
        const cleanPlate = vehicle.plateNumber.replace(/\s/g, '');
        return cleanPlate.endsWith(searchTerm);
    });

    useEffect(() => {
        if (searchTerm.length === 4 && filteredVehicles.length === 0 && filterType === 'all') {
            setShowUnregisteredModal(true);
        }
    }, [searchTerm, filteredVehicles.length, filterType]);

    const handleFilterClick = (type) => {
        if (filterType === type) {
            setFilterType('all');
        } else {
            setFilterType(type);
        }
    };

    const loadVehicles = async () => {
        setLoading(true);
        const data = await fetchVehicles();
        setVehicles(data);
        setLoading(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleClear = () => {
        setSearchTerm('');
    };

    const handleKeypadClick = (num) => {
        if (searchTerm.length < 4) {
            setSearchTerm(prev => prev + num);
        }
    };

    const handleBackspace = () => {
        setSearchTerm(prev => prev.slice(0, -1));
    };

    const refreshData = async () => {
        const data = await fetchVehicles();
        setVehicles(data);
        // Refresh selected vehicle if it exists
        if (selectedVehicle) {
            const updated = data.find(v => v.id === selectedVehicle.id);
            setSelectedVehicle(updated || null);
        }
    };



    if (loading) {
        return <div className="flex justify-center p-10">Loading...</div>;
    }



    const handleUnregisteredRegister = (newVehicle) => {
        // Refresh data to include the new vehicle
        refreshData().then(() => {
            // Open the detail modal for the new vehicle
            // Note: We might need to find it in the refreshed list, or just use the object returned
            // Since refreshData updates state asynchronously, we might need to rely on the fact that 
            // the new vehicle will be in the list.
            // However, for immediate feedback, we can set it directly if we trust the return.
            // But better to fetch fresh data.
            // Let's just set it.
            setSelectedVehicle(newVehicle);
        });
    };

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div
                    onClick={() => handleFilterClick('registered')}
                    className={`bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border flex flex-row justify-between items-center transition-all cursor-pointer ${filterType === 'registered'
                        ? 'border-blue-500 ring-2 ring-blue-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500'
                        }`}
                >
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">등록 차량</span>
                    <span className="text-xl font-black text-blue-600 dark:text-blue-400">{registeredCount}대</span>
                </div>
                <div
                    onClick={() => handleFilterClick('unregistered')}
                    className={`bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border flex flex-row justify-between items-center transition-all cursor-pointer ${filterType === 'unregistered'
                        ? 'border-red-500 ring-2 ring-red-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-red-300 dark:hover:border-red-500'
                        }`}
                >
                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">미등록 차량</span>
                    <span className="text-xl font-black text-red-500 dark:text-red-400">{unidentifiedCount}대</span>
                </div>
            </div>

            {/* Display Area */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 text-center transition-colors">
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">차량번호 뒷 4자리 입력</p>
                <div className="text-5xl font-black tracking-widest text-gray-800 dark:text-white h-16 flex items-center justify-center">
                    {searchTerm || <span className="text-gray-200 dark:text-gray-700">0000</span>}
                </div>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <button
                        key={num}
                        onClick={() => handleKeypadClick(num)}
                        className="bg-white dark:bg-gray-800 border-b-4 border-gray-200 dark:border-gray-700 active:border-b-0 active:translate-y-1 text-2xl font-bold py-4 rounded-xl shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                    >
                        {num}
                    </button>
                ))}
                <button
                    onClick={handleClear}
                    className="bg-red-50 dark:bg-red-900/20 border-b-4 border-red-100 dark:border-red-900/50 active:border-b-0 active:translate-y-1 text-lg font-bold py-4 rounded-xl shadow-sm text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"
                >
                    초기화
                </button>
                <button
                    onClick={() => handleKeypadClick(0)}
                    className="bg-white dark:bg-gray-800 border-b-4 border-gray-200 dark:border-gray-700 active:border-b-0 active:translate-y-1 text-2xl font-bold py-4 rounded-xl shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                >
                    0
                </button>
                <button
                    onClick={handleBackspace}
                    className="bg-gray-100 dark:bg-gray-700 border-b-4 border-gray-200 dark:border-gray-600 active:border-b-0 active:translate-y-1 text-xl font-bold py-4 rounded-xl shadow-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center justify-center"
                >
                    <Delete className="w-6 h-6" />
                </button>
            </div>

            {/* Results List */}
            <div className="space-y-3 mt-6">
                <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 px-1">
                    검색 결과 ({filteredVehicles.length} / {vehicles.length})
                </h3>

                {filteredVehicles.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p>일치하는 차량이 없습니다.</p>
                    </div>
                ) : (
                    <>
                        {filteredVehicles.map(vehicle => (
                            <div
                                key={vehicle.id}
                                onClick={() => setSelectedVehicle(vehicle)}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xl font-black text-gray-800 dark:text-white">{vehicle.plateNumber}</span>
                                        {vehicle.type === 'unidentified' ? (
                                            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400">
                                                미등록
                                            </span>
                                        ) : (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${vehicle.type === 'resident' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' :
                                                'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                                }`}>
                                                {vehicle.type === 'resident' ? '입주민' : '직원'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex gap-3">
                                        <span className="flex items-center gap-1"><Home className="w-3 h-3" /> {vehicle.dong}동 {vehicle.ho}호</span>
                                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {vehicle.ownerName}</span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {searchTerm.length > 0 && (
                            <button
                                onClick={() => setShowUnregisteredModal(true)}
                                className="w-full py-4 mt-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                차량 직접 등록
                            </button>
                        )}
                    </>
                )}
            </div>

            {/* Detail Modal */}
            {selectedVehicle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSelectedVehicle(null)}
                    />
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                            <h3 className="font-bold text-gray-800 dark:text-white">차량 상세 정보</h3>
                            <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                            </button>
                        </div>
                        <div className="p-6">
                            <VehicleActionCard
                                match={selectedVehicle}
                                scannedText={selectedVehicle.plateNumber}
                                onRefresh={refreshData}
                            />
                        </div>
                    </div>
                </div>
            )}

            <UnregisteredVehicleModal
                isOpen={showUnregisteredModal}
                onClose={() => setShowUnregisteredModal(false)}
                searchDigits={searchTerm}
                onRegister={handleUnregisteredRegister}
            />
        </div>
    );
};

export default VehicleList;
