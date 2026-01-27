'use strict';

const { Rapat, JadwalPiket, Kegiatan, Pengguna } = require('../models');
const { Op } = require('sequelize');

// Get pengingat/reminder untuk user yang login
const getPengingat = async (req, res) => {
    try {
        const userId = req.pengguna.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const dayAfterTomorrow = new Date(today);
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

        // Get hari ini (Senin, Selasa, dst)
        const HARI_LIST = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
        const hariIni = HARI_LIST[today.getDay()];

        // 1. Rapat yang akan datang (hari ini atau besok, yang sudah dipublikasikan)
        const rapatMendatang = await Rapat.findAll({
            where: {
                dipublikasikan: true,
                tanggal_rapat: {
                    [Op.gte]: today,
                    [Op.lt]: dayAfterTomorrow
                }
            },
            order: [['tanggal_rapat', 'ASC']],
            limit: 5
        });

        // 2. Jadwal piket user hari ini
        const jadwalPiketHariIni = await JadwalPiket.findAll({
            where: {
                pengguna_id: userId,
                hari: hariIni,
                aktif: true
            }
        });

        // 3. Kegiatan yang sudah dipublikasikan dan akan datang
        const kegiatanMendatang = await Kegiatan.findAll({
            where: {
                dipublikasikan: true,
                tanggal_kegiatan: {
                    [Op.gte]: today,
                    [Op.lt]: dayAfterTomorrow
                }
            },
            order: [['tanggal_kegiatan', 'ASC']],
            limit: 5
        });

        // Format response
        const pengingat = [];

        // Add rapat
        rapatMendatang.forEach(r => {
            const isHariIni = new Date(r.tanggal_rapat).toDateString() === today.toDateString();
            pengingat.push({
                tipe: 'rapat',
                judul: r.nama,
                waktu: r.waktu_rapat,
                tanggal: r.tanggal_rapat,
                isHariIni,
                icon: '📅'
            });
        });

        // Add piket
        if (jadwalPiketHariIni.length > 0) {
            pengingat.push({
                tipe: 'piket',
                judul: 'Jadwal Piket Hari Ini',
                waktu: null,
                tanggal: today,
                isHariIni: true,
                icon: '🧹'
            });
        }

        // Add kegiatan
        kegiatanMendatang.forEach(k => {
            const isHariIni = new Date(k.tanggal_kegiatan).toDateString() === today.toDateString();
            pengingat.push({
                tipe: 'kegiatan',
                judul: k.nama,
                waktu: k.waktu_kegiatan,
                tanggal: k.tanggal_kegiatan,
                isHariIni,
                icon: '🎉'
            });
        });

        // Sort by isHariIni first, then by tanggal
        pengingat.sort((a, b) => {
            if (a.isHariIni && !b.isHariIni) return -1;
            if (!a.isHariIni && b.isHariIni) return 1;
            return new Date(a.tanggal) - new Date(b.tanggal);
        });

        res.json({
            sukses: true,
            data: pengingat
        });
    } catch (error) {
        console.error('Error getPengingat:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan saat mengambil pengingat'
        });
    }
};

module.exports = {
    getPengingat
};
