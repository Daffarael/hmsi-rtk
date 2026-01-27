const { Rapat, JenisRapat, Periode, Kehadiran, Pengguna } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');

// Generate QR Code sebagai base64
const generateQRBase64 = async (data) => {
    try {
        return await QRCode.toDataURL(data, {
            width: 300,
            margin: 2,
            color: {
                dark: '#000000',
                light: '#ffffff'
            }
        });
    } catch (error) {
        console.error('Error generate QR:', error);
        return null;
    }
};

// Get semua rapat
exports.semuaRapat = async (req, res) => {
    try {
        const { jenis_rapat_id, tanggal_mulai, tanggal_selesai } = req.query;

        const whereClause = {
            periode_id: req.pengguna.periode_id
        };

        if (jenis_rapat_id) {
            whereClause.jenis_rapat_id = jenis_rapat_id;
        }

        if (tanggal_mulai && tanggal_selesai) {
            whereClause.tanggal_rapat = {
                [Op.between]: [tanggal_mulai, tanggal_selesai]
            };
        }

        const rapat = await Rapat.findAll({
            where: whereClause,
            include: [
                { model: JenisRapat, as: 'jenis_rapat', attributes: ['id', 'nama'] }
            ],
            order: [['tanggal_rapat', 'DESC'], ['waktu_rapat', 'DESC']]
        });

        // Hitung jumlah kehadiran per rapat
        const rapatDenganKehadiran = await Promise.all(rapat.map(async (r) => {
            const jumlahHadir = await Kehadiran.count({ where: { rapat_id: r.id } });
            return {
                ...r.toJSON(),
                jumlah_hadir: jumlahHadir
            };
        }));

        res.status(200).json({
            sukses: true,
            data: rapatDenganKehadiran
        });

    } catch (error) {
        console.error('Error get semua rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get rapat by ID (dengan QR code)
exports.rapatById = async (req, res) => {
    try {
        const rapat = await Rapat.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id
            },
            include: [
                { model: JenisRapat, as: 'jenis_rapat' },
                { model: Periode, as: 'periode' }
            ]
        });

        if (!rapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Rapat tidak ditemukan'
            });
        }

        // Generate QR code base64 untuk ditampilkan
        const qrBase64 = await generateQRBase64(rapat.kode_qr);

        // Get daftar kehadiran
        const kehadiran = await Kehadiran.findAll({
            where: { rapat_id: rapat.id },
            include: [{
                model: Pengguna,
                as: 'pengguna',
                attributes: ['id', 'nama_lengkap', 'nim', 'angkatan']
            }],
            order: [['waktu_scan', 'ASC']]
        });

        res.status(200).json({
            sukses: true,
            data: {
                ...rapat.toJSON(),
                qr_base64: qrBase64,
                kehadiran: kehadiran,
                jumlah_hadir: kehadiran.length
            }
        });

    } catch (error) {
        console.error('Error get rapat by id:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Buat rapat baru
exports.buatRapat = async (req, res) => {
    try {
        const { nama, deskripsi, tanggal_rapat, waktu_rapat, lokasi, jenis_rapat_id } = req.body;

        if (!nama || !tanggal_rapat) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Nama dan tanggal rapat wajib diisi'
            });
        }

        // Generate kode QR unik
        const kodeQR = `HMSI-${uuidv4().slice(0, 8).toUpperCase()}-${Date.now()}`;

        const rapat = await Rapat.create({
            periode_id: req.pengguna.periode_id,
            jenis_rapat_id: jenis_rapat_id || null,
            nama,
            deskripsi: deskripsi || null,
            tanggal_rapat,
            waktu_rapat: waktu_rapat || null,
            lokasi: lokasi || null,
            kode_qr: kodeQR,
            dipublikasikan: false
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Rapat berhasil dibuat',
            data: rapat
        });

    } catch (error) {
        console.error('Error buat rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Update rapat
exports.updateRapat = async (req, res) => {
    try {
        const { nama, deskripsi, tanggal_rapat, waktu_rapat, lokasi, jenis_rapat_id } = req.body;

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

        await rapat.update({
            nama: nama || rapat.nama,
            deskripsi: deskripsi !== undefined ? deskripsi : rapat.deskripsi,
            tanggal_rapat: tanggal_rapat || rapat.tanggal_rapat,
            waktu_rapat: waktu_rapat !== undefined ? waktu_rapat : rapat.waktu_rapat,
            lokasi: lokasi !== undefined ? lokasi : rapat.lokasi,
            jenis_rapat_id: jenis_rapat_id !== undefined ? jenis_rapat_id : rapat.jenis_rapat_id
        });

        res.status(200).json({
            sukses: true,
            pesan: 'Rapat berhasil diperbarui'
        });

    } catch (error) {
        console.error('Error update rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Hapus rapat
exports.hapusRapat = async (req, res) => {
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

        // Hapus kehadiran terlebih dahulu
        await Kehadiran.destroy({ where: { rapat_id: rapat.id } });
        await rapat.destroy();

        res.status(200).json({
            sukses: true,
            pesan: 'Rapat berhasil dihapus'
        });

    } catch (error) {
        console.error('Error hapus rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Publikasi QR
exports.publikasiQR = async (req, res) => {
    try {
        const { durasi_menit } = req.body;

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

        const sekarang = new Date();
        let kadaluarsa = null;

        if (durasi_menit) {
            kadaluarsa = new Date(sekarang.getTime() + durasi_menit * 60000);
        }

        await rapat.update({
            dipublikasikan: true,
            dipublikasikan_pada: sekarang,
            kadaluarsa_pada: kadaluarsa
        });

        res.status(200).json({
            sukses: true,
            pesan: 'QR berhasil dipublikasikan',
            data: {
                dipublikasikan_pada: sekarang,
                kadaluarsa_pada: kadaluarsa
            }
        });

    } catch (error) {
        console.error('Error publikasi QR:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Batalkan publikasi QR
exports.batalkanPublikasi = async (req, res) => {
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

        await rapat.update({
            dipublikasikan: false,
            kadaluarsa_pada: null
        });

        res.status(200).json({
            sukses: true,
            pesan: 'Publikasi QR berhasil dibatalkan'
        });

    } catch (error) {
        console.error('Error batalkan publikasi:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get rapat yang dipublikasikan (untuk anggota)
exports.rapatAktif = async (req, res) => {
    try {
        const sekarang = new Date();

        const rapat = await Rapat.findAll({
            where: {
                periode_id: req.pengguna.periode_id,
                dipublikasikan: true,
                [Op.or]: [
                    { kadaluarsa_pada: null },
                    { kadaluarsa_pada: { [Op.gt]: sekarang } }
                ]
            },
            include: [
                { model: JenisRapat, as: 'jenis_rapat', attributes: ['id', 'nama'] }
            ],
            order: [['tanggal_rapat', 'DESC']]
        });

        res.status(200).json({
            sukses: true,
            data: rapat
        });

    } catch (error) {
        console.error('Error get rapat aktif:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};
