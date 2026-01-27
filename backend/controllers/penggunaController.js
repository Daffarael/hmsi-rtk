const { Pengguna, Periode, Divisi } = require('../models');
const { Op } = require('sequelize');

// Generate username otomatis
const generateUsername = (namaPanggilan, nim, periode) => {
    const tahunMulai = new Date(periode.tanggal_mulai).getFullYear();
    const tahunSelesai = new Date(periode.tanggal_selesai).getFullYear();
    const kodePeriode = `${tahunMulai.toString().slice(-2)}${tahunSelesai.toString().slice(-2)}`;

    const namaBersih = namaPanggilan.toLowerCase().replace(/\s+/g, '');
    return `${namaBersih}_${nim}@HMSIUNAND${kodePeriode}`;
};

// Get semua pengguna (anggota)
exports.semuaPengguna = async (req, res) => {
    try {
        const { divisi_id, cari } = req.query;

        const whereClause = {
            periode_id: req.pengguna.periode_id,
            peran: 'anggota'
        };

        if (divisi_id) {
            whereClause.divisi_id = divisi_id;
        }

        if (cari) {
            whereClause[Op.or] = [
                { nama_lengkap: { [Op.like]: `%${cari}%` } },
                { nim: { [Op.like]: `%${cari}%` } },
                { username: { [Op.like]: `%${cari}%` } }
            ];
        }

        const pengguna = await Pengguna.findAll({
            where: whereClause,
            attributes: { exclude: ['kata_sandi'] },
            include: [
                { model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }
            ],
            order: [['nama_lengkap', 'ASC']]
        });

        res.status(200).json({
            sukses: true,
            data: pengguna
        });

    } catch (error) {
        console.error('Error get semua pengguna:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get pengguna by ID
exports.penggunaById = async (req, res) => {
    try {
        const pengguna = await Pengguna.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id
            },
            attributes: { exclude: ['kata_sandi'] },
            include: [
                { model: Divisi, as: 'divisi' },
                { model: Periode, as: 'periode' }
            ]
        });

        if (!pengguna) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Pengguna tidak ditemukan'
            });
        }

        res.status(200).json({
            sukses: true,
            data: pengguna
        });

    } catch (error) {
        console.error('Error get pengguna by id:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Buat pengguna baru (anggota)
exports.buatPengguna = async (req, res) => {
    try {
        const { nama_lengkap, nama_panggilan, nim, nomor_telepon, divisi_id, angkatan } = req.body;

        if (!nama_lengkap || !nama_panggilan || !nim) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Nama lengkap, nama panggilan, dan NIM wajib diisi'
            });
        }

        // Cek NIM sudah ada atau belum di periode ini
        const nimExist = await Pengguna.findOne({
            where: { nim, periode_id: req.pengguna.periode_id }
        });

        if (nimExist) {
            return res.status(400).json({
                sukses: false,
                pesan: 'NIM sudah terdaftar di periode ini'
            });
        }

        // Get periode untuk generate username
        const periode = await Periode.findByPk(req.pengguna.periode_id);
        const username = generateUsername(nama_panggilan, nim, periode);

        // Buat pengguna dengan password = NIM
        const pengguna = await Pengguna.create({
            periode_id: req.pengguna.periode_id,
            divisi_id: divisi_id || null,
            nama_lengkap,
            nama_panggilan,
            nim,
            nomor_telepon,
            username,
            kata_sandi: nim, // Password default = NIM
            angkatan: angkatan || null,
            peran: 'anggota',
            aktif: true
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Anggota berhasil ditambahkan',
            data: {
                id: pengguna.id,
                nama_lengkap: pengguna.nama_lengkap,
                username: pengguna.username,
                kata_sandi_awal: nim
            }
        });

    } catch (error) {
        console.error('Error buat pengguna:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Update pengguna
exports.updatePengguna = async (req, res) => {
    try {
        const { nama_lengkap, nama_panggilan, nim, nomor_telepon, divisi_id, angkatan, aktif } = req.body;

        const pengguna = await Pengguna.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id,
                peran: 'anggota'
            }
        });

        if (!pengguna) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Pengguna tidak ditemukan'
            });
        }

        // Update data
        await pengguna.update({
            nama_lengkap: nama_lengkap || pengguna.nama_lengkap,
            nama_panggilan: nama_panggilan || pengguna.nama_panggilan,
            nim: nim || pengguna.nim,
            nomor_telepon: nomor_telepon !== undefined ? nomor_telepon : pengguna.nomor_telepon,
            divisi_id: divisi_id !== undefined ? divisi_id : pengguna.divisi_id,
            angkatan: angkatan !== undefined ? angkatan : pengguna.angkatan,
            aktif: aktif !== undefined ? aktif : pengguna.aktif
        });

        res.status(200).json({
            sukses: true,
            pesan: 'Data anggota berhasil diperbarui'
        });

    } catch (error) {
        console.error('Error update pengguna:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Hapus pengguna
exports.hapusPengguna = async (req, res) => {
    try {
        const pengguna = await Pengguna.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id,
                peran: 'anggota'
            }
        });

        if (!pengguna) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Pengguna tidak ditemukan'
            });
        }

        await pengguna.destroy();

        res.status(200).json({
            sukses: true,
            pesan: 'Anggota berhasil dihapus'
        });

    } catch (error) {
        console.error('Error hapus pengguna:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Reset password ke NIM
exports.resetPassword = async (req, res) => {
    try {
        const pengguna = await Pengguna.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id,
                peran: 'anggota'
            }
        });

        if (!pengguna) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Pengguna tidak ditemukan'
            });
        }

        await pengguna.update({
            kata_sandi: pengguna.nim
        });

        res.status(200).json({
            sukses: true,
            pesan: 'Password berhasil direset ke NIM'
        });

    } catch (error) {
        console.error('Error reset password:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};
