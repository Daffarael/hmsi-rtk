const { JenisRapat, Rapat } = require('../models');
const { Op } = require('sequelize');

// Get semua jenis rapat
exports.semuaJenisRapat = async (req, res) => {
    try {
        const jenisRapat = await JenisRapat.findAll({
            where: { aktif: true },
            order: [['nama', 'ASC']]
        });

        res.status(200).json({
            sukses: true,
            data: jenisRapat
        });

    } catch (error) {
        console.error('Error get semua jenis rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get jenis rapat by ID
exports.jenisRapatById = async (req, res) => {
    try {
        const jenisRapat = await JenisRapat.findByPk(req.params.id);

        if (!jenisRapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Jenis rapat tidak ditemukan'
            });
        }

        res.status(200).json({
            sukses: true,
            data: jenisRapat
        });

    } catch (error) {
        console.error('Error get jenis rapat by id:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Buat jenis rapat
exports.buatJenisRapat = async (req, res) => {
    try {
        const { nama, deskripsi } = req.body;

        if (!nama) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Nama jenis rapat wajib diisi'
            });
        }

        const namaExist = await JenisRapat.findOne({
            where: { nama: { [Op.like]: nama } }
        });

        if (namaExist) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Nama jenis rapat sudah ada'
            });
        }

        const jenisRapat = await JenisRapat.create({
            nama,
            deskripsi: deskripsi || null,
            aktif: true
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Jenis rapat berhasil ditambahkan',
            data: jenisRapat
        });

    } catch (error) {
        console.error('Error buat jenis rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Update jenis rapat
exports.updateJenisRapat = async (req, res) => {
    try {
        const { nama, deskripsi, aktif } = req.body;

        const jenisRapat = await JenisRapat.findByPk(req.params.id);

        if (!jenisRapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Jenis rapat tidak ditemukan'
            });
        }

        await jenisRapat.update({
            nama: nama || jenisRapat.nama,
            deskripsi: deskripsi !== undefined ? deskripsi : jenisRapat.deskripsi,
            aktif: aktif !== undefined ? aktif : jenisRapat.aktif
        });

        res.status(200).json({
            sukses: true,
            pesan: 'Jenis rapat berhasil diperbarui'
        });

    } catch (error) {
        console.error('Error update jenis rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Hapus jenis rapat
exports.hapusJenisRapat = async (req, res) => {
    try {
        const jenisRapat = await JenisRapat.findByPk(req.params.id);

        if (!jenisRapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Jenis rapat tidak ditemukan'
            });
        }

        // Cek apakah ada rapat dengan jenis ini
        const jumlahRapat = await Rapat.count({
            where: { jenis_rapat_id: req.params.id }
        });

        if (jumlahRapat > 0) {
            return res.status(400).json({
                sukses: false,
                pesan: `Tidak dapat menghapus. Masih ada ${jumlahRapat} rapat dengan jenis ini.`
            });
        }

        await jenisRapat.destroy();

        res.status(200).json({
            sukses: true,
            pesan: 'Jenis rapat berhasil dihapus'
        });

    } catch (error) {
        console.error('Error hapus jenis rapat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};
