'use client';

import { useState, useEffect, ReactNode } from 'react';
import LoadingScreen from './LoadingScreen';

interface ClientWrapperProps {
    children: ReactNode;
}

export default function ClientWrapper({ children }: ClientWrapperProps) {
    return <>{children}</>;
}
