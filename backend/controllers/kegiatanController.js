const { Op } = require('sequelize');
const { Kegiatan, KehadiranKegiatan, Pengguna, Periode, Divisi } = require('../models');
const crypto = require('crypto');

// ==================== ADMIN: CRUD KEGIATAN ====================

// GET /api/kegiatan - Ambil semua kegiatan
exports.semuaKegiatan = async (req, res) => {
    try {
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        const kegiatan = await Kegiatan.findAll({
            where: { periode_id: periodeAktif.id },
            order: [['tanggal_kegiatan', 'DESC']],
            include: [
                {
                    model: KehadiranKegiatan,
                    as: 'kehadiran',
                    attributes: ['id']
                }
            ]
        });

        res.json({
            sukses: true,
            data: kegiatan.map(k => ({
                ...k.toJSON(),
                jumlah_hadir: k.kehadiran.length
            }))
        });
    } catch (error) {
        console.error('Error semuaKegiatan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil data kegiatan' });
    }
};

// GET /api/kegiatan/:id - Detail kegiatan
exports.detailKegiatan = async (req, res) => {
    try {
        const { id } = req.params;

        const kegiatan = await Kegiatan.findByPk(id, {
            include: [
                {
                    model: KehadiranKegiatan,
                    as: 'kehadiran',
                    include: [
                        {
                            model: Pengguna,
                            as: 'pengguna',
                            attributes: ['id', 'nama_lengkap', 'nama_panggilan', 'tipe_anggota'],
                            include: [{ model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }]
                        }
                    ]
                }
            ]
        });

        if (!kegiatan) {
            return res.status(404).json({ sukses: false, pesan: 'Kegiatan tidak ditemukan' });
        }

        res.json({ sukses: true, data: kegiatan });
    } catch (error) {
        console.error('Error detailKegiatan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil detail kegiatan' });
    }
};

// POST /api/kegiatan - Buat kegiatan baru
exports.buatKegiatan = async (req, res) => {
    try {
        const { nama, deskripsi, tanggal_kegiatan, waktu_kegiatan, lokasi } = req.body;

        if (!nama || !tanggal_kegiatan) {
            return res.status(400).json({ sukses: false, pesan: 'Nama dan tanggal kegiatan wajib diisi' });
        }

        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        // Generate kode QR unik
        const kode_qr = `KEGIATAN-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

        const kegiatan = await Kegiatan.create({
            periode_id: periodeAktif.id,
            nama,
            deskripsi,
            tanggal_kegiatan,
            waktu_kegiatan,
            lokasi,
            kode_qr
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Kegiatan berhasil dibuat',
            data: kegiatan
        });
    } catch (error) {
        console.error('Error buatKegiatan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal membuat kegiatan' });
    }
};

// PUT /api/kegiatan/:id - Edit kegiatan
exports.editKegiatan = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, deskripsi, tanggal_kegiatan, waktu_kegiatan, lokasi } = req.body;

        const kegiatan = await Kegiatan.findByPk(id);
        if (!kegiatan) {
            return res.status(404).json({ sukses: false, pesan: 'Kegiatan tidak ditemukan' });
        }

        await kegiatan.update({
            nama: nama || kegiatan.nama,
            deskripsi: deskripsi !== undefined ? deskripsi : kegiatan.deskripsi,
            tanggal_kegiatan: tanggal_kegiatan || kegiatan.tanggal_kegiatan,
            waktu_kegiatan: waktu_kegiatan !== undefined ? waktu_kegiatan : kegiatan.waktu_kegiatan,
            lokasi: lokasi !== undefined ? lokasi : kegiatan.lokasi
        });

        res.json({ sukses: true, pesan: 'Kegiatan berhasil diperbarui', data: kegiatan });
    } catch (error) {
        console.error('Error editKegiatan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal memperbarui kegiatan' });
    }
};

// DELETE /api/kegiatan/:id - Hapus kegiatan
exports.hapusKegiatan = async (req, res) => {
    try {
        const { id } = req.params;

        const kegiatan = await Kegiatan.findByPk(id);
        if (!kegiatan) {
            return res.status(404).json({ sukses: false, pesan: 'Kegiatan tidak ditemukan' });
        }

        await kegiatan.destroy();
        res.json({ sukses: true, pesan: 'Kegiatan berhasil dihapus' });
    } catch (error) {
        console.error('Error hapusKegiatan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal menghapus kegiatan' });
    }
};

// POST /api/kegiatan/:id/publish - Publikasikan kegiatan
exports.publikasikan = async (req, res) => {
    try {
        const { id } = req.params;
        const { kadaluarsa_menit } = req.body;

        const kegiatan = await Kegiatan.findByPk(id);
        if (!kegiatan) {
            return res.status(404).json({ sukses: false, pesan: 'Kegiatan tidak ditemukan' });
        }

        const kadaluarsa = kadaluarsa_menit
            ? new Date(Date.now() + kadaluarsa_menit * 60 * 1000)
            : null;

        await kegiatan.update({
            dipublikasikan: true,
            dipublikasikan_pada: new Date(),
            kadaluarsa_pada: kadaluarsa
        });

        res.json({ sukses: true, pesan: 'Kegiatan berhasil dipublikasikan', data: kegiatan });
    } catch (error) {
        console.error('Error publikasikan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mempublikasikan kegiatan' });
    }
};

// POST /api/kegiatan/:id/batalkan-publikasi - Batalkan publikasi kegiatan
exports.batalkanPublikasi = async (req, res) => {
    try {
        const { id } = req.params;

        const kegiatan = await Kegiatan.findByPk(id);
        if (!kegiatan) {
            return res.status(404).json({ sukses: false, pesan: 'Kegiatan tidak ditemukan' });
        }

        await kegiatan.update({
            dipublikasikan: false,
            dipublikasikan_pada: null,
            kadaluarsa_pada: null
        });

        res.json({ sukses: true, pesan: 'Publikasi kegiatan berhasil dibatalkan', data: kegiatan });
    } catch (error) {
        console.error('Error batalkanPublikasi:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal membatalkan publikasi kegiatan' });
    }
};

// ==================== ANGGOTA: SCAN KEGIATAN ====================

// GET /api/kegiatan-aktif - Ambil kegiatan yang dipublikasikan
exports.kegiatanAktif = async (req, res) => {
    try {
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        const kegiatan = await Kegiatan.findAll({
            where: {
                periode_id: periodeAktif.id,
                dipublikasikan: true,
                [Op.or]: [
                    { kadaluarsa_pada: null },
                    { kadaluarsa_pada: { [Op.gt]: new Date() } }
                ]
            },
            order: [['tanggal_kegiatan', 'DESC']]
        });

        res.json({ sukses: true, data: kegiatan });
    } catch (error) {
        console.error('Error kegiatanAktif:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil kegiatan aktif' });
    }
};

// POST /api/kehadiran-kegiatan/scan - Scan QR kegiatan
exports.scanKegiatan = async (req, res) => {
    try {
        const { kode_qr } = req.body;
        const penggunaId = req.pengguna.id;

        if (!kode_qr) {
            return res.status(400).json({ sukses: false, pesan: 'Kode QR wajib diisi' });
        }

        // Cari kegiatan
        const kegiatan = await Kegiatan.findOne({
            where: { kode_qr },
            include: [{ model: Periode, as: 'periode' }]
        });

        if (!kegiatan) {
            return res.status(404).json({ sukses: false, pesan: 'Kegiatan tidak ditemukan' });
        }

        // Validasi
        if (!kegiatan.dipublikasikan) {
            return res.status(400).json({ sukses: false, pesan: 'Kegiatan belum dipublikasikan' });
        }

        if (kegiatan.kadaluarsa_pada && new Date() > kegiatan.kadaluarsa_pada) {
            return res.status(400).json({ sukses: false, pesan: 'QR sudah kadaluarsa' });
        }

        // Cek apakah sudah scan
        const sudahScan = await KehadiranKegiatan.findOne({
            where: { kegiatan_id: kegiatan.id, pengguna_id: penggunaId }
        });

        if (sudahScan) {
            return res.status(400).json({ sukses: false, pesan: 'Anda sudah mengisi kehadiran kegiatan ini' });
        }

        // Catat kehadiran
        const kehadiran = await KehadiranKegiatan.create({
            kegiatan_id: kegiatan.id,
            pengguna_id: penggunaId,
            waktu_scan: new Date()
        });

        res.json({
            sukses: true,
            pesan: 'Kehadiran berhasil dicatat!',
            data: {
                kegiatan: kegiatan.nama,
                waktu_scan: kehadiran.waktu_scan
            }
        });
    } catch (error) {
        console.error('Error scanKegiatan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mencatat kehadiran' });
    }
};

// GET /api/kehadiran-kegiatan/:id - Get kehadiran per kegiatan
exports.kehadiranPerKegiatan = async (req, res) => {
    try {
        const { id } = req.params;

        const kehadiran = await KehadiranKegiatan.findAll({
            where: { kegiatan_id: id },
            include: [
                {
                    model: Pengguna,
                    as: 'pengguna',
                    attributes: ['id', 'nama_lengkap', 'nama_panggilan', 'tipe_anggota'],
                    include: [{ model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }]
                }
            ],
            order: [['waktu_scan', 'ASC']]
        });

        res.json({ sukses: true, data: kehadiran });
    } catch (error) {
        console.error('Error kehadiranPerKegiatan:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil kehadiran' });
    }
};
