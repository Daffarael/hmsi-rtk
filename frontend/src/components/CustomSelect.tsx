'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SelectOption {
    value: string | number;
    label: string;
}

interface CustomSelectProps {
    value: string | number;
    onChange: (value: string | number) => void;
    options: SelectOption[];
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export default function CustomSelect({
    value,
    onChange,
    options,
    placeholder = 'Pilih...',
    required,
    className = ''
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);

    // Menutup dropdown kalau klik di luar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const safeOptions = options || [];
    const selectedOption = safeOptions.find((opt) => {
        if (opt.value === value) return true;
        if (opt.value != null && value != null && opt.value.toString() === value.toString()) return true;
        return false;
    });

    return (
        <div className={`custom-select-container ${className}`} ref={selectRef}>
            {/* Native select yang disembunyikan untuk keperluan validasi HTML form (required) */}
            <select
                className="hidden-native-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                style={{ opacity: 0, position: 'absolute', zIndex: -1, width: 0, height: 0 }}
                tabIndex={-1}
            >
                <option value="">{placeholder}</option>
                {safeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>

            <motion.div
                className={`input-field custom-select-trigger ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
            >
                <span className={`selected-value ${!selectedOption ? 'placeholder' : ''}`}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.svg
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none"
                    stroke={isOpen ? '#F97316' : '#6B7280'} strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round"
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </motion.svg>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="custom-select-dropdown"
                        initial={{ opacity: 0, y: -10, scaleY: 0.95 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -10, scaleY: 0.95 }}
                        transition={{ type: 'spring', stiffness: 250, damping: 20 }}
                        style={{ originY: 0 }}
                    >
                        {placeholder && (
                            <div
                                className={`custom-select-option ${!value ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange('');
                                    setIsOpen(false);
                                }}
                            >
                                {placeholder}
                            </div>
                        )}
                        {safeOptions.map((opt) => (
                            <div
                                key={opt.value}
                                className={`custom-select-option ${value === opt.value || (opt.value != null && value != null && value.toString() === opt.value.toString()) ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                                {(value === opt.value || (opt.value != null && value != null && value.toString() === opt.value.toString())) && (
                                    <motion.svg
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                                        stroke="#F97316" strokeWidth="3"
                                        strokeLinecap="round" strokeLinejoin="round"
                                        className="check-icon"
                                    >
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </motion.svg>
                                )}
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
