const jwt = require('jsonwebtoken');
const { Pengguna, Periode, TransferAdmin, Divisi } = require('../models');
const { Op } = require('sequelize');

// Generate JWT Token
const generateToken = (pengguna) => {
    return jwt.sign(
        {
            id: pengguna.id,
            username: pengguna.username,
            peran: pengguna.peran,
            periode_id: pengguna.periode_id
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// Cek apakah masa jabatan sudah habis (lebih dari 1 tahun)
const cekMasaJabatanHabis = (periode) => {
    const sekarang = new Date();
    const tanggalSelesai = new Date(periode.tanggal_selesai);
    return sekarang > tanggalSelesai;
};

// Login
exports.masuk = async (req, res) => {
    try {
        const { username, kata_sandi } = req.body;

        if (!username || !kata_sandi) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Username dan kata sandi wajib diisi'
            });
        }

        // Cari pengguna
        const pengguna = await Pengguna.findOne({
            where: { username, aktif: true },
            include: [
                { model: Periode, as: 'periode' },
                { model: Divisi, as: 'divisi' }
            ]
        });

        if (!pengguna) {
            return res.status(401).json({
                sukses: false,
                pesan: 'Username atau kata sandi salah'
            });
        }

        // Verifikasi password
        const passwordValid = await pengguna.verifikasiKataSandi(kata_sandi);
        if (!passwordValid) {
            return res.status(401).json({
                sukses: false,
                pesan: 'Username atau kata sandi salah'
            });
        }

        // Cek masa jabatan untuk admin
        if (pengguna.peran === 'admin') {
            const masaJabatanHabis = cekMasaJabatanHabis(pengguna.periode);

            if (masaJabatanHabis) {
                // Generate token khusus untuk halaman transfer
                const tokenTransfer = generateToken(pengguna);
                return res.status(200).json({
                    sukses: true,
                    perlu_transfer: true,
                    pesan: 'Masa jabatan Anda telah berakhir. Silakan buat kode transfer untuk admin baru.',
                    token: tokenTransfer
                });
            }
        }

        // Generate token normal
        const token = generateToken(pengguna);

        res.status(200).json({
            sukses: true,
            pesan: 'Login berhasil',
            data: {
                id: pengguna.id,
                nama_lengkap: pengguna.nama_lengkap,
                username: pengguna.username,
                peran: pengguna.peran,
                periode: pengguna.periode?.nama,
                divisi: pengguna.divisi?.nama
            },
            token
        });

    } catch (error) {
        console.error('Error login:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get current user data
exports.saya = async (req, res) => {
    try {
        const pengguna = await Pengguna.findByPk(req.pengguna.id, {
            attributes: { exclude: ['kata_sandi'] },
            include: [
                { model: Periode, as: 'periode' },
                { model: Divisi, as: 'divisi' }
            ]
        });

        if (!pengguna) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Pengguna tidak ditemukan'
            });
        }

        // Cek masa jabatan untuk admin
        let masaJabatanHabis = false;
        if (pengguna.peran === 'admin') {
            masaJabatanHabis = cekMasaJabatanHabis(pengguna.periode);
        }

        res.status(200).json({
            sukses: true,
            data: {
                ...pengguna.toJSON(),
                masa_jabatan_habis: masaJabatanHabis
            }
        });

    } catch (error) {
        console.error('Error get saya:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Akhiri masa jabatan dini
exports.akhiriJabatan = async (req, res) => {
    try {
        const { konfirmasi_teks } = req.body;

        if (konfirmasi_teks !== 'Akhiri Masa Jabatan') {
            return res.status(400).json({
                sukses: false,
                pesan: 'Teks konfirmasi tidak sesuai'
            });
        }

        // Update periode jadi tidak aktif
        await Periode.update(
            { aktif: false },
            { where: { id: req.pengguna.periode_id } }
        );

        res.status(200).json({
            sukses: true,
            pesan: 'Masa jabatan berhasil diakhiri. Silakan buat kode transfer.'
        });

    } catch (error) {
        console.error('Error akhiri jabatan:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Buat kode transfer
exports.buatKodeTransfer = async (req, res) => {
    try {
        const { kode_transfer } = req.body;

        if (!kode_transfer || kode_transfer.length < 6) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Kode transfer minimal 6 karakter'
            });
        }

        // Cek apakah kode sudah digunakan
        const kodeExist = await TransferAdmin.findOne({ where: { kode_transfer } });
        if (kodeExist) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Kode transfer sudah digunakan, pilih kode lain'
            });
        }

        // Simpan kode transfer
        const transfer = await TransferAdmin.create({
            periode_id: req.pengguna.periode_id,
            admin_lama_id: req.pengguna.id,
            kode_transfer
        });

        // Nonaktifkan periode lama
        await Periode.update(
            { aktif: false },
            { where: { id: req.pengguna.periode_id } }
        );

        res.status(201).json({
            sukses: true,
            pesan: 'Kode transfer berhasil dibuat',
            data: {
                kode_transfer: transfer.kode_transfer,
                link_registrasi: `${process.env.FRONTEND_URL}/daftar-admin`
            }
        });

    } catch (error) {
        console.error('Error buat kode transfer:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Daftar admin baru dengan kode transfer
exports.daftarAdminBaru = async (req, res) => {
    try {
        const { kode_transfer, kata_sandi_baru } = req.body;

        if (!kode_transfer || !kata_sandi_baru) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Kode transfer dan kata sandi baru wajib diisi'
            });
        }

        if (kata_sandi_baru.length < 6) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Kata sandi minimal 6 karakter'
            });
        }

        // Cari kode transfer
        const transfer = await TransferAdmin.findOne({
            where: {
                kode_transfer,
                sudah_digunakan: false
            },
            include: [{ model: Periode, as: 'periode' }]
        });

        if (!transfer) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Kode transfer tidak valid atau sudah digunakan'
            });
        }

        // Generate periode baru
        const tahunSekarang = new Date().getFullYear();
        const tahunDepan = tahunSekarang + 1;
        const namaPeriodeBaru = `${tahunSekarang}/${tahunDepan}`;
        const kodePeriode = `${tahunSekarang.toString().slice(-2)}${tahunDepan.toString().slice(-2)}`;

        // Buat periode baru
        const periodeBaru = await Periode.create({
            nama: namaPeriodeBaru,
            tanggal_mulai: new Date(),
            tanggal_selesai: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
            aktif: true
        });

        // Buat admin baru
        const usernameAdminBaru = `adminhmsi${kodePeriode}`;

        const adminBaru = await Pengguna.create({
            periode_id: periodeBaru.id,
            divisi_id: null,
            nama_lengkap: 'Admin HMSI',
            nama_panggilan: 'admin',
            nim: 'admin',
            nomor_telepon: null,
            username: usernameAdminBaru,
            kata_sandi: kata_sandi_baru,
            angkatan: null,
            peran: 'admin',
            aktif: true
        });

        // Update kode transfer jadi sudah digunakan
        await transfer.update({
            sudah_digunakan: true,
            digunakan_pada: new Date()
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Registrasi admin baru berhasil',
            data: {
                username: adminBaru.username,
                periode: periodeBaru.nama
            }
        });

    } catch (error) {
        console.error('Error daftar admin baru:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Logout (invalidate on client side)
exports.keluar = async (req, res) => {
    res.status(200).json({
        sukses: true,
        pesan: 'Logout berhasil'
    });
};
