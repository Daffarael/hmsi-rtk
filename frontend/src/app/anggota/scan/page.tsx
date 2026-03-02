'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Html5Qrcode } from 'html5-qrcode';
import api from '@/lib/api';
import styles from './scan.module.css';

interface ScanResult {
    sukses: boolean;
    pesan?: string;
    data?: {
        rapat: string;
        jenis_rapat?: string;
        tanggal: string;
        lokasi?: string;
        waktu_scan: string;
    };
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
    // On iOS, WhatsApp opens links in Safari, but on Android it uses in-app
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

export default function ScanPage() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [inAppBrowser, setInAppBrowser] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const hasProcessedRef = useRef(false);
    const pendingStartRef = useRef(false);

    // Check for in-app browser on mount
    useEffect(() => {
        setInAppBrowser(detectInAppBrowser());
    }, []);

    // Hide any file input that html5-qrcode might create (enforce camera-only)
    useEffect(() => {
        if (!scanning) return;

        const hideFileInputs = () => {
            const fileInputs = document.querySelectorAll('#qr-reader input[type="file"]');
            fileInputs.forEach((input) => {
                (input as HTMLElement).style.display = 'none';
            });
            // Also hide the "scan from file" text/buttons
            const buttons = document.querySelectorAll('#qr-reader a, #qr-reader span[style]');
            buttons.forEach((el) => {
                const text = el.textContent?.toLowerCase() || '';
                if (text.includes('file') || text.includes('image') || text.includes('galeri')) {
                    (el as HTMLElement).style.display = 'none';
                }
            });
        };

        // Run immediately and also observe for dynamically added elements
        hideFileInputs();
        const observer = new MutationObserver(hideFileInputs);
        const container = document.getElementById('qr-reader');
        if (container) {
            observer.observe(container, { childList: true, subtree: true });
        }

        return () => observer.disconnect();
    }, [scanning]);

    const startScanning = async () => {
        setError('');
        setResult(null);
        hasProcessedRef.current = false;

        // Check secure context
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            setError('Kamera hanya bisa diakses melalui HTTPS. Hubungi admin untuk mengaktifkan SSL.');
            return;
        }

        // Check if mediaDevices API exists
        if (!navigator?.mediaDevices?.getUserMedia) {
            setError('Browser ini tidak mendukung akses kamera. Silakan gunakan Google Chrome atau Safari versi terbaru.');
            return;
        }

        // First set scanning to true so the qr-reader div renders
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
                        const response = await api.scanQR(decodedText);
                        setResult({
                            sukses: response.sukses,
                            pesan: response.pesan,
                            data: response.data as ScanResult['data'],
                        });
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
                    // If rear camera fails with OverconstrainedError, try any camera
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
                            // Last resort: try without any facing mode constraint
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
                // Only stop if scanning (state 2 = SCANNING)
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
        };
    }, []);

    const resetScan = () => {
        setResult(null);
        setError('');
        hasProcessedRef.current = false;
    };

    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

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
                            <div className={styles.resultSuccess}>
                                <div className={styles.successIcon}>
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                        <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                </div>
                                <h2>Kehadiran Tercatat! 🎉</h2>
                                <div className={styles.resultInfo}>
                                    <div className={styles.infoItem}>
                                        <span>Rapat</span>
                                        <strong>{result.data?.rapat}</strong>
                                    </div>
                                    {result.data?.jenis_rapat && (
                                        <div className={styles.infoItem}>
                                            <span>Jenis</span>
                                            <strong>{result.data.jenis_rapat}</strong>
                                        </div>
                                    )}
                                    <div className={styles.infoItem}>
                                        <span>Tanggal</span>
                                        <strong>{new Date(result.data?.tanggal || '').toLocaleDateString('id-ID', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}</strong>
                                    </div>
                                    {result.data?.lokasi && (
                                        <div className={styles.infoItem}>
                                            <span>Lokasi</span>
                                            <strong>{result.data.lokasi}</strong>
                                        </div>
                                    )}
                                    <div className={styles.infoItem}>
                                        <span>Waktu Scan</span>
                                        <strong>{new Date(result.data?.waktu_scan || '').toLocaleTimeString('id-ID', {
                                            hour: '2-digit', minute: '2-digit'
                                        })}</strong>
                                    </div>
                                </div>
                            </div>
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
                            </div>
                        )}
                        <motion.button
                            className="btn btn-primary btn-lg w-full mt-4"
                            onClick={resetScan}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Scan Lagi
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
