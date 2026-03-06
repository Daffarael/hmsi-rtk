'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/lib/api';
import styles from './scan.module.css';

interface ScanResult {
    sukses: boolean;
    pesan?: string;
    data?: {
        rapat?: string;
        jenis_rapat?: string;
        tanggal?: string;
        lokasi?: string;
        waktu_scan?: string;
        // Piket fields
        kehadiran_piket_id?: number;
        hari?: string;
    };
}

interface PhotoItem {
    file: File;
    preview: string;
    tipe: 'selfie' | 'sekre_sebelum' | 'sekre_sesudah';
}

// Detect in-app browsers that block camera access
function detectInAppBrowser(): string | null {
    if (typeof navigator === 'undefined') return null;
    const ua = navigator.userAgent || navigator.vendor || '';

    if (/FBAN|FBAV/i.test(ua)) return 'Facebook';
    if (/Instagram/i.test(ua)) return 'Instagram';
    if (/Line\//i.test(ua)) return 'LINE';
    if (/Twitter|X\//i.test(ua)) return 'Twitter/X';
    if (/MicroMessenger/i.test(ua)) return 'WeChat';
    if (/Snapchat/i.test(ua)) return 'Snapchat';
    if (/TikTok/i.test(ua)) return 'TikTok';

    // WhatsApp in-app browser (Android)
    if (/WhatsApp/i.test(ua)) return 'WhatsApp';

    return null;
}

function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function getErrorMessage(err: any): string {
    const name = err?.name || '';
    const msg = err?.message || '';

    if (name === 'NotAllowedError' || msg.includes('Permission denied') || msg.includes('not allowed')) {
        return 'Izin kamera ditolak. Buka Pengaturan Browser → Izin Situs → aktifkan Kamera untuk situs ini, lalu refresh halaman.';
    }
    if (name === 'NotFoundError' || msg.includes('Requested device not found')) {
        return 'Kamera tidak ditemukan di perangkat ini. Pastikan perangkat Anda memiliki kamera yang berfungsi.';
    }
    if (name === 'NotReadableError' || msg.includes('Could not start video source')) {
        return 'Kamera sedang digunakan oleh aplikasi lain. Tutup aplikasi lain yang menggunakan kamera, lalu coba lagi.';
    }
    if (name === 'OverconstrainedError') {
        return 'Kamera belakang tidak tersedia. Mencoba kamera lain...';
    }
    if (msg.includes('navigator.mediaDevices is not defined') || msg.includes('getUserMedia is not defined')) {
        return 'Browser ini tidak mendukung akses kamera. Silakan gunakan Google Chrome atau Safari versi terbaru.';
    }
    if (name === 'AbortError') {
        return 'Akses kamera dibatalkan. Silakan coba lagi.';
    }
    if (name === 'SecurityError') {
        return 'Akses kamera diblokir oleh kebijakan keamanan browser. Pastikan Anda mengakses situs ini melalui HTTPS.';
    }

    return `Gagal mengakses kamera: ${msg || 'Error tidak diketahui'}. Coba gunakan browser Chrome atau Safari terbaru.`;
}

type PiketStep = 'selfie' | 'sekre_sebelum' | 'sekre_sesudah' | 'review' | 'uploading' | 'done';

const PIKET_STEP_LABELS: Record<PiketStep, string> = {
    selfie: 'Foto Selfie',
    sekre_sebelum: 'Foto Sekre (Sebelum)',
    sekre_sesudah: 'Foto Sekre (Sesudah)',
    review: 'Review & Kirim',
    uploading: 'Mengupload...',
    done: 'Selesai',
};

export default function ScanPage() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasProcessedRef = useRef(false);
    const pendingStartRef = useRef(false);
    const inAppBrowser = typeof window !== 'undefined' ? detectInAppBrowser() : null;

    // Piket photo upload states
    const [piketMode, setPiketMode] = useState(false);
    const [piketStep, setPiketStep] = useState<PiketStep>('selfie');
    const [kehadiranPiketId, setKehadiranPiketId] = useState<number | null>(null);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);
    const [uploadError, setUploadError] = useState('');
    const [uploadProgress, setUploadProgress] = useState('');

    // Camera capture ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    const startScanning = () => {
        setError('');
        hasProcessedRef.current = false;
        pendingStartRef.current = true;
        setScanning(true);
    };

    // Actually start the scanner after the qr-reader div is rendered
    useEffect(() => {
        if (!scanning || !pendingStartRef.current) return;
        pendingStartRef.current = false;

        const initScanner = async () => {
            try {
                const scanner = new Html5Qrcode('qr-reader');
                scannerRef.current = scanner;

                const onScanSuccess = async (decodedText: string) => {
                    // Prevent multiple scans
                    if (hasProcessedRef.current) return;
                    hasProcessedRef.current = true;

                    await stopScanning();

                    setIsProcessing(true);
                    try {
                        // Detect if this is a Piket QR
                        const isPiketQR = decodedText.startsWith('PIKET-');

                        if (isPiketQR) {
                            const response = await api.scanPiket(decodedText);
                            setResult({
                                sukses: response.sukses,
                                pesan: response.pesan,
                                data: response.data as ScanResult['data'],
                            });
                            if (response.sukses && response.data?.kehadiran_piket_id) {
                                setKehadiranPiketId(response.data.kehadiran_piket_id);
                                setPiketMode(true);
                                setPiketStep('selfie');
                            }
                        } else {
                            // Try rapat scan first
                            try {
                                const response = await api.scanQR(decodedText);
                                setResult({
                                    sukses: response.sukses,
                                    pesan: response.pesan,
                                    data: response.data as ScanResult['data'],
                                });
                            } catch (rapatErr: any) {
                                // If rapat fails, try kegiatan
                                try {
                                    const kegiatanResponse = await api.scanKegiatan(decodedText);
                                    setResult({
                                        sukses: kegiatanResponse.sukses,
                                        pesan: kegiatanResponse.pesan,
                                        data: kegiatanResponse.data as ScanResult['data'],
                                    });
                                } catch (kegiatanErr: any) {
                                    setResult({
                                        sukses: false,
                                        pesan: rapatErr.message || 'QR tidak valid',
                                    });
                                }
                            }
                        }
                    } catch (err: any) {
                        setResult({
                            sukses: false,
                            pesan: err.message || 'Gagal memproses QR',
                        });
                    } finally {
                        setIsProcessing(false);
                    }
                };

                const scanConfig = {
                    fps: 10,
                    qrbox: { width: 220, height: 220 },
                    aspectRatio: 1.0,
                    disableFlip: false,
                };

                // Try rear camera first, fallback to any camera
                try {
                    await scanner.start(
                        { facingMode: 'environment' },
                        scanConfig,
                        onScanSuccess,
                        () => { /* QR parse error - ignore */ }
                    );
                } catch (envError: any) {
                    if (envError?.name === 'OverconstrainedError' ||
                        envError?.message?.includes('Overconstrained') ||
                        envError?.message?.includes('Requested device not found')) {
                        console.warn('Rear camera not available, trying any camera...');
                        try {
                            await scanner.start(
                                { facingMode: 'user' },
                                scanConfig,
                                onScanSuccess,
                                () => { }
                            );
                        } catch (userError: any) {
                            try {
                                const devices = await Html5Qrcode.getCameras();
                                if (devices.length > 0) {
                                    await scanner.start(
                                        devices[0].id,
                                        scanConfig,
                                        onScanSuccess,
                                        () => { }
                                    );
                                } else {
                                    throw new Error('Tidak ada kamera yang ditemukan di perangkat ini.');
                                }
                            } catch (fallbackError: any) {
                                throw fallbackError;
                            }
                        }
                    } else {
                        throw envError;
                    }
                }
            } catch (err: any) {
                console.error('Camera error:', err);
                setError(getErrorMessage(err));
                setScanning(false);
            }
        };

        initScanner();
    }, [scanning]);

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                const state = scannerRef.current.getState();
                if (state === 2) {
                    await scannerRef.current.stop();
                }
                scannerRef.current = null;
            } catch (err) {
                console.error('Error stopping scanner:', err);
                scannerRef.current = null;
            }
        }
        setScanning(false);
    };

    useEffect(() => {
        return () => {
            stopScanning();
            // Cleanup photo previews
            photos.forEach(p => URL.revokeObjectURL(p.preview));
        };
    }, []);

    const resetScan = () => {
        setResult(null);
        setError('');
        setPiketMode(false);
        setPiketStep('selfie');
        setKehadiranPiketId(null);
        setUploadError('');
        setUploadProgress('');
        // Cleanup photo previews
        photos.forEach(p => URL.revokeObjectURL(p.preview));
        setPhotos([]);
        hasProcessedRef.current = false;
    };

    // Handle photo capture from file input
    const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const file = files[0];
        const preview = URL.createObjectURL(file);

        setPhotos(prev => [...prev, {
            file,
            preview,
            tipe: piketStep as 'selfie' | 'sekre_sebelum' | 'sekre_sesudah',
        }]);

        // Auto-advance to next step
        if (piketStep === 'selfie') {
            setPiketStep('sekre_sebelum');
        }
        // For sekre photos, stay on same step until user advances manually

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => {
            const newPhotos = [...prev];
            URL.revokeObjectURL(newPhotos[index].preview);
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    const goToNextStep = () => {
        if (piketStep === 'sekre_sebelum') {
            setPiketStep('sekre_sesudah');
        } else if (piketStep === 'sekre_sesudah') {
            setPiketStep('review');
        }
    };

    const goToPrevStep = () => {
        if (piketStep === 'sekre_sebelum') {
            setPiketStep('selfie');
        } else if (piketStep === 'sekre_sesudah') {
            setPiketStep('sekre_sebelum');
        } else if (piketStep === 'review') {
            setPiketStep('sekre_sesudah');
        }
    };

    // Check if current step has required photos
    const hasPhotosForStep = (step: PiketStep): boolean => {
        return photos.some(p => p.tipe === step);
    };

    const canProceed = (): boolean => {
        if (piketStep === 'selfie') return hasPhotosForStep('selfie');
        if (piketStep === 'sekre_sebelum') return hasPhotosForStep('sekre_sebelum');
        if (piketStep === 'sekre_sesudah') return hasPhotosForStep('sekre_sesudah');
        return true;
    };

    const getPhotosForStep = (step: string): PhotoItem[] => {
        return photos.filter(p => p.tipe === step);
    };

    // Upload all photos
    const handleUpload = async () => {
        if (!kehadiranPiketId) return;

        setPiketStep('uploading');
        setUploadError('');

        try {
            const files = photos.map(p => p.file);
            const tipeList = photos.map(p => p.tipe);
            setUploadProgress(`Mengupload ${files.length} foto...`);
            await api.uploadBuktiPiket(kehadiranPiketId, files, tipeList);
            setPiketStep('done');
        } catch (err: any) {
            setUploadError(err.message || 'Gagal mengupload foto');
            setPiketStep('review');
        }
    };

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    // Render piket photo upload flow
    const renderPiketFlow = () => {
        if (!piketMode) return null;

        const stepOrder: PiketStep[] = ['selfie', 'sekre_sebelum', 'sekre_sesudah', 'review'];
        const currentStepIndex = stepOrder.indexOf(piketStep);

        return (
            <motion.div
                className={styles.piketFlow}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                {/* Step Indicator */}
                {piketStep !== 'uploading' && piketStep !== 'done' && (
                    <div className={styles.stepIndicator}>
                        {stepOrder.map((step, i) => (
                            <div
                                key={step}
                                className={`${styles.stepDot} ${i <= currentStepIndex ? styles.stepActive : ''} ${i < currentStepIndex ? styles.stepDone : ''}`}
                            >
                                <span className={styles.stepNumber}>
                                    {i < currentStepIndex ? '✓' : i + 1}
                                </span>
                                <span className={styles.stepLabel}>
                                    {step === 'selfie' ? 'Selfie' :
                                        step === 'sekre_sebelum' ? 'Sebelum' :
                                            step === 'sekre_sesudah' ? 'Sesudah' : 'Kirim'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Photo capture steps */}
                {(piketStep === 'selfie' || piketStep === 'sekre_sebelum' || piketStep === 'sekre_sesudah') && (
                    <div className={styles.captureSection}>
                        <h3 className={styles.stepTitle}>
                            {piketStep === 'selfie' && '📸 Ambil Foto Selfie'}
                            {piketStep === 'sekre_sebelum' && '🏢 Foto Sekretariat (Sebelum Bersih)'}
                            {piketStep === 'sekre_sesudah' && '✨ Foto Sekretariat (Sesudah Bersih)'}
                        </h3>
                        <p className={styles.stepDesc}>
                            {piketStep === 'selfie' && 'Ambil foto diri Anda sebagai bukti kehadiran piket'}
                            {piketStep === 'sekre_sebelum' && 'Ambil foto kondisi sekretariat sebelum dibersihkan'}
                            {piketStep === 'sekre_sesudah' && 'Ambil foto kondisi sekretariat setelah dibersihkan'}
                        </p>

                        {/* Preview photos for this step */}
                        {getPhotosForStep(piketStep).length > 0 && (
                            <div className={styles.photoGrid}>
                                {getPhotosForStep(piketStep).map((photo, i) => {
                                    const globalIndex = photos.indexOf(photo);
                                    return (
                                        <div key={i} className={styles.photoPreview}>
                                            <img src={photo.preview} alt={`Foto ${i + 1}`} />
                                            <button
                                                className={styles.removePhotoBtn}
                                                onClick={() => removePhoto(globalIndex)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Camera capture button */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture={piketStep === 'selfie' ? 'user' : 'environment'}
                            onChange={handlePhotoCapture}
                            style={{ display: 'none' }}
                        />

                        <div className={styles.captureActions}>
                            {(piketStep === 'selfie' ? getPhotosForStep('selfie').length === 0 : true) && (
                                <motion.button
                                    className={`btn btn-primary ${styles.captureBtn}`}
                                    onClick={() => fileInputRef.current?.click()}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                    {getPhotosForStep(piketStep).length > 0 ? 'Tambah Foto' : 'Ambil Foto'}
                                </motion.button>
                            )}
                        </div>

                        {/* Navigation */}
                        <div className={styles.stepNav}>
                            {piketStep !== 'selfie' && (
                                <button className="btn btn-secondary" onClick={goToPrevStep}>
                                    ← Kembali
                                </button>
                            )}
                            {canProceed() && (
                                <motion.button
                                    className="btn btn-primary"
                                    onClick={goToNextStep}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Lanjut →
                                </motion.button>
                            )}
                        </div>
                    </div>
                )}

                {/* Review step */}
                {piketStep === 'review' && (
                    <div className={styles.reviewSection}>
                        <h3 className={styles.stepTitle}>📋 Review Bukti Piket</h3>

                        {uploadError && (
                            <div className={styles.errorBox}>
                                <p>{uploadError}</p>
                            </div>
                        )}

                        <div className={styles.reviewGroups}>
                            {(['selfie', 'sekre_sebelum', 'sekre_sesudah'] as const).map(tipe => {
                                const tipePhotos = getPhotosForStep(tipe);
                                return (
                                    <div key={tipe} className={styles.reviewGroup}>
                                        <h4>
                                            {tipe === 'selfie' && '📸 Selfie'}
                                            {tipe === 'sekre_sebelum' && '🏢 Sekre (Sebelum)'}
                                            {tipe === 'sekre_sesudah' && '✨ Sekre (Sesudah)'}
                                            <span className={styles.photoCount}>{tipePhotos.length} foto</span>
                                        </h4>
                                        <div className={styles.photoGrid}>
                                            {tipePhotos.map((photo, i) => (
                                                <div key={i} className={styles.photoPreview}>
                                                    <img src={photo.preview} alt={`${tipe} ${i + 1}`} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.stepNav}>
                            <button className="btn btn-secondary" onClick={goToPrevStep}>
                                ← Kembali
                            </button>
                            <motion.button
                                className="btn btn-primary"
                                onClick={handleUpload}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                ✅ Kirim Bukti
                            </motion.button>
                        </div>
                    </div>
                )}

                {/* Uploading state */}
                {piketStep === 'uploading' && (
                    <div className={styles.uploadingSection}>
                        <div className="loader"></div>
                        <p>{uploadProgress}</p>
                    </div>
                )}

                {/* Done state */}
                {piketStep === 'done' && (
                    <div className={styles.doneSection}>
                        <div className={styles.successIcon}>
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                        </div>
                        <h2>Bukti Piket Berhasil Dikirim! 🎉</h2>
                        <p>Foto selfie dan foto sekretariat telah diupload</p>
                        <motion.button
                            className="btn btn-primary btn-lg w-full mt-4"
                            onClick={resetScan}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Selesai
                        </motion.button>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <motion.div
            className={styles.container}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
        >
            <div className={styles.header}>
                <h1>Scan QR Absensi</h1>
                <p>Arahkan kamera ke QR Code untuk mencatat kehadiran</p>
            </div>

            {/* In-App Browser Warning */}
            {inAppBrowser && (
                <motion.div
                    className={styles.inAppWarning}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className={styles.warningIcon}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                            <line x1="12" y1="9" x2="12" y2="13" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                    </div>
                    <p>
                        Anda membuka di browser <strong>{inAppBrowser}</strong> yang
                        mungkin tidak bisa mengakses kamera.
                    </p>
                    <p className={styles.warningHint}>
                        {isIOS()
                            ? 'Tap ikon ⋯ di bawah → pilih "Buka di Safari"'
                            : 'Tap ikon ⋮ di kanan atas → pilih "Buka di Chrome"'}
                    </p>
                    <button
                        className={styles.copyLinkBtn}
                        onClick={() => {
                            navigator.clipboard?.writeText(currentUrl).then(() => {
                                alert('Link berhasil disalin! Buka di Chrome atau Safari.');
                            }).catch(() => {
                                prompt('Salin link ini:', currentUrl);
                            });
                        }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Salin Link
                    </button>
                </motion.div>
            )}

            {/* Scanner Area */}
            {!result && (
                <div className={styles.scannerArea}>
                    {!scanning ? (
                        <motion.div
                            className={styles.startPrompt}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                        >
                            <div className={styles.cameraIcon}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                    <circle cx="12" cy="13" r="4" />
                                </svg>
                            </div>
                            <p>Tekan tombol di bawah untuk memulai scan</p>
                            {error && (
                                <div className={styles.errorBox}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="12" y1="8" x2="12" y2="12" />
                                        <line x1="12" y1="16" x2="12.01" y2="16" />
                                    </svg>
                                    <p>{error}</p>
                                </div>
                            )}
                            <motion.button
                                className="btn btn-primary btn-lg"
                                onClick={startScanning}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                                    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                                    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                                    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                                </svg>
                                Mulai Scan
                            </motion.button>
                        </motion.div>
                    ) : (
                        <div className={styles.scannerContainer}>
                            <div id="qr-reader" className={styles.qrReader}></div>
                            <div className={styles.scanOverlay}>
                                <div className={styles.scanFrame}></div>
                            </div>
                            <button className="btn btn-secondary mt-4" onClick={stopScanning}>
                                Batal
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Processing */}
            <AnimatePresence>
                {isProcessing && (
                    <motion.div
                        className={styles.processingOverlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <div className="loader"></div>
                        <p>Memproses...</p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result */}
            <AnimatePresence>
                {result && (
                    <motion.div
                        className={styles.resultContainer}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        {result.sukses ? (
                            <>
                                {/* Piket scan success → show photo flow */}
                                {piketMode ? (
                                    <div className={styles.resultSuccess}>
                                        <div className={styles.piketScanSuccess}>
                                            <div className={styles.successIcon}>
                                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                    <polyline points="22 4 12 14.01 9 11.01" />
                                                </svg>
                                            </div>
                                            <h2>Absensi Piket Tercatat! ✅</h2>
                                            <p className={styles.piketSubtext}>
                                                Sekarang upload bukti foto piket Anda
                                            </p>
                                        </div>
                                        {renderPiketFlow()}
                                    </div>
                                ) : (
                                    /* Rapat/normal scan success */
                                    <div className={styles.resultSuccess}>
                                        <div className={styles.successIcon}>
                                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                        </div>
                                        <h2>Kehadiran Tercatat! 🎉</h2>
                                        <div className={styles.resultInfo}>
                                            {result.data?.rapat && (
                                                <div className={styles.infoItem}>
                                                    <span>Rapat</span>
                                                    <strong>{result.data.rapat}</strong>
                                                </div>
                                            )}
                                            {result.data?.jenis_rapat && (
                                                <div className={styles.infoItem}>
                                                    <span>Jenis</span>
                                                    <strong>{result.data.jenis_rapat}</strong>
                                                </div>
                                            )}
                                            {result.data?.tanggal && (
                                                <div className={styles.infoItem}>
                                                    <span>Tanggal</span>
                                                    <strong>{new Date(result.data.tanggal).toLocaleDateString('id-ID', {
                                                        day: 'numeric', month: 'long', year: 'numeric'
                                                    })}</strong>
                                                </div>
                                            )}
                                            {result.data?.lokasi && (
                                                <div className={styles.infoItem}>
                                                    <span>Lokasi</span>
                                                    <strong>{result.data.lokasi}</strong>
                                                </div>
                                            )}
                                            {result.data?.waktu_scan && (
                                                <div className={styles.infoItem}>
                                                    <span>Waktu Scan</span>
                                                    <strong>{new Date(result.data.waktu_scan).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}</strong>
                                                </div>
                                            )}
                                        </div>
                                        <motion.button
                                            className="btn btn-primary btn-lg w-full mt-4"
                                            onClick={resetScan}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            Scan Lagi
                                        </motion.button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className={styles.resultError}>
                                <div className={styles.errorIcon}>
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <line x1="15" y1="9" x2="9" y2="15" />
                                        <line x1="9" y1="9" x2="15" y2="15" />
                                    </svg>
                                </div>
                                <h2>Gagal!</h2>
                                <p>{result.pesan}</p>
                                <motion.button
                                    className="btn btn-primary btn-lg w-full mt-4"
                                    onClick={resetScan}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Scan Lagi
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
