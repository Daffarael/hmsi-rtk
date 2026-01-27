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

export default function ScanPage() {
    const [scanning, setScanning] = useState(false);
    const [result, setResult] = useState<ScanResult | null>(null);
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const startScanning = async () => {
        setError('');
        setResult(null);

        try {
            const scanner = new Html5Qrcode('qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                async (decodedText) => {
                    // Stop scanner first
                    await stopScanning();

                    // Process the QR code
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
                },
                () => {
                    // QR code parse error - ignore
                }
            );

            setScanning(true);
        } catch (err: any) {
            setError(err.message || 'Gagal mengakses kamera');
        }
    };

    const stopScanning = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current = null;
            } catch (err) {
                console.error('Error stopping scanner:', err);
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
                            {error && <p className={styles.errorText}>{error}</p>}
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
