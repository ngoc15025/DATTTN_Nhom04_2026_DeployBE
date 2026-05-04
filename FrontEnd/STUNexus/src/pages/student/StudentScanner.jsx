import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { FaQrcode, FaArrowLeft, FaPlay, FaStop, FaCheckCircle } from 'react-icons/fa';

const StudentScanner = () => {
    const navigate = useNavigate();
    const [isScanning, setIsScanning] = useState(false);
    const [scanStatus, setScanStatus] = useState('idle'); // idle | scanning | success | error
    const [errorMsg, setErrorMsg] = useState('');
    const html5QrcodeRef = useRef(null);

    // Cleanup khi component unmount để tránh lỗi lồng 2 camera
    useEffect(() => {
        return () => {
            if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
                html5QrcodeRef.current.stop().then(() => {
                    html5QrcodeRef.current.clear();
                }).catch(() => {});
            }
        };
    }, []);

    const startScanning = async () => {
        setErrorMsg('');
        setScanStatus('scanning');
        setIsScanning(true);

        try {
            const html5Qrcode = new Html5Qrcode("qr-reader");
            html5QrcodeRef.current = html5Qrcode;

            const cameras = await Html5Qrcode.getCameras();
            if (!cameras || cameras.length === 0) {
                throw new Error('Không tìm thấy camera trên thiết bị.');
            }

            // Ưu tiên camera sau (trên mobile)
            const cameraId = cameras.length > 1 ? cameras[cameras.length - 1].id : cameras[0].id;

            await html5Qrcode.start(
                cameraId,
                {
                    fps: 10,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                },
                (decodedText) => {
                    // QR quét thành công
                    html5Qrcode.stop().then(() => {
                        setIsScanning(false);
                        setScanStatus('success');
                        handleDecodedURL(decodedText);
                    });
                },
                () => {} // Bỏ qua lỗi quét thất bại từng frame
            );
        } catch (err) {
            setIsScanning(false);
            setScanStatus('error');
            setErrorMsg(err.message || 'Không thể khởi động camera. Vui lòng cấp quyền truy cập.');
        }
    };

    const stopScanning = async () => {
        if (html5QrcodeRef.current && html5QrcodeRef.current.isScanning) {
            await html5QrcodeRef.current.stop();
        }
        setIsScanning(false);
        setScanStatus('idle');
    };

    const handleDecodedURL = (decodedText) => {
        try {
            const url = new URL(decodedText);
            const path = url.pathname + url.search;
            if (path.includes('/student/checkin')) {
                setTimeout(() => navigate(path), 800); // Delay để hiển thị success
            } else {
                setScanStatus('error');
                setErrorMsg('Mã QR không hợp lệ cho hệ thống điểm danh này.');
            }
        } catch {
            setScanStatus('error');
            setErrorMsg('Mã QR không đúng định dạng yêu cầu.');
        }
    };

    return (
        <div className="pb-4 pt-2 d-flex flex-column" style={{ minHeight: '85vh' }}>
            {/* Header */}
            <div className="d-flex align-items-center mb-4 px-1">
                <button
                    className="btn d-flex align-items-center justify-content-center rounded-circle border-0 me-3 shadow-sm bg-white"
                    onClick={() => { stopScanning(); navigate(-1); }}
                    style={{ width: '40px', height: '40px' }}
                >
                    <FaArrowLeft className="text-primary" />
                </button>
                <h5 className="fw-bold text-dark mb-0">Quét Mã Điểm Danh</h5>
            </div>

            {/* Camera Viewer */}
            <div
                className="rounded-4 overflow-hidden shadow-sm bg-dark position-relative mb-4"
                style={{ aspectRatio: '1', width: '100%', maxWidth: '400px', margin: '0 auto 16px' }}
            >
                {/* Camera viewport */}
                <div id="qr-reader" style={{ width: '100%', height: '100%' }}></div>

                {/* Overlay khi chưa scan */}
                {!isScanning && scanStatus !== 'success' && (
                    <div
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                        style={{ background: 'rgba(15,23,42,0.85)', zIndex: 5 }}
                    >
                        <div
                            className="rounded-3 border-2 d-flex align-items-center justify-content-center mb-3"
                            style={{ width: '120px', height: '120px', border: '2px dashed rgba(255,255,255,0.4)' }}
                        >
                            <FaQrcode style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <p className="text-white small mb-0 opacity-75">Nhấn nút bên dưới để bật camera</p>
                    </div>
                )}

                {/* Success Overlay */}
                {scanStatus === 'success' && (
                    <div
                        className="position-absolute top-0 start-0 w-100 h-100 d-flex flex-column align-items-center justify-content-center"
                        style={{ background: 'rgba(16,185,129,0.92)', zIndex: 5 }}
                    >
                        <FaCheckCircle style={{ fontSize: '4rem', color: 'white' }} className="mb-3" />
                        <p className="text-white fw-bold fs-6 mb-1">Quét thành công!</p>
                        <p className="text-white small opacity-75">Đang chuyển đến trang điểm danh...</p>
                    </div>
                )}

                {/* Scanning corners overlay */}
                {isScanning && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ zIndex: 6, pointerEvents: 'none' }}>
                        <div className="position-relative" style={{ width: '200px', height: '200px' }}>
                            {/* Corner brackets */}
                            {[['top-0 start-0', 'border-top border-start'], ['top-0 end-0', 'border-top border-end'], ['bottom-0 start-0', 'border-bottom border-start'], ['bottom-0 end-0', 'border-bottom border-end']].map(([pos, borderClass], i) => (
                                <div key={i} className={`position-absolute ${pos} border-primary border-3 ${borderClass}`} style={{ width: '28px', height: '28px' }}></div>
                            ))}
                            {/* Scanning laser line */}
                            <div
                                className="position-absolute start-0 w-100 bg-primary"
                                style={{
                                    height: '2px',
                                    animation: 'scanLine 2s linear infinite',
                                    top: '50%',
                                    boxShadow: '0 0 8px rgba(13, 110, 253, 0.8)',
                                }}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Scan Line Animation CSS */}
            <style>{`
                @keyframes scanLine {
                    0% { top: 4px; }
                    50% { top: calc(100% - 4px); }
                    100% { top: 4px; }
                }
            `}</style>

            {/* Error message */}
            {scanStatus === 'error' && (
                <div className="alert border-0 rounded-4 py-3 text-center mb-3" style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>
                    <span className="fw-semibold small">{errorMsg}</span>
                </div>
            )}

            {/* Action buttons */}
            <div className="d-flex justify-content-center gap-3 mb-4">
                {!isScanning ? (
                    <button
                        className="btn btn-primary d-flex align-items-center gap-2 fw-bold px-5 py-3 shadow rounded-pill"
                        onClick={startScanning}
                        style={{ fontSize: '1rem' }}
                    >
                        <FaPlay className="small" />
                        Bắt đầu quét
                    </button>
                ) : (
                    <button
                        className="btn d-flex align-items-center gap-2 fw-bold px-5 py-3 shadow rounded-pill text-danger"
                        onClick={stopScanning}
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1.5px solid #dc2626', fontSize: '1rem' }}
                    >
                        <FaStop className="small" />
                        Dừng quét
                    </button>
                )}
            </div>

            {/* Instructions Card */}
            <div className="rounded-4 p-4 text-center" style={{ background: 'rgba(13,110,253,0.07)' }}>
                <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center p-3 mb-3 shadow-sm">
                    <FaQrcode className="text-primary fs-4" />
                </div>
                <h6 className="fw-bold text-dark mb-2">Hướng dẫn quét mã</h6>
                <p className="text-muted small mb-0 px-2">
                    Nhấn <strong>Bắt đầu quét</strong>, sau đó đưa camera về phía mã QR được giảng viên hiển thị trên màn hình.
                    Đảm bảo mã nằm trong khung hình và đủ ánh sáng.
                </p>
            </div>
        </div>
    );
};

export default StudentScanner;
