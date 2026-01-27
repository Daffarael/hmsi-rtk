'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/lib/api';
import styles from './anggota.module.css';

interface Anggota {
    id: number;
    nama_lengkap: string;
    nama_panggilan: string;
    nim: string;
    nomor_telepon: string | null;
    angkatan: number | null;
    username: string;
    tipe_anggota: 'presidium' | 'staff';
    aktif: boolean;
    divisi?: { id: number; nama: string };
}

interface Divisi {
    id: number;
    nama: string;
}

export default function AnggotaPage() {
    const [anggota, setAnggota] = useState<Anggota[]>([]);
    const [divisi, setDivisi] = useState<Divisi[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editData, setEditData] = useState<Anggota | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDivisi, setFilterDivisi] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        nama_lengkap: '',
        nama_panggilan: '',
        nim: '',
        nomor_telepon: '',
        angkatan: '',
        divisi_id: '',
        tipe_anggota: 'staff' as 'presidium' | 'staff',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const [anggotaRes, divisiRes] = await Promise.all([
                api.semuaPengguna({ cari: searchTerm, divisi_id: filterDivisi }),
                api.semuaDivisi(),
            ]);
            setAnggota(Array.isArray(anggotaRes.data) ? anggotaRes.data : []);
            setDivisi(Array.isArray(divisiRes.data) ? divisiRes.data : []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [searchTerm, filterDivisi]);

    const openAddModal = () => {
        setEditData(null);
        setFormData({
            nama_lengkap: '',
            nama_panggilan: '',
            nim: '',
            nomor_telepon: '',
            angkatan: '',
            divisi_id: '',
            tipe_anggota: 'staff',
        });
        setError('');
        setShowModal(true);
    };

    const openEditModal = (data: Anggota) => {
        setEditData(data);
        setFormData({
            nama_lengkap: data.nama_lengkap,
            nama_panggilan: data.nama_panggilan,
            nim: data.nim,
            nomor_telepon: data.nomor_telepon || '',
            angkatan: data.angkatan?.toString() || '',
            divisi_id: data.divisi?.id.toString() || '',
            tipe_anggota: data.tipe_anggota || 'staff',
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
                angkatan: formData.angkatan ? parseInt(formData.angkatan) : null,
                divisi_id: formData.divisi_id ? parseInt(formData.divisi_id) : null,
                tipe_anggota: formData.tipe_anggota,
            };

            if (editData) {
                await api.updatePengguna(editData.id, payload);
            } else {
                await api.buatPengguna(payload);
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
        if (!confirm(`Yakin ingin menghapus ${nama}?`)) return;

        try {
            await api.hapusPengguna(id);
            fetchData();
        } catch (err: any) {
            alert(err.message || 'Gagal menghapus');
        }
    };

    const handleResetPassword = async (id: number, nama: string) => {
        if (!confirm(`Reset password ${nama} ke NIM?`)) return;

        try {
            await api.resetPassword(id);
            alert('Password berhasil direset ke NIM');
        } catch (err: any) {
            alert(err.message || 'Gagal reset password');
        }
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
                    <h1>Kelola Anggota</h1>
                    <p>Tambah dan kelola data anggota HMSI</p>
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
                    Tambah Anggota
                </motion.button>
            </div>

            {/* Filters */}
            <div className={styles.filters}>
                <input
                    type="text"
                    className="input-field"
                    placeholder="Cari nama atau NIM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                    className="input-field"
                    value={filterDivisi}
                    onChange={(e) => setFilterDivisi(e.target.value)}
                >
                    <option value="">Semua Divisi</option>
                    {divisi.map((d) => (
                        <option key={d.id} value={d.id}>{d.nama}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <div className={styles.loadingContainer}>
                    <div className="loader"></div>
                </div>
            ) : anggota.length > 0 ? (
                <motion.div
                    className="table-container"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama</th>
                                <th>NIM</th>
                                <th>Tipe</th>
                                <th>Divisi</th>
                                <th>Angkatan</th>
                                <th>Username</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {anggota.map((a, index) => (
                                <motion.tr
                                    key={a.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.3 }}
                                >
                                    <td>
                                        <div className={styles.nameCell}>
                                            <div className={styles.avatar}>
                                                {a.nama_panggilan.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className={styles.fullName}>{a.nama_lengkap}</p>
                                                <p className={styles.nickname}>{a.nama_panggilan}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{a.nim}</td>
                                    <td>
                                        <span className={`${styles.tipeBadge} ${a.tipe_anggota === 'presidium' ? styles.presidium : styles.staff}`}>
                                            {a.tipe_anggota === 'presidium' ? 'Presidium' : 'Staff'}
                                        </span>
                                    </td>
                                    <td>{a.divisi?.nama || <span className={styles.noData}>-</span>}</td>
                                    <td>{a.angkatan || <span className={styles.noData}>-</span>}</td>
                                    <td><code className={styles.username}>{a.username}</code></td>
                                    <td>
                                        <div className={styles.actions}>
                                            <button className={styles.actionBtn} onClick={() => openEditModal(a)} title="Edit">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                                </svg>
                                            </button>
                                            <button className={styles.actionBtn} onClick={() => handleResetPassword(a.id, a.nama_lengkap)} title="Reset Password">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                </svg>
                                            </button>
                                            <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(a.id, a.nama_lengkap)} title="Hapus">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <polyline points="3 6 5 6 21 6" />
                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            ) : (
                <div className={styles.emptyState}>
                    <svg
                        width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                    >
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                    <p>
                        Belum ada anggota terdaftar
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={openAddModal}
                    >
                        Tambah Anggota Pertama
                    </button>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
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
                                <h3>{editData ? 'Edit Anggota' : 'Tambah Anggota Baru'}</h3>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="modal-body">
                                    {error && <div className="alert alert-error mb-4">{error}</div>}

                                    <div className="input-group">
                                        <label className="input-label">Nama Lengkap *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.nama_lengkap}
                                            onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Nama Panggilan *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.nama_panggilan}
                                            onChange={(e) => setFormData({ ...formData, nama_panggilan: e.target.value })}
                                            required
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">NIM *</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.nim}
                                            onChange={(e) => setFormData({ ...formData, nim: e.target.value })}
                                            required
                                            disabled={!!editData}
                                        />
                                        {!editData && <small style={{ color: 'var(--abu-500)', fontSize: '0.75rem' }}>NIM akan menjadi password awal</small>}
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Nomor Telepon</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            value={formData.nomor_telepon}
                                            onChange={(e) => setFormData({ ...formData, nomor_telepon: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Angkatan</label>
                                        <input
                                            type="number"
                                            className="input-field"
                                            placeholder="2024"
                                            value={formData.angkatan}
                                            onChange={(e) => setFormData({ ...formData, angkatan: e.target.value })}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Divisi</label>
                                        <select
                                            className="input-field"
                                            value={formData.divisi_id}
                                            onChange={(e) => setFormData({ ...formData, divisi_id: e.target.value })}
                                        >
                                            <option value="">Pilih Divisi</option>
                                            {divisi.map((d) => (
                                                <option key={d.id} value={d.id}>{d.nama}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Tipe Anggota *</label>
                                        <select
                                            className="input-field"
                                            value={formData.tipe_anggota}
                                            onChange={(e) => setFormData({ ...formData, tipe_anggota: e.target.value as 'presidium' | 'staff' })}
                                            required
                                        >
                                            <option value="staff">Staff</option>
                                            <option value="presidium">Presidium</option>
                                        </select>
                                        <small style={{ color: 'var(--abu-500)', fontSize: '0.75rem' }}>Presidium: anggota inti, Staff: anggota biasa</small>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                        Batal
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        {isSubmitting ? 'Menyimpan...' : editData ? 'Perbarui' : 'Tambah'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
