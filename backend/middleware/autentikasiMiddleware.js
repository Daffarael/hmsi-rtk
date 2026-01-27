const jwt = require('jsonwebtoken');
const { Pengguna, Periode } = require('../models');

// Middleware untuk verifikasi JWT
exports.verifikasiToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                sukses: false,
                pesan: 'Token tidak ditemukan'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verifikasi token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Cari pengguna
        const pengguna = await Pengguna.findByPk(decoded.id, {
            include: [{ model: Periode, as: 'periode' }]
        });

        if (!pengguna || !pengguna.aktif) {
            return res.status(401).json({
                sukses: false,
                pesan: 'Pengguna tidak valid atau tidak aktif'
            });
        }

        // Simpan data pengguna ke request
        req.pengguna = {
            id: pengguna.id,
            username: pengguna.username,
            peran: pengguna.peran,
            periode_id: pengguna.periode_id,
            periode: pengguna.periode
        };

        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                sukses: false,
                pesan: 'Token tidak valid'
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                sukses: false,
                pesan: 'Token sudah kadaluarsa'
            });
        }

        console.error('Error verifikasi token:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Middleware untuk cek role admin
exports.hanyaAdmin = (req, res, next) => {
    if (req.pengguna.peran !== 'admin') {
        return res.status(403).json({
            sukses: false,
            pesan: 'Akses ditolak. Hanya admin yang dapat mengakses.'
        });
    }
    next();
};

// Middleware untuk cek role anggota
exports.hanyaAnggota = (req, res, next) => {
    if (req.pengguna.peran !== 'anggota') {
        return res.status(403).json({
            sukses: false,
            pesan: 'Akses ditolak. Hanya anggota yang dapat mengakses.'
        });
    }
    next();
};

// Middleware untuk cek masa jabatan admin (untuk akses normal)
exports.cekMasaJabatan = (req, res, next) => {
    if (req.pengguna.peran === 'admin') {
        const sekarang = new Date();
        const tanggalSelesai = new Date(req.pengguna.periode.tanggal_selesai);

        if (sekarang > tanggalSelesai) {
            return res.status(403).json({
                sukses: false,
                pesan: 'Masa jabatan Anda telah berakhir',
                perlu_transfer: true
            });
        }
    }
    next();
};
