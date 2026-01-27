'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
    onComplete?: () => void;
    minDuration?: number;
}

export default function LoadingScreen({ onComplete, minDuration = 2000 }: LoadingScreenProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // Animate progress
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + 2;
            });
        }, minDuration / 50);

        // Hide after minimum duration
        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, minDuration);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [minDuration, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="loading-screen"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                    {/* Background gradient */}
                    <div className="loading-bg">
                        <div className="loading-blob loading-blob-1"></div>
                        <div className="loading-blob loading-blob-2"></div>
                    </div>

                    {/* Content */}
                    <div className="loading-content">
                        {/* Logo */}
                        <motion.div
                            className="loading-logo"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                        >
                            <img src="/images/Logo-HMSI.png" alt="HMSI" />
                        </motion.div>

                        {/* Text Reveal */}
                        <div className="loading-text-container">
                            <motion.div
                                className="loading-text"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                            >
                                <span className="loading-letter" style={{ animationDelay: '0s' }}>H</span>
                                <span className="loading-letter" style={{ animationDelay: '0.1s' }}>M</span>
                                <span className="loading-letter" style={{ animationDelay: '0.2s' }}>S</span>
                                <span className="loading-letter" style={{ animationDelay: '0.3s' }}>I</span>
                            </motion.div>
                            <motion.p
                                className="loading-subtitle"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.6, duration: 0.5 }}
                            >
                                Sistem Absensi
                            </motion.p>
                        </div>

                        {/* Progress bar */}
                        <motion.div
                            className="loading-progress-container"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: '200px' }}
                            transition={{ delay: 0.8, duration: 0.3 }}
                        >
                            <div className="loading-progress-bar">
                                <motion.div
                                    className="loading-progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="loading-progress-text">{progress}%</span>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
