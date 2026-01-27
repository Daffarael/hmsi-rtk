const { Divisi, Pengguna } = require('../models');
const { Op } = require('sequelize');

// Get semua divisi
exports.semuaDivisi = async (req, res) => {
    try {
        const divisi = await Divisi.findAll({
            where: { aktif: true },
            order: [['nama', 'ASC']]
        });

        res.status(200).json({
            sukses: true,
            data: divisi
        });

    } catch (error) {
        console.error('Error get semua divisi:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Get divisi by ID
exports.divisiById = async (req, res) => {
    try {
        const divisi = await Divisi.findByPk(req.params.id, {
            include: [{
                model: Pengguna,
                as: 'anggota',
                attributes: ['id', 'nama_lengkap', 'nim'],
                where: { aktif: true },
                required: false
            }]
        });

        if (!divisi) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Divisi tidak ditemukan'
            });
        }

        res.status(200).json({
            sukses: true,
            data: divisi
        });

    } catch (error) {
        console.error('Error get divisi by id:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Buat divisi baru
exports.buatDivisi = async (req, res) => {
    try {
        const { nama, deskripsi } = req.body;

        if (!nama) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Nama divisi wajib diisi'
            });
        }

        // Cek nama sudah ada
        const namaExist = await Divisi.findOne({
            where: { nama: { [Op.like]: nama } }
        });

        if (namaExist) {
            return res.status(400).json({
                sukses: false,
                pesan: 'Nama divisi sudah ada'
            });
        }

        const divisi = await Divisi.create({
            nama,
            deskripsi: deskripsi || null,
            aktif: true
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Divisi berhasil ditambahkan',
            data: divisi
        });

    } catch (error) {
        console.error('Error buat divisi:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Update divisi
exports.updateDivisi = async (req, res) => {
    try {
        const { nama, deskripsi, aktif } = req.body;

        const divisi = await Divisi.findByPk(req.params.id);

        if (!divisi) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Divisi tidak ditemukan'
            });
        }

        await divisi.update({
            nama: nama || divisi.nama,
            deskripsi: deskripsi !== undefined ? deskripsi : divisi.deskripsi,
            aktif: aktif !== undefined ? aktif : divisi.aktif
        });

        res.status(200).json({
            sukses: true,
            pesan: 'Divisi berhasil diperbarui'
        });

    } catch (error) {
        console.error('Error update divisi:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Hapus divisi
exports.hapusDivisi = async (req, res) => {
    try {
        const divisi = await Divisi.findByPk(req.params.id);

        if (!divisi) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Divisi tidak ditemukan'
            });
        }

        // Cek apakah ada anggota di divisi ini
        const jumlahAnggota = await Pengguna.count({
            where: { divisi_id: req.params.id }
        });

        if (jumlahAnggota > 0) {
            return res.status(400).json({
                sukses: false,
                pesan: `Tidak dapat menghapus divisi. Masih ada ${jumlahAnggota} anggota di divisi ini.`
            });
        }

        await divisi.destroy();

        res.status(200).json({
            sukses: true,
            pesan: 'Divisi berhasil dihapus'
        });

    } catch (error) {
        console.error('Error hapus divisi:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};
