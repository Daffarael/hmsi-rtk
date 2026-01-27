'use client';

import { useState, useEffect, ReactNode } from 'react';
import LoadingScreen from './LoadingScreen';

interface ClientWrapperProps {
    children: ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if this is first visit in session
        const hasLoaded = sessionStorage.getItem('hmsi-loaded');
        if (hasLoaded) {
            setIsLoading(false);
        }
    }, []);

    const handleLoadingComplete = () => {
        sessionStorage.setItem('hmsi-loaded', 'true');
        setIsLoading(false);
    };

    return (
        <>
            {isLoading && <LoadingScreen onComplete={handleLoadingComplete} minDuration={2500} />}
            {children}
        </>
    );
}
