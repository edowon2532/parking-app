import React, { useState } from 'react';
import { X, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Download } from 'lucide-react';

const ExcelUploadModal = ({ isOpen, onClose }) => {
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
    const [replace, setReplace] = useState(false);

    if (!isOpen) return null;

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setUploadResult(null);
    };

    const handleDownloadTemplate = () => {
        let apiUrl = import.meta.env.VITE_API_URL || '';
        // Remove trailing slash
        apiUrl = apiUrl.replace(/\/$/, '');

        // If apiUrl is empty (was / or empty), use relative path
        const targetUrl = apiUrl
            ? `${apiUrl}/api/vehicles/template`
            : `/api/vehicles/template`;

        // alert(`Downloading from: ${targetUrl}`); // Debug
        window.location.href = targetUrl;
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        let apiUrl = import.meta.env.VITE_API_URL || '';
        apiUrl = apiUrl.replace(/\/$/, '');

        const targetUrl = apiUrl
            ? `${apiUrl}/api/vehicles/upload`
            : `/api/vehicles/upload`;

        try {
            const response = await fetch(`${targetUrl}?replace=${replace}`, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            setUploadResult(data);
        } catch (error) {
            console.error("Upload failed", error);
            alert("업로드 중 오류가 발생했습니다.");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="w-6 h-6 text-green-600 dark:text-green-400" />
                        엑셀 일괄 등록
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {!uploadResult ? (
                    <div className="space-y-6">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                            <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <AlertCircle className="w-5 h-5" />
                                안내사항
                            </h3>
                            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1 list-disc list-inside">
                                <li>반드시 제공된 양식을 다운로드하여 작성해주세요.</li>
                                <li>차량번호, 차주명, 동, 호는 필수 입력 항목입니다.</li>
                                <li>전화번호는 숫자만 입력해도 자동으로 포맷팅됩니다.</li>
                            </ul>
                            <button
                                onClick={handleDownloadTemplate}
                                className="mt-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                                <Download className="w-4 h-4" />
                                양식 다운로드
                            </button>
                        </div>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                            <input
                                type="file"
                                accept=".xlsx, .xls"
                                onChange={handleFileChange}
                                className="hidden"
                                id="excel-upload"
                            />
                            <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-300 font-medium">
                                    {file ? file.name : "엑셀 파일을 선택하거나 이곳에 드래그하세요"}
                                </span>
                            </label>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <input
                                type="checkbox"
                                id="replace-check"
                                checked={replace}
                                onChange={(e) => setReplace(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="replace-check" className="text-sm text-gray-700 dark:text-gray-200 font-medium cursor-pointer">
                                기존 데이터를 모두 삭제하고 새로 등록하기
                            </label>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isUploading ? "업로드 중..." : "등록하기"}
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">처리 완료</h3>
                            <p className="text-gray-600 dark:text-gray-300">
                                성공: <span className="text-green-600 dark:text-green-400 font-bold">{uploadResult.added.length}</span>건 /
                                실패: <span className="text-red-600 dark:text-red-400 font-bold">{uploadResult.failed.length}</span>건
                            </p>
                        </div>

                        {uploadResult.failed.length > 0 && (
                            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 max-h-40 overflow-y-auto">
                                <h4 className="font-bold text-red-800 dark:text-red-300 mb-2">실패 목록</h4>
                                <ul className="text-sm text-red-700 dark:text-red-200 space-y-1">
                                    {uploadResult.failed.map((item, idx) => (
                                        <li key={idx}>{item.plateNumber} - {item.ownerName} (등록 실패)</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={onClose}
                            className="w-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-bold text-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExcelUploadModal;
