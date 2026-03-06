const { Kehadiran, Rapat, Pengguna, JenisRapat } = require('../models');
const { Op } = require('sequelize');

// Scan QR (catat kehadiran)
exports.scanQR = async (req, res) => {
    try {
        const { kode_qr } = req.body;

        if (!kode_qr) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Kode QR wajib diisi'
            });
        }

        // Cari rapat berdasarkan kode QR
        const rapat = await Rapat.findOne({
            where: { kode_qr },
            include: [{ model: JenisRapat, as: 'jenis_rapat' }]
        });

        if (!rapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'QR tidak valid'
            });
        }

        // Cek apakah QR dipublikasikan
        if (!rapat.dipublikasikan) {
            return res.status(400).json({
                sukses: false,
                pesan: 'QR belum dipublikasikan oleh admin'
            });
        }

        // Cek apakah sudah kadaluarsa
        if (rapat.kadaluarsa_pada && new Date() > new Date(rapat.kadaluarsa_pada)) {
            return res.status(400).json({
                sukses: false,
                pesan: 'QR sudah kadaluarsa'
            });
        }

        // Cek apakah sudah pernah scan
        const sudahHadir = await Kehadiran.findOne({
            where: {
                rapat_id: rapat.id,
                pengguna_id: req.pengguna.id
            }
        });

        if (sudahHadir) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Anda sudah tercatat hadir di rapat ini',
                waktu_scan: sudahHadir.waktu_scan
            });
        }

        // Catat kehadiran
        const kehadiran = await Kehadiran.create({
            rapat_id: rapat.id,
            pengguna_id: req.pengguna.id,
            waktu_scan: new Date()
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Kehadiran berhasil dicatat',
            data: {
                rapat: rapat.nama,
                jenis_rapat: rapat.jenis_rapat?.nama,
                tanggal: rapat.tanggal_rapat,
                lokasi: rapat.lokasi,
                waktu_scan: kehadiran.waktu_scan
            }
        });

    } catch (error) {
        console.error('Error scan QR:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get kehadiran per rapat (Admin)
exports.kehadiranPerRapat = async (req, res) => {
    try {
        const rapat = await Rapat.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id
            }
        });

        if (!rapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Rapat tidak ditemukan'
            });
        }

        const kehadiran = await Kehadiran.findAll({
            where: { rapat_id: req.params.id },
            include: [{
                model: Pengguna,
                as: 'pengguna',
                attributes: ['id', 'nama_lengkap', 'nim', 'angkatan', 'nomor_telepon']
            }],
            order: [['waktu_scan', 'ASC']]
        });

        // Get total anggota untuk persentase
        const totalAnggota = await Pengguna.count({
            where: {
                periode_id: req.pengguna.periode_id,
                peran: 'anggota',
                aktif: true
            }
        });

        res.status(200).json({
            sukses: true,
            data: {
                rapat: rapat.nama,
                tanggal: rapat.tanggal_rapat,
                kehadiran: kehadiran,
                total_hadir: kehadiran.length,
                total_anggota: totalAnggota,
                persentase: totalAnggota > 0 ? Math.round((kehadiran.length / totalAnggota) * 100) : 0
            }
        });

    } catch (error) {
        console.error('Error get kehadiran per rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get riwayat kehadiran sendiri (Anggota)
exports.riwayatSaya = async (req, res) => {
    try {
        const kehadiran = await Kehadiran.findAll({
            where: { pengguna_id: req.pengguna.id },
            include: [{
                model: Rapat,
                as: 'rapat',
                include: [{ model: JenisRapat, as: 'jenis_rapat', attributes: ['nama'] }]
            }],
            order: [[{ model: Rapat, as: 'rapat' }, 'tanggal_rapat', 'DESC']]
        });

        // Get total rapat di periode ini
        const totalRapat = await Rapat.count({
            where: { periode_id: req.pengguna.periode_id }
        });

        // Get piket kehadiran
        const { JadwalPiket, KehadiranPiket, BuktiPiket, KehadiranKegiatan, Kegiatan } = require('../models');

        const jadwalPiketUser = await JadwalPiket.findAll({
            where: { pengguna_id: req.pengguna.id, aktif: true }
        });

        const jadwalIds = jadwalPiketUser.map(j => j.id);

        let kehadiranPiket = [];
        if (jadwalIds.length > 0) {
            kehadiranPiket = await KehadiranPiket.findAll({
                where: { jadwal_piket_id: jadwalIds },
                include: [
                    {
                        model: JadwalPiket,
                        as: 'jadwal_piket',
                        attributes: ['hari']
                    },
                    {
                        model: BuktiPiket,
                        as: 'bukti_piket',
                        attributes: ['id']
                    }
                ],
                order: [['tanggal', 'DESC']]
            });
        }

        // Get kegiatan kehadiran
        const kehadiranKegiatan = await KehadiranKegiatan.findAll({
            where: { pengguna_id: req.pengguna.id },
            include: [{
                model: Kegiatan,
                as: 'kegiatan',
                attributes: ['id', 'nama', 'tanggal_kegiatan', 'lokasi']
            }],
            order: [[{ model: Kegiatan, as: 'kegiatan' }, 'tanggal_kegiatan', 'DESC']]
        });

        res.status(200).json({
            sukses: true,
            data: {
                kehadiran: kehadiran,
                total_hadir: kehadiran.length,
                total_rapat: totalRapat,
                persentase: totalRapat > 0 ? Math.round((kehadiran.length / totalRapat) * 100) : 0,
                kehadiran_piket: kehadiranPiket.map(kp => ({
                    id: kp.id,
                    tanggal: kp.tanggal,
                    hari: kp.jadwal_piket?.hari || '-',
                    waktu_scan: kp.waktu_scan,
                    ada_bukti: kp.bukti_piket?.length > 0
                })),
                total_piket: kehadiranPiket.length,
                kehadiran_kegiatan: kehadiranKegiatan,
                total_kegiatan: kehadiranKegiatan.length
            }
        });

    } catch (error) {
        console.error('Error get riwayat saya:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get statistik kehadiran per anggota (Admin)
exports.statistikAnggota = async (req, res) => {
    try {
        const pengguna = await Pengguna.findAll({
            where: {
                periode_id: req.pengguna.periode_id,
                peran: 'anggota',
                aktif: true
            },
            attributes: ['id', 'nama_lengkap', 'nim', 'angkatan'],
            order: [['nama_lengkap', 'ASC']]
        });

        const totalRapat = await Rapat.count({
            where: { periode_id: req.pengguna.periode_id }
        });

        const statistik = await Promise.all(pengguna.map(async (p) => {
            const jumlahHadir = await Kehadiran.count({
                where: { pengguna_id: p.id }
            });

            return {
                ...p.toJSON(),
                jumlah_hadir: jumlahHadir,
                total_rapat: totalRapat,
                persentase: totalRapat > 0 ? Math.round((jumlahHadir / totalRapat) * 100) : 0
            };
        }));

        res.status(200).json({
            sukses: true,
            data: statistik
        });

    } catch (error) {
        console.error('Error get statistik anggota:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};
