'use client';

import { useState, useEffect } from 'react';

interface PremiumLoaderProps {
    size?: 'sm' | 'md' | 'lg';
}

export default function PremiumLoader({ size = 'md' }: PremiumLoaderProps) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCount(prev => {
                if (prev >= 100) {
                    return 0;
                }
                return prev + Math.floor(Math.random() * 15) + 5;
            });
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const displayCount = Math.min(count, 99);

    const sizeClasses = {
        sm: 'premium-loader-sm',
        md: 'premium-loader-md',
        lg: 'premium-loader-lg',
    };

    return (
        <div className={`premium-loader ${sizeClasses[size]}`}>
            <div className="premium-loader-numbers">
                <span className="premium-loader-digit">{Math.floor(displayCount / 10)}</span>
                <span className="premium-loader-digit">{displayCount % 10}</span>
            </div>
            <div className="premium-loader-bar">
                <div className="premium-loader-bar-fill" style={{ width: `${count}%` }} />
            </div>
        </div>
    );
}
