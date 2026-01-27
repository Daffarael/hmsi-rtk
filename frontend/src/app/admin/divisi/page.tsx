'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import styles from './divisi.module.css';

interface Divisi {
    id: number;
    nama: string;
    deskripsi: string | null;
    aktif: boolean;
}

export default function DivisiPage() {
    const [divisi, setDivisi] = useState<Divisi[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Divisi | null>(null);
    const [formData, setFormData] = useState({ nama: '', deskripsi: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const res = await api.semuaDivisi();
            setDivisi(Array.isArray(res.data) ? res.data : []);
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
        setFormData({ nama: '', deskripsi: '' });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (data: Divisi) => {
        setEditData(data);
        setFormData({ nama: data.nama, deskripsi: data.deskripsi || '' });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            if (editData) {
                await api.updateDivisi(editData.id, formData);
            } else {
                await api.buatDivisi(formData);
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
        if (!confirm(`Yakin ingin menghapus divisi "${nama}"?`)) return;

        try {
            await api.hapusDivisi(id);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus');
        }
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={styles.container}>
            <div className={styles.header}>
                <div>
                    <h1>Kelola Divisi</h1>
                    <p>Tambah dan kelola divisi HMSI</p>
                </div>
                <motion.button className="btn btn-primary" onClick={openAddModal} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Tambah Divisi
                </motion.button>
            </div>

            {loading ? (
                <div className={styles.loadingContainer}><div className="loader"></div></div>
            ) : divisi.length > 0 ? (
                <div className={styles.grid}>
                    {divisi.map((d, index) => (
                        <motion.div key={d.id} className={styles.card} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                            <div className={styles.cardIcon}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                            </div>
                            <h3>{d.nama}</h3>
                            <p>{d.deskripsi || 'Tidak ada deskripsi'}</p>
                            <div className={styles.cardActions}>
                                <button className={styles.actionBtn} onClick={() => openEditModal(d)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(d.id, d.nama)}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                    <p>Belum ada divisi</p>
                    <button className="btn btn-primary" onClick={openAddModal}>Tambah Divisi</button>
                </div>
            )}

            <AnimatePresence>
                {showModal && (
                    <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <motion.div className="modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <div className="modal-header"><h3>{editData ? 'Edit Divisi' : 'Tambah Divisi'}</h3></div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-error mb-4">{error}</div>}
                                    <div className="input-group">
                                        <label className="input-label">Nama Divisi *</label>
                                        <input type="text" className="input-field" value={formData.nama} onChange={(e) => setFormData({ ...formData, nama: e.target.value })} required />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Deskripsi</label>
                                        <textarea className="input-field" rows={3} value={formData.deskripsi} onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>{isSubmitting ? 'Menyimpan...' : editData ? 'Perbarui' : 'Tambah'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
