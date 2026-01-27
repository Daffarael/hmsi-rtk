const { Op } = require('sequelize');
const { JadwalPiket, KehadiranPiket, QRPiket, Pengguna, Periode, Divisi } = require('../models');
const crypto = require('crypto');

// Helper: Get nama hari dari tanggal
const getNamaHari = (date) => {
    const hari = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    return hari[new Date(date).getDay()];
};

// Helper: Get minggu ke-berapa dalam bulan (sesuai kalender: Senin-Minggu)
// Contoh: Januari 2026 dimulai Kamis, maka:
// - Minggu 1 = 1-4 Jan (Kamis-Minggu)
// - Minggu 2 = 5-11 Jan (Senin-Minggu)
// - dst.
const getMingguKe = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = d.getMonth();
    const day = d.getDate();

    // First day of month and its day of week
    const firstOfMonth = new Date(year, month, 1);
    const firstDayOfWeek = firstOfMonth.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Convert to ISO week day (Mon=1, Tue=2, ..., Sun=7)
    const isoFirstDay = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;

    // Days in first week (from 1st to Sunday)
    // If month starts Mon (1), first week has 7 days
    // If month starts Thu (4), first week has 4 days (Thu, Fri, Sat, Sun)
    // If month starts Sun (7), first week has 1 day
    const daysInFirstWeek = 8 - isoFirstDay;

    if (day <= daysInFirstWeek) {
        return 1;
    }

    // After week 1, calculate 7-day blocks
    return Math.ceil((day - daysInFirstWeek) / 7) + 1;
};

// ==================== JADWAL PIKET ====================

// GET /api/piket/jadwal - Ambil semua jadwal piket periode aktif
exports.getJadwalPiket = async (req, res) => {
    try {
        const { hari } = req.query;

        // Get periode aktif
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        const whereClause = {
            periode_id: periodeAktif.id,
            aktif: true
        };

        if (hari) {
            whereClause.hari = hari.toLowerCase();
        }

        const jadwal = await JadwalPiket.findAll({
            where: whereClause,
            include: [
                {
                    model: Pengguna,
                    as: 'pengguna',
                    attributes: ['id', 'nama_lengkap', 'nama_panggilan', 'nim'],
                    include: [
                        {
                            model: Divisi,
                            as: 'divisi',
                            attributes: ['id', 'nama']
                        }
                    ]
                }
            ],
            order: [
                ['hari', 'ASC'],
                [{ model: Pengguna, as: 'pengguna' }, 'nama_lengkap', 'ASC']
            ]
        });

        // Group by hari
        const jadwalPerHari = {
            senin: [],
            selasa: [],
            rabu: [],
            kamis: [],
            jumat: []
        };

        jadwal.forEach(j => {
            jadwalPerHari[j.hari].push({
                id: j.id,
                pengguna: j.pengguna,
                hari: j.hari
            });
        });

        res.json({
            sukses: true,
            data: hari ? jadwal : jadwalPerHari
        });
    } catch (error) {
        console.error('Error getJadwalPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil jadwal piket' });
    }
};

// POST /api/piket/jadwal - Tetapkan anggota ke hari piket
exports.setJadwalPiket = async (req, res) => {
    try {
        const { pengguna_id, hari } = req.body;

        if (!pengguna_id || !hari) {
            return res.status(400).json({ sukses: false, pesan: 'pengguna_id dan hari wajib diisi' });
        }

        const hariValid = ['senin', 'selasa', 'rabu', 'kamis', 'jumat'];
        if (!hariValid.includes(hari.toLowerCase())) {
            return res.status(400).json({ sukses: false, pesan: 'Hari tidak valid (senin-jumat)' });
        }

        // Get periode aktif
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        // Cek apakah pengguna ada
        const pengguna = await Pengguna.findByPk(pengguna_id);
        if (!pengguna) {
            return res.status(404).json({ sukses: false, pesan: 'Pengguna tidak ditemukan' });
        }

        // Cek apakah anggota sudah punya jadwal di hari MANAPUN (1 anggota = 1 hari)
        const existingAnyDay = await JadwalPiket.findOne({
            where: {
                periode_id: periodeAktif.id,
                pengguna_id,
                aktif: true
            }
        });

        if (existingAnyDay) {
            const hariLabel = { senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis', jumat: 'Jumat' };
            return res.status(400).json({
                sukses: false,
                pesan: `Anggota sudah terdaftar di hari ${hariLabel[existingAnyDay.hari]}. Hapus jadwal tersebut terlebih dahulu.`
            });
        }

        const jadwal = await JadwalPiket.create({
            periode_id: periodeAktif.id,
            pengguna_id,
            hari: hari.toLowerCase()
        });

        const jadwalWithPengguna = await JadwalPiket.findByPk(jadwal.id, {
            include: [
                {
                    model: Pengguna,
                    as: 'pengguna',
                    attributes: ['id', 'nama_lengkap', 'nama_panggilan', 'nim'],
                    include: [{ model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }]
                }
            ]
        });

        res.status(201).json({
            sukses: true,
            pesan: 'Jadwal piket berhasil ditambahkan',
            data: jadwalWithPengguna
        });
    } catch (error) {
        console.error('Error setJadwalPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal menambahkan jadwal piket' });
    }
};

// DELETE /api/piket/jadwal/:id - Hapus jadwal piket
exports.hapusJadwalPiket = async (req, res) => {
    try {
        const { id } = req.params;

        const jadwal = await JadwalPiket.findByPk(id);
        if (!jadwal) {
            return res.status(404).json({ sukses: false, pesan: 'Jadwal piket tidak ditemukan' });
        }

        await jadwal.destroy();

        res.json({ sukses: true, pesan: 'Jadwal piket berhasil dihapus' });
    } catch (error) {
        console.error('Error hapusJadwalPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal menghapus jadwal piket' });
    }
};

// ==================== KEHADIRAN PIKET ====================

// GET /api/piket/kehadiran - Ambil rekap kehadiran piket
exports.getKehadiranPiket = async (req, res) => {
    try {
        const { bulan, tahun } = req.query;

        // Default ke bulan dan tahun sekarang
        const now = new Date();
        const targetBulan = bulan ? parseInt(bulan) : now.getMonth() + 1;
        const targetTahun = tahun ? parseInt(tahun) : now.getFullYear();

        // Get periode aktif
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        // Get semua jadwal piket
        const jadwalList = await JadwalPiket.findAll({
            where: { periode_id: periodeAktif.id, aktif: true },
            include: [
                {
                    model: Pengguna,
                    as: 'pengguna',
                    attributes: ['id', 'nama_lengkap', 'nama_panggilan']
                },
                {
                    model: KehadiranPiket,
                    as: 'kehadiran_piket',
                    required: false
                }
            ]
        });

        // Generate semua tanggal piket dalam bulan tersebut
        const hariMap = { senin: 1, selasa: 2, rabu: 3, kamis: 4, jumat: 5 };
        const firstDay = new Date(targetTahun, targetBulan - 1, 1);
        const lastDay = new Date(targetTahun, targetBulan, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Build rekap per anggota
        const rekap = jadwalList.map(jadwal => {
            const tanggalPiket = [];
            const current = new Date(firstDay);

            while (current <= lastDay) {
                const dayOfWeek = current.getDay();
                if (dayOfWeek === hariMap[jadwal.hari]) {
                    const tanggalStr = current.toISOString().split('T')[0];
                    const kehadiranRecord = jadwal.kehadiran_piket.find(k => k.tanggal === tanggalStr);
                    const sudahLewat = current < today;

                    tanggalPiket.push({
                        tanggal: tanggalStr,
                        minggu_ke: getMingguKe(current),
                        hadir: !!kehadiranRecord,
                        sudah_lewat: sudahLewat,
                        kehadiran_id: kehadiranRecord?.id || null
                    });
                }
                current.setDate(current.getDate() + 1);
            }

            return {
                jadwal_id: jadwal.id,
                pengguna: jadwal.pengguna,
                hari: jadwal.hari,
                kehadiran: tanggalPiket
            };
        });

        res.json({
            sukses: true,
            data: {
                bulan: targetBulan,
                tahun: targetTahun,
                rekap
            }
        });
    } catch (error) {
        console.error('Error getKehadiranPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil rekap kehadiran piket' });
    }
};

// POST /api/piket/kehadiran/toggle - Toggle kehadiran piket (admin only)
exports.toggleKehadiranPiket = async (req, res) => {
    try {
        const { jadwal_id, tanggal, hadir } = req.body;

        if (!jadwal_id || !tanggal) {
            return res.status(400).json({ sukses: false, pesan: 'jadwal_id dan tanggal wajib diisi' });
        }

        // Validasi jadwal exists
        const jadwal = await JadwalPiket.findByPk(jadwal_id);
        if (!jadwal) {
            return res.status(404).json({ sukses: false, pesan: 'Jadwal tidak ditemukan' });
        }

        // Cek kehadiran existing
        const existing = await KehadiranPiket.findOne({
            where: { jadwal_piket_id: jadwal_id, tanggal }
        });

        if (hadir) {
            // Set hadir - create if not exists
            if (!existing) {
                await KehadiranPiket.create({
                    jadwal_piket_id: jadwal_id,
                    tanggal,
                    waktu_scan: new Date()
                });
            }
            res.json({ sukses: true, pesan: 'Kehadiran berhasil dicatat', hadir: true });
        } else {
            // Set tidak hadir - delete if exists
            if (existing) {
                await existing.destroy();
            }
            res.json({ sukses: true, pesan: 'Kehadiran berhasil dihapus', hadir: false });
        }
    } catch (error) {
        console.error('Error toggleKehadiranPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengubah kehadiran' });
    }
};

// ==================== QR PIKET ====================

// GET /api/piket/qr - Get/Generate QR piket untuk periode aktif
exports.getQRPiket = async (req, res) => {
    try {
        // Get periode aktif
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        // Cek apakah sudah ada QR untuk periode ini
        let qrPiket = await QRPiket.findOne({
            where: { periode_id: periodeAktif.id }
        });

        // Jika belum ada, buat baru
        if (!qrPiket) {
            qrPiket = await QRPiket.create({
                periode_id: periodeAktif.id,
                kode_qr: `PIKET-${crypto.randomBytes(16).toString('hex').toUpperCase()}`
            });
        }

        res.json({
            sukses: true,
            data: {
                id: qrPiket.id,
                kode_qr: qrPiket.kode_qr,
                periode: periodeAktif.nama
            }
        });
    } catch (error) {
        console.error('Error getQRPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil QR piket' });
    }
};

// ==================== SCAN PIKET (ANGGOTA) ====================

// POST /api/piket/scan - Scan QR piket
exports.scanPiket = async (req, res) => {
    try {
        const { kode_qr } = req.body;
        const penggunaId = req.pengguna.id;

        if (!kode_qr) {
            return res.status(400).json({ sukses: false, pesan: 'Kode QR wajib diisi' });
        }

        // Validasi QR
        const qrPiket = await QRPiket.findOne({
            where: { kode_qr },
            include: [{ model: Periode, as: 'periode' }]
        });

        if (!qrPiket) {
            return res.status(404).json({ sukses: false, pesan: 'QR tidak valid' });
        }

        if (!qrPiket.periode.aktif) {
            return res.status(400).json({ sukses: false, pesan: 'Periode sudah tidak aktif' });
        }

        // Cek hari ini
        const today = new Date();
        const hariIni = getNamaHari(today);
        const tanggalIni = today.toISOString().split('T')[0];

        // Cek apakah hari ini adalah hari kerja (senin-jumat)
        if (!['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(hariIni)) {
            return res.status(400).json({ sukses: false, pesan: 'Hari ini bukan hari piket (Senin-Jumat)' });
        }

        // Cek jadwal piket anggota
        const jadwalPiket = await JadwalPiket.findOne({
            where: {
                periode_id: qrPiket.periode_id,
                pengguna_id: penggunaId,
                hari: hariIni,
                aktif: true
            }
        });

        if (!jadwalPiket) {
            return res.status(400).json({
                sukses: false,
                pesan: `Hari ini bukan hari piket Anda. Jadwal piket Anda bukan hari ${hariIni.charAt(0).toUpperCase() + hariIni.slice(1)}.`
            });
        }

        // Cek apakah sudah scan hari ini
        const sudahScan = await KehadiranPiket.findOne({
            where: {
                jadwal_piket_id: jadwalPiket.id,
                tanggal: tanggalIni
            }
        });

        if (sudahScan) {
            return res.status(400).json({ sukses: false, pesan: 'Anda sudah melakukan absensi piket hari ini' });
        }

        // Record kehadiran
        const kehadiran = await KehadiranPiket.create({
            jadwal_piket_id: jadwalPiket.id,
            tanggal: tanggalIni,
            waktu_scan: new Date()
        });

        res.json({
            sukses: true,
            pesan: 'Absensi piket berhasil dicatat!',
            data: {
                hari: hariIni,
                tanggal: tanggalIni,
                waktu_scan: kehadiran.waktu_scan
            }
        });
    } catch (error) {
        console.error('Error scanPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mencatat absensi piket' });
    }
};

// GET /api/piket/jadwal-saya - Ambil jadwal piket anggota yang login
exports.jadwalSaya = async (req, res) => {
    try {
        const penggunaId = req.pengguna.id;

        // Get periode aktif
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        const jadwal = await JadwalPiket.findAll({
            where: {
                periode_id: periodeAktif.id,
                pengguna_id: penggunaId,
                aktif: true
            },
            order: [['hari', 'ASC']]
        });

        // Cek status piket hari ini
        const today = new Date();
        const hariIni = getNamaHari(today);
        const tanggalIni = today.toISOString().split('T')[0];

        let statusHariIni = null;
        const jadwalHariIni = jadwal.find(j => j.hari === hariIni);

        if (jadwalHariIni) {
            const sudahScan = await KehadiranPiket.findOne({
                where: {
                    jadwal_piket_id: jadwalHariIni.id,
                    tanggal: tanggalIni
                }
            });

            statusHariIni = {
                hariPiket: true,
                sudahAbsen: !!sudahScan,
                waktuScan: sudahScan?.waktu_scan || null
            };
        } else {
            statusHariIni = {
                hariPiket: false,
                sudahAbsen: false,
                waktuScan: null
            };
        }

        res.json({
            sukses: true,
            data: {
                jadwal: jadwal.map(j => j.hari),
                hariIni: hariIni,
                statusHariIni
            }
        });
    } catch (error) {
        console.error('Error jadwalSaya:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil jadwal piket' });
    }
};

// GET /api/piket/anggota-tersedia - Ambil anggota yang belum punya jadwal di hari tertentu
exports.anggotaTersedia = async (req, res) => {
    try {
        const { hari } = req.query;

        // Get periode aktif
        const periodeAktif = await Periode.findOne({ where: { aktif: true } });
        if (!periodeAktif) {
            return res.status(404).json({ sukses: false, pesan: 'Tidak ada periode aktif' });
        }

        // Get semua anggota aktif (bukan admin)
        const semuaAnggota = await Pengguna.findAll({
            where: {
                periode_id: periodeAktif.id,
                peran: 'anggota',
                aktif: true
            },
            attributes: ['id', 'nama_lengkap', 'nama_panggilan', 'nim'],
            include: [{ model: Divisi, as: 'divisi', attributes: ['id', 'nama'] }]
        });

        if (!hari) {
            return res.json({ sukses: true, data: semuaAnggota });
        }

        // Get anggota yang sudah punya jadwal di HARI MANAPUN (1 anggota = 1 hari)
        const sudahDijadwalkan = await JadwalPiket.findAll({
            where: {
                periode_id: periodeAktif.id,
                aktif: true
            },
            attributes: ['pengguna_id']
        });

        const sudahDijadwalkanIds = sudahDijadwalkan.map(j => j.pengguna_id);

        // Filter anggota yang belum dijadwalkan sama sekali
        const anggotaTersedia = semuaAnggota.filter(a => !sudahDijadwalkanIds.includes(a.id));

        res.json({ sukses: true, data: anggotaTersedia });
    } catch (error) {
        console.error('Error anggotaTersedia:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mengambil daftar anggota' });
    }
};
