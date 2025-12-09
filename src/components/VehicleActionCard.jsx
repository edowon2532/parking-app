import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { CheckCircle, X, Phone, AlertTriangle, ChevronUp, Plus, Settings, Trash2, Save, Camera } from 'lucide-react';
import { fetchHistory, createHistoryItem, createVehicle, updateVehicle, deleteVehicle, uploadImage } from '../utils/api';

const VehicleActionCard = ({ match, scannedText, onRefresh }) => {
    const [stats, setStats] = useState({ calls: 0, reports: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [modalFilter, setModalFilter] = useState('all'); // 'all', 'call', 'report'
    const [reporterName, setReporterName] = useState('');

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.user_metadata && user.user_metadata.name) {
                setReporterName(user.user_metadata.name);
            }
        };
        getUser();
    }, []);

    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        plateNumber: '',
        ownerName: '',
        dong: '',
        ho: '',
        phoneNumber: '',
        type: 'unidentified'
    });

    const [reportModalOpen, setReportModalOpen] = useState(false);

    useEffect(() => {
        updateStats(match ? match.plateNumber : scannedText);
    }, [match, scannedText, modalOpen, reportModalOpen]);

    useEffect(() => {
        if (match) {
            setEditForm({
                plateNumber: match.plateNumber,
                ownerName: match.ownerName,
                dong: match.dong,
                ho: match.ho,
                phoneNumber: match.phoneNumber || '',
                type: match.type || 'unidentified'
            });
        }
    }, [match]);

    const getTypeLabel = (type) => {
        switch (type) {
            case 'resident': return '입주민';
            case 'staff': return '직원';
            case 'unidentified': return '미등록';
            default: return '미등록';
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'resident': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
            case 'staff': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
            case 'unidentified': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        }
    };

    const updateStats = async (plate) => {
        if (!plate) return;
        const allHistory = await fetchHistory();
        const vehicleHistory = allHistory.filter(h => h.plateNumber === plate);
        const calls = vehicleHistory.filter(h => h.type === 'call').length;
        const reports = vehicleHistory.filter(h => h.type === 'report').length;
        setStats({ calls, reports });
    };

    const handleCall = async () => {
        if (!match) return;

        await createHistoryItem({
            type: 'call',
            plateNumber: match.plateNumber,
            ownerName: match.ownerName,
            unitNumber: `${match.dong}-${match.ho}`,
            note: '전화 발신',
            reporterName: reporterName
        });
        updateStats(match.plateNumber);

        window.location.href = `tel:${match.phoneNumber}`;
    };

    const handleReportClick = () => {
        setReportModalOpen(true);
    };

    const handleReportSubmit = async (reportData) => {
        const { reason, description, image } = reportData;
        const plate = match ? match.plateNumber : scannedText;
        let imageUrl = null;
        let thumbnailUrl = null;

        try {
            if (image) {
                const uploadResult = await uploadImage(image);
                if (uploadResult) {
                    imageUrl = uploadResult.url;
                    thumbnailUrl = uploadResult.thumbnail;
                }
            }

            await createHistoryItem({
                type: 'report',
                plateNumber: plate,
                ownerName: match ? match.ownerName : '확인불가',
                unitNumber: match ? `${match.dong}-${match.ho}` : '?-?',
                note: reason,
                description: description,
                image: imageUrl,
                thumbnail: thumbnailUrl,
                reporterName: reporterName
            });

            updateStats(plate);
            setReportModalOpen(false);
            alert("신고가 접수되었습니다.");

            if (onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error("Report submission failed:", error);
            alert("신고 접수에 실패했습니다.");
        }
    };

    const handleRegisterPhone = async () => {
        const phoneNumber = prompt("등록할 전화번호를 입력해주세요 (- 없이 입력)");
        if (phoneNumber) {
            try {
                if (match) {
                    const updatedVehicle = { ...match, phoneNumber };
                    await updateVehicle(updatedVehicle);
                } else {
                    const newVehicle = {
                        plateNumber: scannedText,
                        ownerName: '확인불가',
                        dong: '?',
                        ho: '?',
                        phoneNumber: phoneNumber,
                        type: 'unidentified'
                    };
                    await createVehicle(newVehicle);
                }
                alert("전화번호가 등록되었습니다.");
                if (onRefresh) onRefresh();
            } catch (error) {
                console.error("Phone registration failed:", error);
                alert("전화번호 등록에 실패했습니다.");
            }
        }
    };

    const handleDelete = async () => {
        if (window.confirm("정말로 이 차량 정보를 삭제하시겠습니까?")) {
            await deleteVehicle(match.id);
            if (onRefresh) onRefresh();
        }
    };

    const handleEditSave = async () => {
        const updatedVehicle = {
            ...match,
            ...editForm
        };
        await updateVehicle(updatedVehicle);
        setIsEditing(false);
        if (onRefresh) onRefresh();
    };

    const openHistory = (filterType) => {
        setModalFilter(filterType);
        setModalOpen(true);
    };

    const renderStatsCards = () => (
        <div className="flex gap-3 w-full mb-6">
            <div
                onClick={() => openHistory('report')}
                className="flex-1 bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-100 dark:border-red-900/50 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
            >
                <span className="text-red-600 dark:text-red-400 text-sm font-medium mb-1">신고 접수</span>
                <span className="text-2xl font-bold text-red-700 dark:text-red-300">{stats.reports}건</span>
            </div>
            <div
                onClick={() => openHistory('call')}
                className="flex-1 bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-900/50 flex flex-col items-center cursor-pointer active:scale-95 transition-transform"
            >
                <span className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">전화 통화</span>
                <span className="text-2xl font-bold text-green-700 dark:text-green-300">{stats.calls}건</span>
            </div>
        </div>
    );

    if (isEditing) {
        return (
            <div className="flex flex-col w-full animate-in fade-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">차량 정보 수정</h3>
                    <button onClick={() => setIsEditing(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="space-y-3 mb-6">
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1">차량번호</label>
                        <input
                            type="text"
                            value={editForm.plateNumber}
                            onChange={(e) => setEditForm({ ...editForm, plateNumber: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none font-bold text-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1">차량 유형</label>
                        <select
                            value={editForm.type}
                            onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-white appearance-none"
                        >
                            <option value="resident">입주민</option>
                            <option value="staff">직원</option>
                            <option value="unidentified">미등록</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1">동</label>
                            <input
                                type="text"
                                value={editForm.dong}
                                onChange={(e) => setEditForm({ ...editForm, dong: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-white"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1">호</label>
                            <input
                                type="text"
                                value={editForm.ho}
                                onChange={(e) => setEditForm({ ...editForm, ho: e.target.value })}
                                className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-white"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1">차주명</label>
                        <input
                            type="text"
                            value={editForm.ownerName}
                            onChange={(e) => setEditForm({ ...editForm, ownerName: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 font-bold ml-1">전화번호</label>
                        <input
                            type="text"
                            value={editForm.phoneNumber}
                            onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none text-gray-800 dark:text-white"
                        />
                    </div>
                </div>

                <button
                    onClick={handleEditSave}
                    className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Save className="w-5 h-5" />
                    저장하기
                </button>
            </div>
        );
    }

    if (match) {
        return (
            <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
                {match.dong === '?' || match.type === 'unidentified' ? (
                    <div className="flex flex-col items-center text-red-600 dark:text-red-400 mb-4 relative w-full">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute right-0 top-0 p-2 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        >
                            <Settings className="w-4 h-4 text-red-400" />
                        </button>

                        <AlertTriangle className="w-10 h-10 mb-2" />
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">미등록 차량입니다</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getTypeColor(match.type)}`}>
                                {getTypeLabel(match.type)}
                            </span>
                        </div>
                        <p className="text-5xl font-black mt-1">{match.plateNumber}</p>
                        <div className="mt-2 text-sm bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full text-red-700 dark:text-red-300">
                            {match.ownerName} • {match.dong}동 {match.ho}호
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-green-700 dark:text-green-400 mb-4 relative w-full">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="absolute right-0 top-0 p-2 bg-green-50 dark:bg-green-900/20 rounded-full hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                        >
                            <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </button>
                        <CheckCircle className="w-10 h-10 mb-2" />
                        <div className="flex items-center gap-2">
                            <p className="font-bold text-lg">등록된 차량입니다</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getTypeColor(match.type)}`}>
                                {getTypeLabel(match.type)}
                            </span>
                        </div>
                        <p className="text-5xl font-black mt-1 text-gray-900 dark:text-white">{match.plateNumber}</p>
                        <div className="mt-2 text-sm bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full text-green-800 dark:text-green-300">
                            {match.ownerName} • {match.dong}동 {match.ho}호
                        </div>
                    </div>
                )}

                {renderStatsCards()}

                <div className="flex flex-col gap-3 w-full">
                    {match.phoneNumber ? (
                        <button
                            onClick={handleCall}
                            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Phone className="w-6 h-6" />
                            전화 걸기
                        </button>
                    ) : (
                        <button
                            onClick={handleRegisterPhone}
                            className="w-full bg-gray-700 dark:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                        >
                            <Plus className="w-6 h-6" />
                            전화번호 등록
                        </button>
                    )}

                    <button
                        onClick={handleReportClick}
                        className="w-full bg-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <AlertTriangle className="w-6 h-6" />
                        위반 신고
                    </button>

                    {match.type === 'unidentified' && stats.calls === 0 && stats.reports === 0 && (
                        <button
                            onClick={handleDelete}
                            className="w-full bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 py-3 rounded-xl font-medium text-sm border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center justify-center gap-2 mt-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            차량 정보 삭제
                        </button>
                    )}
                </div>

                <VehicleHistoryModal
                    plateNumber={match.plateNumber}
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    filter={modalFilter}
                />

                <ReportModal
                    isOpen={reportModalOpen}
                    onClose={() => setReportModalOpen(false)}
                    onSubmit={handleReportSubmit}
                />
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center w-full animate-in fade-in zoom-in duration-300">
            <div className="flex flex-col items-center text-red-600 dark:text-red-400 mb-4">
                <X className="w-10 h-10 mb-2" />
                <p className="font-bold text-lg">등록되지 않은 차량</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">번호를 다시 확인해주세요</p>
            </div>

            {(stats.calls > 0 || stats.reports > 0) && renderStatsCards()}

            <div className="flex flex-col gap-3 w-full mt-2">
                <button
                    onClick={handleReportClick}
                    className="w-full bg-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <AlertTriangle className="w-6 h-6" />
                    신고하기
                </button>
                <button
                    onClick={handleRegisterPhone}
                    className="w-full bg-gray-700 dark:bg-gray-600 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                    <Plus className="w-6 h-6" />
                    전화번호 등록
                </button>
            </div>

            <VehicleHistoryModal
                plateNumber={scannedText}
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                filter={modalFilter}
            />

            <ReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                onSubmit={handleReportSubmit}
            />
        </div>
    );
};

const ReportModal = ({ isOpen, onClose, onSubmit }) => {
    const [selectedReason, setSelectedReason] = useState('지상주차');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null); // Stores the File object
    const [previewUrl, setPreviewUrl] = useState(null); // Stores the Data URL for preview

    const reasons = [
        "지상주차",
        "통로주차",
        "장애인구역 위반",
        "미등록차량",
        "기타"
    ];

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file); // Store the File object
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result); // Store Data URL for preview
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (selectedReason === '기타' && !description.trim()) {
            alert("기타 사유 선택 시 상세 내용을 입력해주세요.");
            return;
        }

        onSubmit({
            reason: selectedReason,
            description: description,
            image: image // Pass the File object
        });

        // Reset state
        setSelectedReason('지상주차');
        setDescription('');
        setImage(null);
        setPreviewUrl(null);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl shadow-2xl z-10 overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                    <h3 className="font-bold text-gray-800 dark:text-white">위반 신고</h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">신고 사유</label>
                        <div className="space-y-2">
                            {reasons.map(reason => (
                                <label key={reason} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <input
                                        type="radio"
                                        name="reportReason"
                                        value={reason}
                                        checked={selectedReason === reason}
                                        onChange={(e) => setSelectedReason(e.target.value)}
                                        className="w-5 h-5 text-blue-600"
                                    />
                                    <span className="font-medium text-gray-700 dark:text-gray-200">{reason}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">상세 내용 (선택)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="추가적인 설명이 필요하다면 입력해주세요."
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 focus:border-blue-500 outline-none resize-none h-24 text-gray-800 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">사진 첨부</label>
                        <div className="flex items-center gap-3">
                            <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <Camera className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500 dark:text-gray-400">사진 촬영 / 선택</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    onChange={handleImageChange}
                                    className="hidden"
                                />
                            </label>
                            {previewUrl && (
                                <div className="w-24 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 relative">
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => { setImage(null); setPreviewUrl(null); }}
                                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="w-full bg-red-500 text-white py-4 rounded-xl font-bold text-lg shadow-md active:scale-95 transition-transform mt-2"
                    >
                        신고 접수
                    </button>
                </div>
            </div>
        </div>
    );
};

const VehicleHistoryModal = ({ plateNumber, isOpen, onClose, filter }) => {
    const [history, setHistory] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);

    useEffect(() => {
        const loadHistory = async () => {
            if (isOpen) {
                const allHistory = await fetchHistory();
                let vehicleHistory = allHistory.filter(h => h.plateNumber === plateNumber);

                if (filter !== 'all') {
                    vehicleHistory = vehicleHistory.filter(h => h.type === filter);
                }

                // Sort by timestamp descending
                vehicleHistory.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

                setHistory(vehicleHistory);
            }
        };
        loadHistory();
    }, [plateNumber, isOpen, filter]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-t-2xl shadow-2xl z-10 max-h-[80vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                <div className="w-full flex justify-center pt-3 pb-1" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                        {filter === 'call' ? '통화 기록' : filter === 'report' ? '신고 기록' : '전체 기록'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 min-h-[300px]">
                    {history.length === 0 ? (
                        <div className="text-center text-gray-400 dark:text-gray-500 py-10">
                            기록이 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {history.map(item => (
                                <div key={item.id} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <div className={`p-2 rounded-full shrink-0 ${item.type === 'call' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                        }`}>
                                        {item.type === 'call' ? <Phone className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-800 dark:text-gray-200">
                                                    {item.type === 'call' ? '전화 발신' : '위반 신고'}
                                                </span>
                                                {item.type === 'report' && item.note && (
                                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300">
                                                        {item.note}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end ml-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                                    {new Date(item.timestamp).toLocaleString('ko-KR', {
                                                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                                {item.reporterName && (
                                                    <span className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                                        {item.reporterName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {item.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                                                {item.description}
                                            </p>
                                        )}

                                        {(item.thumbnail || item.image) && (
                                            <button
                                                onClick={() => setSelectedImage(item.image)}
                                                className="mt-2 relative group rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 w-20 h-20"
                                            >
                                                <img
                                                    src={item.thumbnail || item.image}
                                                    alt="증거 사진"
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
                    <button
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full screen"
                        className="max-w-full max-h-[90vh] object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default VehicleActionCard;
