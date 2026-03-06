'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import api from '@/lib/api';
import styles from './rapat.module.css';

interface Rapat {
    id: number;
    nama: string;
    deskripsi: string | null;
    tanggal_rapat: string;
    waktu_rapat: string | null;
    lokasi: string | null;
    kode_qr: string;
    dipublikasikan: boolean;
    dipublikasikan_pada: string | null;
    kadaluarsa_pada: string | null;
    jumlah_hadir: number;
    jenis_rapat?: { id: number; nama: string };
}

interface JenisRapat {
    id: number;
    nama: string;
}

export default function RapatPage() {
    const [rapat, setRapat] = useState<Rapat[]>([]);
    const [jenisRapat, setJenisRapat] = useState<JenisRapat[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Rapat | null>(null);

    const [formData, setFormData] = useState({
        nama: '',
        deskripsi: '',
        tanggal_rapat: '',
        waktu_rapat: '',
        lokasi: '',
        jenis_rapat_id: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Publikasi modal
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishRapat, setPublishRapat] = useState<Rapat | null>(null);
    const [durasiMenit, setDurasiMenit] = useState('60');

    const fetchData = async () => {
        try {
            const [rapatRes, jenisRes] = await Promise.all([
                api.semuaRapat(),
                api.semuaJenisRapat(),
            ]);
            setRapat(Array.isArray(rapatRes.data) ? rapatRes.data : []);
            setJenisRapat(Array.isArray(jenisRes.data) ? jenisRes.data : []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAddModal = () => {
        setEditData(null);
        setFormData({
            nama: '',
            deskripsi: '',
            tanggal_rapat: '',
            waktu_rapat: '',
            lokasi: '',
            jenis_rapat_id: '',
        });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (data: Rapat) => {
        setEditData(data);
        setFormData({
            nama: data.nama,
            deskripsi: data.deskripsi || '',
            tanggal_rapat: data.tanggal_rapat,
            waktu_rapat: data.waktu_rapat || '',
            lokasi: data.lokasi || '',
            jenis_rapat_id: data.jenis_rapat?.id.toString() || '',
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                jenis_rapat_id: formData.jenis_rapat_id ? parseInt(formData.jenis_rapat_id) : null,
            };

            if (editData) {
                await api.updateRapat(editData.id, payload);
            } else {
                await api.buatRapat(payload);
            }

            setShowModal(false);
            fetchData();
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number, nama: string) => {
        if (!confirm(`Yakin ingin menghapus rapat "${nama}"?`)) return;

        try {
            await api.hapusRapat(id);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus');
        }
    };

    const handlePublish = async () => {
        if (!publishRapat) return;

        try {
            await api.publikasiQR(publishRapat.id, parseInt(durasiMenit) || undefined);
            setShowPublishModal(false);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal publikasi');
        }
    };

    const handleUnpublish = async (id: number) => {
        if (!confirm('Batalkan publikasi QR?')) return;

        try {
            await api.batalkanPublikasi(id);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal batalkan publikasi');
        }
    };

    const isExpired = (kadaluarsaPada: string | null) => {
        if (!kadaluarsaPada) return false;
        return new Date(kadaluarsaPada) < new Date();
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={styles.container}
        >
            {/* Header */}
            <div className={styles.header}>
                <div>
                    <h1>Kelola Rapat</h1>
                    <p>Buat dan kelola rapat serta QR code absensi</p>
                </div>
                <motion.button
                    className="btn btn-primary"
                    onClick={openAddModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Buat Rapat
                </motion.button>
            </div>

            {/* Rapat Grid */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className="loader"></div>
                </div>
            ) : rapat.length > 0 ? (
                <div className={styles.rapatGrid}>
                    {rapat.map((r, index) => (
                        <motion.div
                            key={r.id}
                            className={styles.rapatCard}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className={styles.cardHeader}>
                                <div className={styles.rapatDate}>
                                    <span className={styles.day}>{new Date(r.tanggal_rapat).getDate()}</span>
                                    <span className={styles.month}>
                                        {new Date(r.tanggal_rapat).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className={styles.rapatStatus}>
                                    {r.dipublikasikan ? (
                                        isExpired(r.kadaluarsa_pada) ? (
                                            <span className="badge badge-danger">Kadaluarsa</span>
                                        ) : (
                                            <span className="badge badge-success">Aktif</span>
                                        )
                                    ) : (
                                        <span className="badge badge-warning">Draft</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.cardBody}>
                                <h3 className={styles.rapatNama}>{r.nama}</h3>
                                <p className={styles.rapatJenis}>{r.jenis_rapat?.nama || 'Tanpa Jenis'}</p>
                                {r.lokasi && (
                                    <p className={styles.rapatLokasi}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                            <circle cx="12" cy="10" r="3" />
                                        </svg>
                                        {r.lokasi}
                                    </p>
                                )}
                                <div className={styles.rapatStats}>
                                    <span>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                        </svg>
                                        {r.jumlah_hadir} hadir
                                    </span>
                                </div>
                            </div>

                            <div className={styles.cardFooter}>
                                {!r.dipublikasikan || isExpired(r.kadaluarsa_pada) ? (
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => { setPublishRapat(r); setShowPublishModal(true); }}
                                    >
                                        Publikasi QR
                                    </button>
                                ) : (
                                    <button
                                        className="btn btn-secondary btn-sm"
                                        onClick={() => handleUnpublish(r.id)}
                                    >
                                        Batalkan
                                    </button>
                                )}
                                <Link href={`/admin/rapat/${r.id}`} className="btn btn-secondary btn-sm">
                                    Detail
                                </Link>
                                <button className={styles.moreBtn} onClick={() => openEditModal(r)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className={`${styles.moreBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(r.id, r.nama)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" />
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <p>Belum ada rapat yang dibuat</p>
                    <button className="btn btn-primary" onClick={openAddModal}>Buat Rapat Pertama</button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header">
                                <h3>{editData ? 'Edit Rapat' : 'Buat Rapat Baru'}</h3>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-error mb-4">{error}</div>}

                                    <div className="input-group">
                                        <label className="input-label">Jenis Rapat *</label>
                                        <select className="input-field" value={formData.jenis_rapat_id}
                                            onChange={(e) => {
                                                const selectedJenis = jenisRapat.find(j => j.id.toString() === e.target.value);
                                                setFormData({
                                                    ...formData,
                                                    jenis_rapat_id: e.target.value,
                                                    nama: selectedJenis?.nama || ''
                                                });
                                            }} required>
                                            <option value="">Pilih Jenis Rapat</option>
                                            {jenisRapat.map((j) => <option key={j.id} value={j.id}>{j.nama}</option>)}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Tanggal Rapat *</label>
                                        <input type="date" className="input-field" value={formData.tanggal_rapat}
                                            onChange={(e) => setFormData({ ...formData, tanggal_rapat: e.target.value })} required />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Waktu Rapat</label>
                                        <input type="time" className="input-field" value={formData.waktu_rapat}
                                            onChange={(e) => setFormData({ ...formData, waktu_rapat: e.target.value })} />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Lokasi</label>
                                        <input type="text" className="input-field" placeholder="Contoh: Ruang Rapat Lt. 2"
                                            value={formData.lokasi} onChange={(e) => setFormData({ ...formData, lokasi: e.target.value })} />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Deskripsi</label>
                                        <textarea className="input-field" rows={3} value={formData.deskripsi}
                                            onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Menyimpan...' : editData ? 'Perbarui' : 'Buat'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Publish Modal */}
            <AnimatePresence>
                {showPublishModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header">
                                <h3>Publikasi QR Code</h3>
                            </div>
                            <div className="modal-body">
                                <p style={{ marginBottom: '1rem' }}>Publikasi QR untuk rapat <strong>{publishRapat?.nama}</strong></p>
                                <div className="input-group">
                                    <label className="input-label">Durasi Aktif (menit)</label>
                                    <input type="number" className="input-field" value={durasiMenit}
                                        onChange={(e) => setDurasiMenit(e.target.value)} placeholder="Kosongkan untuk tanpa batas" />
                                    <small style={{ color: 'var(--abu-500)', fontSize: '0.75rem' }}>
                                        Kosongkan jika tidak ingin ada batas waktu
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowPublishModal(false)}>Batal</button>
                                <button className="btn btn-primary" onClick={handlePublish}>Publikasi</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
