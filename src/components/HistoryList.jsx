import React, { useState, useEffect } from 'react';
import { fetchHistory } from '../utils/api';
import { Phone, AlertTriangle, Clock, Calendar, X } from 'lucide-react';

const HistoryList = () => {
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [stats, setStats] = useState({});

    useEffect(() => {
        const loadHistory = async () => {
            setLoading(true);
            const data = await fetchHistory();
            // Sort by timestamp descending
            data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setHistory(data);
            setFilteredHistory(data);
            setLoading(false);
        };
        loadHistory();
    }, []);

    useEffect(() => {
        let filtered = history;
        if (selectedDate) {
            filtered = history.filter(item => {
                const itemDate = new Date(item.timestamp).toISOString().split('T')[0];
                return itemDate === selectedDate;
            });
        }
        setFilteredHistory(filtered);

        // Calculate stats for filtered data
        const newStats = {};
        filtered.forEach(item => {
            if (item.type === 'report' && item.note) {
                newStats[item.note] = (newStats[item.note] || 0) + 1;
            }
        });
        setStats(newStats);
    }, [selectedDate, history]);

    const formatDate = (isoString) => {
        const date = new Date(isoString);
        return date.toLocaleString('ko-KR', {
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getReasonColor = (reason) => {
        switch (reason) {
            case '지상주차': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
            case '통로주차': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
            case '장애인구역 위반': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
            case '미등록차량': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300';
            default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
        }
    };

    if (loading) {
        return <div className="flex justify-center p-10">Loading...</div>;
    }

    return (
        <div className="p-4 pb-24">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    활동 기록
                </h2>
                <div className="relative">
                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <Calendar className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
            </div>

            {/* Summary Stats */}
            {Object.keys(stats).length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
                    {Object.entries(stats).map(([reason, count]) => (
                        <div key={reason} className={`flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap border border-transparent ${getReasonColor(reason)}`}>
                            <span className="font-bold text-sm">{reason}</span>
                            <span className="bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-full text-xs font-bold">{count}건</span>
                        </div>
                    ))}
                </div>
            )}

            {filteredHistory.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-10 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                    <p>{selectedDate ? "해당 날짜의 기록이 없습니다." : "아직 기록이 없습니다."}</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredHistory.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex items-start gap-4 transition-colors">
                            <div className={`p-2 rounded-full shrink-0 ${item.type === 'call' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                }`}>
                                {item.type === 'call' ? <Phone className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{item.plateNumber}</h3>
                                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">{formatDate(item.timestamp)}</span>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {item.ownerName} • {item.unitNumber || "?"}
                                </p>

                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        {item.type === 'call' ? '전화 발신' : '위반 신고'}
                                    </span>
                                    {item.type === 'report' && item.note && (
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${getReasonColor(item.note)}`}>
                                            {item.note}
                                        </span>
                                    )}
                                </div>

                                {/* Description */}
                                {item.description && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 p-2 rounded mb-2">
                                        <p>{item.description}</p>
                                    </div>
                                )}

                                {/* Thumbnail */}
                                {item.thumbnail && (
                                    <div
                                        className="mt-2 cursor-pointer inline-block"
                                        onClick={() => setSelectedImage(item.image || item.thumbnail)}
                                    >
                                        <img
                                            src={item.thumbnail}
                                            alt="Evidence"
                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity"
                                        />
                                    </div>
                                )}

                                {item.reporterName && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">
                                        신고자: {item.reporterName}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedImage(null)}>
                    <button
                        className="absolute top-4 right-4 text-white p-2 rounded-full bg-white/10 hover:bg-white/20"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Full size evidence"
                        className="max-w-full max-h-full object-contain rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
};

export default HistoryList;
