import React, { useState, useRef, useEffect } from 'react';
// import Tesseract from 'tesseract.js'; // Removed for Backend API
import { Camera, RefreshCw, Check, Edit2 } from 'lucide-react';
import { fetchVehicles } from '../utils/api';
import VehicleActionCard from './VehicleActionCard';

const ScanPage = () => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayRef = useRef(null);

    const [capturedImage, setCapturedImage] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [scannedText, setScannedText] = useState('');
    const [match, setMatch] = useState(null);
    const [isAutoScanning, setIsAutoScanning] = useState(true);
    const [scanStatus, setScanStatus] = useState('scanning'); // 'scanning', 'pending', 'checked'

    const [cameras, setCameras] = useState([]);
    const [selectedCameraId, setSelectedCameraId] = useState(null);
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

    useEffect(() => {
        if (scanStatus === 'scanning') {
            if (selectedCameraId && !isIOS) {
                startCamera(selectedCameraId);
            } else {
                if (isIOS) {
                    startCamera();
                } else {
                    // If no camera selected yet but status is scanning (e.g. initial load or reset), get cameras
                    if (cameras.length === 0) {
                        getCameras();
                    } else if (selectedCameraId) {
                        startCamera(selectedCameraId);
                    } else {
                        // fallback
                        startCamera();
                    }
                }
            }
        }
        // Cleanup is handled by new startCamera call (calls stopCamera) or component unmount
    }, [scanStatus, selectedCameraId]); // Re-run when status becomes scanning or camera changes

    useEffect(() => {
        // Initial setup
        if (!isIOS) {
            getCameras(); // Load cameras on mount for Android/Desktop
        }
        return () => stopCamera();
    }, []);

    useEffect(() => {
        let intervalId;
        if (isAutoScanning && videoRef.current && scanStatus === 'scanning') {
            intervalId = setInterval(() => {
                captureAndScan();
            }, 800);
        }
        return () => clearInterval(intervalId);
    }, [isAutoScanning, scanStatus]);

    const getCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setCameras(videoDevices);

            // Smart selection logic
            const backCameras = videoDevices.filter(device =>
                device.label.toLowerCase().includes('back') ||
                device.label.toLowerCase().includes('rear') ||
                device.label.toLowerCase().includes('environment')
            );

            let bestCameraId = null;

            if (backCameras.length > 0) {
                // Try to find the "main" camera (avoiding wide/ultra/telephoto if possible)
                // This is heuristic-based as labels vary by device
                const mainCamera = backCameras.find(device => {
                    const label = device.label.toLowerCase();
                    return !label.includes('wide') &&
                        !label.includes('ultra') &&
                        !label.includes('tele') &&
                        !label.includes('0.5x');
                });

                bestCameraId = mainCamera ? mainCamera.deviceId : backCameras[0].deviceId;
            } else if (videoDevices.length > 0) {
                // Fallback to first available camera
                bestCameraId = videoDevices[0].deviceId;
            }

            if (bestCameraId) {
                setSelectedCameraId(bestCameraId);
            }
        } catch (err) {
            console.error("Error enumerating devices:", err);
        }
    };

    const startCamera = async (deviceId) => {
        stopCamera();
        try {
            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            };

            // Fallback if no deviceId provided (shouldn't happen with new logic but safe to keep)
            if (!deviceId) {
                constraints.video.facingMode = 'environment';
            }

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);

            // Handle specific error cases for better UX
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                alert("카메라 권한이 차단되었습니다.\n\n브라우저 주소창 옆의 '자물쇠' 또는 '설정' 아이콘을 눌러 [카메라 권한]을 '허용'으로 변경해주세요.");
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                alert("카메라 장치를 찾을 수 없습니다.");
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                alert("카메라를 다른 앱이 사용 중입니다. 잠시 후 다시 시도해주세요.");
            } else if (!window.isSecureContext) {
                alert("카메라 기능은 보안 연결(HTTPS) 환경에서만 작동합니다.");
            } else {
                alert("카메라 권한을 얻지 못했습니다. 설정에서 권한을 허용해주세요.");
            }
        }
    };


    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
    };

    const switchCamera = () => {
        if (cameras.length <= 1) return;

        const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId);
        const nextIndex = (currentIndex + 1) % cameras.length;
        setSelectedCameraId(cameras[nextIndex].deviceId);
    };

    const drawBox = (box) => {
        const overlay = overlayRef.current;
        const video = videoRef.current;
        if (!overlay || !video || !box) return;

        const ctx = overlay.getContext('2d');
        overlay.width = video.videoWidth;
        overlay.height = video.videoHeight;

        ctx.clearRect(0, 0, overlay.width, overlay.height);

        const [x1, y1, x2, y2] = box;
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 4;
        ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 24px sans-serif';
        ctx.fillText("번호판 인식됨", x1, y1 - 10);
    };

    const isProcessingRef = useRef(false);

    const captureAndScan = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        if (isProcessingRef.current) return;

        isProcessingRef.current = true;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        // Check if video is actually ready
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            isProcessingRef.current = false;
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Use extracted logic, but we need to handle the isProcessingRef flag carefully
        // processImageFromCanvas is async, so we wait or just fire and forget?
        // Let's integrate logic back here or make processImageFromCanvas clean up the ref?
        // To be safe and quick, I will just call the image processing part here or refactor processImageFromCanvas to NOT set isProcessingRef itself, but call it.

        // Actually, let's just duplicate the core fetch part or keep it simple. 
        // The previous code had specific box drawing logic which is good for live video.

        const image = canvas.toDataURL('image/png');

        try {
            const response = await fetch(image);
            const blob = await response.blob();
            const formData = new FormData();
            formData.append('file', blob, 'capture.png');

            let API_URL = import.meta.env.VITE_API_URL || '';
            if (API_URL.endsWith('/')) {
                API_URL = API_URL.slice(0, -1);
            }
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

            const apiResponse = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            const data = await apiResponse.json();
            let text = data.text;
            const box = data.box;

            if (box) {
                drawBox(box);
            } else {
                const overlay = overlayRef.current;
                if (overlay) {
                    const ctx = overlay.getContext('2d');
                    ctx.clearRect(0, 0, overlay.width, overlay.height);
                }
            }

            let isValid = false;
            if (text && text !== "인식실패" && text !== "오류발생") {
                text = text.replace(/[^0-9가-힣]/g, '');
                if (text.length >= 4) {
                    isValid = true;
                }
            }

            if (isValid) {
                setScannedText(text);

                // Crop image if box is available
                if (box) {
                    const [x1, y1, x2, y2] = box;
                    const cropCanvas = document.createElement('canvas');
                    const width = x2 - x1;
                    const height = y2 - y1;

                    // Add some padding if possible
                    const padding = 10;
                    const pX1 = Math.max(0, x1 - padding);
                    const pY1 = Math.max(0, y1 - padding);
                    const pWidth = Math.min(canvas.width - pX1, width + padding * 2);
                    const pHeight = Math.min(canvas.height - pY1, height + padding * 2);

                    cropCanvas.width = pWidth;
                    cropCanvas.height = pHeight;

                    const cropCtx = cropCanvas.getContext('2d');
                    cropCtx.drawImage(canvas, pX1, pY1, pWidth, pHeight, 0, 0, pWidth, pHeight);

                    setCapturedImage(cropCanvas.toDataURL('image/png'));
                } else {
                    setCapturedImage(image); // Fallback to full frame
                }

                setShowModal(true);      // Show modal
                setIsAutoScanning(false);
                setScanStatus('pending');
            }

        } catch (err) {
            console.error("OCR Error:", err);
        } finally {
            isProcessingRef.current = false;
        }
    };

    const checkVehicle = async (text) => {
        if (!text) {
            setMatch(null);
            setScanStatus('checked');
            return;
        }

        const vehicles = await fetchVehicles();
        const normalizedInput = text.replace(/\s/g, '');

        const found = vehicles.find(v => {
            const cleanPlate = v.plateNumber.replace(/\s/g, '');
            if (normalizedInput.length >= 4 && cleanPlate.length >= 4) {
                return normalizedInput.includes(cleanPlate) || cleanPlate.includes(normalizedInput);
            }
            return normalizedInput === cleanPlate;
        });

        setMatch(found || null);
        setScanStatus('checked');
    };

    const handleConfirm = () => {
        checkVehicle(scannedText);
    };

    const handleRescan = () => {
        setScannedText('');
        setCapturedImage(null);
        setShowModal(false);
        setMatch(null);
        setScanStatus('scanning');
        setIsAutoScanning(true);

        const overlay = overlayRef.current;
        if (overlay) {
            const ctx = overlay.getContext('2d');
            ctx.clearRect(0, 0, overlay.width, overlay.height);
        }
    };

    const handleManualEdit = (e) => {
        const newText = e.target.value;
        setScannedText(newText);
    };

    // Modal Confirm Action
    const confirmModal = () => {
        setShowModal(false);
        // Ensure status reflects pending manual check or auto check?
        // Let's keep it as pending so user can edit if needed, OR proceed to check directly.
        // User request says "Show with modal". Buttons in modal should replace the external buttons?
        // Let's make "Confirm" in modal proceed to 'checked' state immediately?
        // Or just close modal and let them hit "Confirm (Check)" below?
        // Usually, modal confirm means "Yes this is the number".
        // Let's make modal confirm execute checkVehicle.
        checkVehicle(scannedText);
    };

    return (

        <div className="flex flex-col h-full">
            {/* Camera Section - Hide when checked */}
            {scanStatus !== 'checked' && (
                <div className="relative bg-black rounded-lg overflow-hidden aspect-square mb-4 shadow-lg flex-shrink-0">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <canvas ref={canvasRef} className="hidden" />
                    <canvas
                        ref={overlayRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                    />

                    <div className="absolute bottom-4 left-0 right-0 text-center text-white/80 text-sm pointer-events-none bg-black/30 py-1">
                        {scanStatus === 'scanning' ? "자동 스캔 중... (안 되면 터치)" : "스캔 일시 중지됨"}
                    </div>

                    {/* Manual Trigger Overlay for when Camera is black/fails but no error thrown yet */}
                    <div
                        className="absolute inset-0 cursor-pointer"
                        onClick={() => {
                            // If video is not active, try restarting camera to trigger permission prompt again
                            if (!videoRef.current?.srcObject) {
                                startCamera(selectedCameraId);
                            }
                        }}
                    />

                    {/* Camera Switch Button */}
                    {!isIOS && cameras.length > 1 && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                switchCamera();
                            }}
                            className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full backdrop-blur-sm active:scale-95 transition-transform z-10"
                        >
                            <RefreshCw className="w-6 h-6" />
                        </button>
                    )}
                </div>
            )}

            {/* Action Buttons based on Status */}
            {scanStatus === 'pending' && (
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={handleRescan}
                        className="flex-1 bg-gray-500 text-white py-3 rounded-lg font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <RefreshCw className="w-5 h-5" />
                        다시 스캔
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <Check className="w-5 h-5" />
                        확인 (조회)
                    </button>
                </div>
            )}

            {scanStatus === 'checked' && (
                <button
                    onClick={handleRescan}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold text-lg shadow-md active:scale-95 transition-transform flex items-center justify-center gap-2 mb-4"
                >
                    <RefreshCw className="w-6 h-6" />
                    새로 스캔하기
                </button>
            )}

            {/* Result Section */}
            <div className={`bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 py-3 px-4 transition-colors ${scanStatus === 'checked' ? 'flex-grow flex flex-col' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">인식된 번호 (수정 가능)</label>
                    <Edit2 className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                </div>

                <input
                    type="text"
                    value={scannedText}
                    onChange={handleManualEdit}
                    placeholder="스캔 대기 중..."
                    className="w-full text-2xl font-bold text-center border-b-2 border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none py-1 mb-2 tracking-wider bg-transparent text-gray-900 dark:text-white"
                />

                <div className={`flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-100 dark:border-gray-600 p-4 transition-colors ${scanStatus === 'checked' ? 'flex-grow items-start overflow-y-auto' : 'min-h-[100px]'}`}>
                    {scanStatus === 'checked' ? (
                        <VehicleActionCard
                            match={match}
                            scannedText={scannedText}
                            onRefresh={() => checkVehicle(scannedText)}
                        />
                    ) : scanStatus === 'pending' ? (
                        <p className="text-blue-600 dark:text-blue-400 font-medium">번호를 확인하고 [확인] 버튼을 눌러주세요</p>
                    ) : (
                        <p className="text-gray-400 dark:text-gray-500 text-sm">카메라에 번호판을 비춰주세요</p>
                    )}
                </div>
            </div>
            {/* Capture Modal */}
            {showModal && capturedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                        {/* Image Section */}
                        <div className="relative bg-gray-100 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 p-8 flex items-center justify-center min-h-[200px]">
                            <img
                                src={capturedImage}
                                alt="Captured Plate"
                                className="w-auto h-auto max-h-[180px] rounded-lg shadow-md transform scale-110"
                            />
                        </div>

                        {/* Content Section */}
                        <div className="p-6">
                            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-bold mb-3 text-center uppercase tracking-widest">인식 결과</h3>
                            <div className="text-5xl font-black text-center text-gray-900 dark:text-white mb-8 tracking-wider font-mono">
                                {scannedText}
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmModal}
                                    className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <Check className="w-6 h-6" />
                                    확인 (차량 조회)
                                </button>
                                <button
                                    onClick={handleRescan}
                                    className="w-full py-3 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    다시 촬영
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScanPage;
