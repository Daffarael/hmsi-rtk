'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import PremiumLoader from '@/components/PremiumLoader';
import styles from './admin.module.css';

const menuItems = [
    { href: '/admin', label: 'Dasbor', icon: 'home' },
    { href: '/admin/anggota', label: 'Anggota', icon: 'users' },
    { href: '/admin/divisi', label: 'Divisi', icon: 'folder' },
    { href: '/admin/jenis-rapat', label: 'Jenis Rapat', icon: 'tag' },
    { href: '/admin/rapat', label: 'Rapat', icon: 'calendar' },
    { href: '/admin/piket', label: 'Piket', icon: 'clipboard' },
    { href: '/admin/kegiatan', label: 'Kegiatan', icon: 'star' },
    { href: '/admin/leaderboard', label: 'Leaderboard', icon: 'chart' },
    { href: '/admin/of-the-month', label: 'Of The Month', icon: 'trophy' },
    { href: '/admin/laporan', label: 'Laporan', icon: 'file' },
];

const icons: Record<string, JSX.Element> = {
    home: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>,
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
    folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /></svg>,
    tag: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
    calendar: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
    clipboard: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" /></svg>,
    chart: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>,
    star: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
    trophy: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>,
    file: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { pengguna, loading, keluar } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [profileOpen, setProfileOpen] = useState(false);
    const [showAkhiriModal, setShowAkhiriModal] = useState(false);
    const [konfirmasiStep, setKonfirmasiStep] = useState(1);
    const [konfirmasiTeks, setKonfirmasiTeks] = useState('');
    const [isEnding, setIsEnding] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!pengguna) {
                router.push('/masuk');
            } else if (pengguna.peran !== 'admin') {
                router.push('/anggota');
            } else if (pengguna.masa_jabatan_habis) {
                router.push('/transfer-admin');
            }
        }
    }, [pengguna, loading, router]);

    const handleAkhiriJabatan = async () => {
        if (konfirmasiStep === 1) {
            setKonfirmasiStep(2);
            return;
        }

        if (konfirmasiTeks !== 'Akhiri Masa Jabatan') {
            alert('Teks konfirmasi tidak sesuai');
            return;
        }

        setIsEnding(true);
        try {
            await api.akhiriJabatan(konfirmasiTeks);
            router.push('/transfer-admin');
        } catch (error) {
            alert('Gagal mengakhiri masa jabatan');
        } finally {
            setIsEnding(false);
        }
    };

    if (loading || !pengguna) {
        return (
            <div className="loader-overlay">
                <PremiumLoader size="lg" />
            </div>
        );
    }

    return (
        <div className={styles.layout}>
            {/* Sidebar */}
            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                <div className={styles.sidebarHeader}>
                    <div className={styles.logo}>
                        <img src="/images/Logo-HMSI.png" alt="HMSI" className={styles.logoImg} />
                        <span className={styles.logoText}>Admin Panel</span>
                    </div>
                    <button className={styles.closeSidebar} onClick={() => setSidebarOpen(false)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>

                <nav className={styles.sidebarNav}>
                    {menuItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.navItemActive : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            {icons[item.icon]}
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className={styles.sidebarFooter}>
                    <p className={styles.periodLabel}>Periode Aktif</p>
                    <p className={styles.periodValue}>{pengguna.periode?.nama || '-'}</p>
                </div>
            </aside>

            {/* Overlay */}
            {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />}

            {/* Main Content */}
            <div className={styles.main}>
                {/* Header */}
                <header className={styles.header}>
                    <button className={styles.menuButton} onClick={() => setSidebarOpen(true)}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                        </svg>
                    </button>

                    <div className={styles.headerRight}>
                        <div className={styles.profileContainer}>
                            <button className={styles.profileButton} onClick={() => setProfileOpen(!profileOpen)}>
                                <div className={styles.avatar}>
                                    {pengguna.nama_panggilan?.charAt(0).toUpperCase()}
                                </div>
                                <span className={styles.profileName}>{pengguna.nama_lengkap}</span>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="6 9 12 15 18 9" />
                                </svg>
                            </button>

                            <AnimatePresence>
                                {profileOpen && (
                                    <motion.div
                                        className={styles.profileDropdown}
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                    >
                                        <div className={styles.dropdownHeader}>
                                            <p className={styles.dropdownName}>{pengguna.nama_lengkap}</p>
                                            <p className={styles.dropdownRole}>Administrator</p>
                                        </div>
                                        <div className={styles.dropdownDivider} />
                                        <button className={styles.dropdownItem} onClick={() => setShowAkhiriModal(true)}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            Akhiri Masa Jabatan
                                        </button>
                                        <div className={styles.dropdownDivider} />
                                        <button className={styles.dropdownItem} onClick={keluar}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                                <polyline points="16 17 21 12 16 7" />
                                                <line x1="21" y1="12" x2="9" y2="12" />
                                            </svg>
                                            Keluar
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <main className={styles.content}>
                    {children}
                </main>
            </div>

            {/* Modal Akhiri Jabatan */}
            <AnimatePresence>
                {showAkhiriModal && (
                    <motion.div
                        className="modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div className="modal-header">
                                <h3>Akhiri Masa Jabatan</h3>
                            </div>
                            <div className="modal-body">
                                {konfirmasiStep === 1 ? (
                                    <>
                                        <p style={{ marginBottom: '1rem' }}>
                                            Apakah sudah ada calon admin baru yang akan menggantikan Anda?
                                        </p>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--abu-500)' }}>
                                            Pastikan Anda telah menentukan siapa yang akan menjadi admin selanjutnya sebelum mengakhiri masa jabatan.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p style={{ marginBottom: '1rem' }}>
                                            Untuk mengkonfirmasi, ketik <strong>"Akhiri Masa Jabatan"</strong> di bawah ini:
                                        </p>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ketik di sini..."
                                            value={konfirmasiTeks}
                                            onChange={(e) => setKonfirmasiTeks(e.target.value)}
                                        />
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowAkhiriModal(false);
                                        setKonfirmasiStep(1);
                                        setKonfirmasiTeks('');
                                    }}
                                >
                                    Batal
                                </button>
                                <button
                                    className="btn btn-danger"
                                    onClick={handleAkhiriJabatan}
                                    disabled={konfirmasiStep === 2 && konfirmasiTeks !== 'Akhiri Masa Jabatan'}
                                >
                                    {konfirmasiStep === 1 ? 'Sudah Ada' : isEnding ? 'Memproses...' : 'Konfirmasi'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
