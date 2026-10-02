const { Op } = require('sequelize');
const {
    Pengguna, Periode, Divisi,
    Kehadiran, Rapat,
    JadwalPiket, KehadiranPiket,
    Kegiatan, KehadiranKegiatan
} = require('../models');

// Konstanta bobot skor
const BOBOT = {
    PIKET: 1,
    RAPAT: 2,
    KEGIATAN: 3
};

// Helper: Hitung skor anggota untuk bulan tertentu
const hitungSkorAnggota = async (penggunaId, bulan, tahun, periodeId) => {
    const awalBulan = new Date(tahun, bulan - 1, 1);
    const akhirBulan = new Date(tahun, bulan, 0, 23, 59, 59);

    // Hitung kehadiran piket
    const jadwalPiket = await JadwalPiket.findAll({
        where: { pengguna_id: penggunaId, periode_id: periodeId, aktif: true },
        include: [{
            model: KehadiranPiket,
            as: 'kehadiran_piket',
            where: {
                tanggal: {
                    [Op.between]: [awalBulan.toISOString().split('T')[0], akhirBulan.toISOString().split('T')[0]]
                }
            },
            required: false
        }]
    });
    const totalPiket = jadwalPiket.reduce((acc, jp) => acc + jp.kehadiran_piket.length, 0);

    // Hitung kehadiran rapat
    const kehadiranRapat = await Kehadiran.count({
        where: { pengguna_id: penggunaId },
        include: [{
            model: Rapat,
            as: 'rapat',
            where: {
                periode_id: periodeId,
                tanggal_rapat: { [Op.between]: [awalBulan, akhirBulan] }
            },
            required: true
        }]
    });

    // Hitung kehadiran kegiatan
    const kehadiranKegiatan = await KehadiranKegiatan.count({
        where: { pengguna_id: penggunaId },
        include: [{
            model: Kegiatan,
            as: 'kegiatan',
            where: {
                periode_id: periodeId,
                tanggal_kegiatan: { [Op.between]: [awalBulan, akhirBulan] }
            },
            required: true
        }]
    });

    const skor = (totalPiket * BOBOT.PIKET) + (kehadiranRapat * BOBOT.RAPAT) + (kehadiranKegiatan * BOBOT.KEGIATAN);

    return {
        piket: totalPiket,
        rapat: kehadiranRapat,
        kegiatan: kehadiranKegiatan,
        skor
    };
};

// GET /api/leaderboard - Get leaderboard untuk bulan tertentu
exports.getLeaderboard = async (req, res) => {
    try {
        const { bulan, tahun, tipe } = req.query;
        const targetBulan = bulan ? parseInt(bulan) : new Date().getMonth() + 1;
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();

        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        // Get semua anggota aktif
        const whereAnggota = {
            periode_id: periodeAktif.id,
            peran: 'anggota',
            aktif: true
        };

        if (tipe && ['presidium', 'staff'].includes(tipe)) {
            whereAnggota.tipe_anggota = tipe;
        }

        const anggota = await Pengguna.findAll({
            where: whereAnggota,
            attributes: ['id', 'nama_lengkap', 'nama_panggilan', 'tipe_anggota'],
            include: [{ model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }]
        });

        // Hitung skor untuk setiap anggota
        const leaderboard = await Promise.all(
            anggota.map(async (a) => {
                const skor = await hitungSkorAnggota(a.id, targetBulan, targetTahun, periodeAktif.id);
                return {
                    pengguna: a,
                    ...skor
                };
            })
        );

        // Sort by skor descending
        leaderboard.sort((a, b) => b.skor - a.skor);

        // Add ranking
        const ranked = leaderboard.map((item, index) => ({
            rank: index + 1,
            ...item
        }));

        res.json({
            sukses: true,
            data: {
                bulan: targetBulan,
                tahun: targetTahun,
                bobot: BOBOT,
                leaderboard: ranked
            }
        });
    } catch (error) {
        console.error('Error getLeaderboard:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil leaderboard' });
    }
};

// GET /api/leaderboard/rekomendasi - Get rekomendasi "Of the Month"
exports.getRekomendasi = async (req, res) => {
    try {
        const { bulan, tahun } = req.query;
        const targetBulan = bulan ? parseInt(bulan) : new Date().getMonth() + 1;
        const targetTahun = tahun ? parseInt(tahun) : new Date().getFullYear();

        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        // Get top Presidium
        const presidium = await Pengguna.findAll({
            where: {
                periode_id: periodeAktif.id,
                peran: 'anggota',
                tipe_anggota: 'presidium',
                aktif: true
            },
            attributes: ['id', 'nama_lengkap', 'nama_panggilan'],
            include: [{ model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }]
        });

        const skorPresidium = await Promise.all(
            presidium.map(async (p) => ({
                pengguna: p,
                ...(await hitungSkorAnggota(p.id, targetBulan, targetTahun, periodeAktif.id))
            }))
        );
        skorPresidium.sort((a, b) => b.skor - a.skor);

        // Get top Staff
        const staff = await Pengguna.findAll({
            where: {
                periode_id: periodeAktif.id,
                peran: 'anggota',
                tipe_anggota: 'staff',
                aktif: true
            },
            attributes: ['id', 'nama_lengkap', 'nama_panggilan'],
            include: [{ model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }]
        });

        const skorStaff = await Promise.all(
            staff.map(async (s) => ({
                pengguna: s,
                ...(await hitungSkorAnggota(s.id, targetBulan, targetTahun, periodeAktif.id))
            }))
        );
        skorStaff.sort((a, b) => b.skor - a.skor);

        res.json({
            sukses: true,
            data: {
                bulan: targetBulan,
                tahun: targetTahun,
                rekomendasi: {
                    presidium: skorPresidium[0] || null,
                    staff: skorStaff[0] || null
                },
                top5: {
                    presidium: skorPresidium.slice(0, 5),
                    staff: skorStaff.slice(0, 5)
                }
            }
        });
    } catch (error) {
        console.error('Error getRekomendasi:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil rekomendasi' });
    }
};
