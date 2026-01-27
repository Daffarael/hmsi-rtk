'use client';

import { useEffect, useState } from 'react';

export default function CustomCursor() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [isClicking, setIsClicking] = useState(false);
    const [isMobile, setIsMobile] = useState(true);

    useEffect(() => {
        // Check if mobile
        if (typeof window !== 'undefined') {
            setIsMobile(window.innerWidth < 1024);
            if (window.innerWidth < 1024) return;
        }

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        const handleMouseEnter = () => {
            setIsVisible(true);
        };

        const handleMouseDown = () => {
            setIsClicking(true);
        };

        const handleMouseUp = () => {
            setIsClicking(false);
        };

        const handleHoverCheck = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isHoverable =
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('a') ||
                target.closest('button') ||
                window.getComputedStyle(target).cursor === 'pointer';

            setIsHovering(!!isHoverable);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mousemove', handleHoverCheck);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mousemove', handleHoverCheck);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
            document.removeEventListener('mousedown', handleMouseDown);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    // Don't render on mobile
    if (isMobile) {
        return null;
    }

    return (
        <>
            {/* Main cursor dot */}
            <div
                className="custom-cursor-dot"
                style={{
                    left: position.x,
                    top: position.y,
                    opacity: isVisible ? 1 : 0,
                    transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : 1})`,
                }}
            />
            {/* Cursor ring */}
            <div
                className="custom-cursor-ring"
                style={{
                    left: position.x,
                    top: position.y,
                    opacity: isVisible ? 1 : 0,
                    transform: `translate(-50%, -50%) scale(${isHovering ? 1.5 : isClicking ? 0.8 : 1})`,
                    borderColor: isHovering ? 'var(--utama-500)' : 'var(--utama-400)',
                }}
            />
        </>
    );
}
