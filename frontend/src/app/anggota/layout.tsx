'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import PremiumLoader from '@/components/PremiumLoader';
import styles from './anggota-layout.module.css';

const menuItems = [
    { href: '/anggota', label: 'Dasbor', icon: 'home' },
    { href: '/anggota/jadwal', label: 'Jadwal', icon: 'calendar' },
    { href: '/anggota/scan', label: 'Scan QR', icon: 'scan' },
    { href: '/anggota/riwayat', label: 'Riwayat', icon: 'history' },
];

const icons: Record<string, JSX.Element> = {
    home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    scan: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><rect x="7" y="7" width="10" height="10" /></svg>,
    history: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
};

export default function AnggotaLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { pengguna, loading, keluar } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!pengguna) {
                router.push('/masuk');
            } else if (pengguna.peran === 'admin') {
                router.push('/admin');
            }
        }
    }, [pengguna, loading, router]);

    if (loading || !pengguna) {
        return (
            <div className="loader-overlay">
                <PremiumLoader size="lg" />
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <div className={styles.logo}>
                        <img src="/images/Logo-HMSI.png" alt="HMSI" className={styles.logoImg} />
                        <span className={styles.logoText}>Absensi</span>
                    </div>
                </div>
                <div className={styles.headerRight}>
                    <button className={styles.profileBtn} onClick={() => setMenuOpen(!menuOpen)}>
                        <div className={styles.avatar}>
                            {pengguna.nama_panggilan.charAt(0).toUpperCase()}
                        </div>
                    </button>
                </div>
            </header>

            {/* Profile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        <motion.div
                            className={styles.menuOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMenuOpen(false)}
                        />
                        <motion.div
                            className={styles.profileMenu}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className={styles.profileHeader}>
                                <div className={styles.avatarLarge}>
                                    {pengguna.nama_panggilan.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <p className={styles.profileName}>{pengguna.nama_lengkap}</p>
                                    <p className={styles.profileNim}>{pengguna.nim}</p>
                                </div>
                            </div>
                            <div className={styles.menuDivider} />
                            <div className={styles.profileInfo}>
                                <div className={styles.infoItem}>
                                    <span>Divisi</span>
                                    <span>{pengguna.divisi?.nama || '-'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span>Angkatan</span>
                                    <span>{pengguna.angkatan || '-'}</span>
                                </div>
                                <div className={styles.infoItem}>
                                    <span>Periode</span>
                                    <span>{pengguna.periode?.nama || '-'}</span>
                                </div>
                            </div>
                            <div className={styles.menuDivider} />
                            <button className={styles.logoutBtn} onClick={keluar}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                                Keluar
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Content */}
            <main className={styles.content}>
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className={styles.bottomNav}>
                {menuItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
                    >
                        {icons[item.icon]}
                        <span>{item.label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
