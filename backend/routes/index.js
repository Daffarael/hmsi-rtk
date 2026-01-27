const express = require('express');
const router = express.Router();

// Controllers
const autentikasiController = require('../controllers/autentikasiController');
const penggunaController = require('../controllers/penggunaController');
const divisiController = require('../controllers/divisiController');
const jenisRapatController = require('../controllers/jenisRapatController');
const rapatController = require('../controllers/rapatController');
const kehadiranController = require('../controllers/kehadiranController');
const eksporController = require('../controllers/eksporController');
const piketController = require('../controllers/piketController');
const kegiatanController = require('../controllers/kegiatanController');
const leaderboardController = require('../controllers/leaderboardController');
const pengingatController = require('../controllers/pengingatController');

// Middleware
const { verifikasiToken, hanyaAdmin, hanyaAnggota, cekMasaJabatan } = require('../middleware/autentikasiMiddleware');

// ==================== AUTENTIKASI ====================
router.post('/autentikasi/masuk', autentikasiController.masuk);
router.post('/autentikasi/keluar', verifikasiToken, autentikasiController.keluar);
router.get('/autentikasi/saya', verifikasiToken, autentikasiController.saya);

// Transfer Admin (khusus admin)
router.post('/autentikasi/akhiri-jabatan', verifikasiToken, hanyaAdmin, autentikasiController.akhiriJabatan);
router.post('/autentikasi/transfer/buat-kode', verifikasiToken, hanyaAdmin, autentikasiController.buatKodeTransfer);
router.post('/autentikasi/transfer/daftar', autentikasiController.daftarAdminBaru);

// ==================== PENGGUNA (Admin Only) ====================
router.get('/pengguna', verifikasiToken, hanyaAdmin, cekMasaJabatan, penggunaController.semuaPengguna);
router.get('/pengguna/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, penggunaController.penggunaById);
router.post('/pengguna', verifikasiToken, hanyaAdmin, cekMasaJabatan, penggunaController.buatPengguna);
router.put('/pengguna/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, penggunaController.updatePengguna);
router.delete('/pengguna/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, penggunaController.hapusPengguna);
router.post('/pengguna/:id/reset-password', verifikasiToken, hanyaAdmin, cekMasaJabatan, penggunaController.resetPassword);

// ==================== DIVISI (Admin Only) ====================
router.get('/divisi', verifikasiToken, divisiController.semuaDivisi);
router.get('/divisi/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, divisiController.divisiById);
router.post('/divisi', verifikasiToken, hanyaAdmin, cekMasaJabatan, divisiController.buatDivisi);
router.put('/divisi/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, divisiController.updateDivisi);
router.delete('/divisi/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, divisiController.hapusDivisi);

// ==================== JENIS RAPAT (Admin Only) ====================
router.get('/jenis-rapat', verifikasiToken, jenisRapatController.semuaJenisRapat);
router.get('/jenis-rapat/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, jenisRapatController.jenisRapatById);
router.post('/jenis-rapat', verifikasiToken, hanyaAdmin, cekMasaJabatan, jenisRapatController.buatJenisRapat);
router.put('/jenis-rapat/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, jenisRapatController.updateJenisRapat);
router.delete('/jenis-rapat/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, jenisRapatController.hapusJenisRapat);

// ==================== RAPAT ====================
// Admin routes
router.get('/rapat', verifikasiToken, hanyaAdmin, cekMasaJabatan, rapatController.semuaRapat);
router.get('/rapat/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, rapatController.rapatById);
router.post('/rapat', verifikasiToken, hanyaAdmin, cekMasaJabatan, rapatController.buatRapat);
router.put('/rapat/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, rapatController.updateRapat);
router.delete('/rapat/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, rapatController.hapusRapat);
router.post('/rapat/:id/publikasi', verifikasiToken, hanyaAdmin, cekMasaJabatan, rapatController.publikasiQR);
router.post('/rapat/:id/batalkan-publikasi', verifikasiToken, hanyaAdmin, cekMasaJabatan, rapatController.batalkanPublikasi);

// Anggota routes (rapat aktif)
router.get('/rapat-aktif', verifikasiToken, hanyaAnggota, rapatController.rapatAktif);

// ==================== KEHADIRAN ====================
router.post('/kehadiran/scan', verifikasiToken, hanyaAnggota, kehadiranController.scanQR);
router.get('/kehadiran/rapat/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, kehadiranController.kehadiranPerRapat);
router.get('/kehadiran/riwayat-saya', verifikasiToken, kehadiranController.riwayatSaya);
router.get('/kehadiran/statistik', verifikasiToken, hanyaAdmin, cekMasaJabatan, kehadiranController.statistikAnggota);

// ==================== PIKET ====================
// Admin routes
router.get('/piket/jadwal', verifikasiToken, hanyaAdmin, cekMasaJabatan, piketController.getJadwalPiket);
router.post('/piket/jadwal', verifikasiToken, hanyaAdmin, cekMasaJabatan, piketController.setJadwalPiket);
router.delete('/piket/jadwal/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, piketController.hapusJadwalPiket);
router.get('/piket/kehadiran', verifikasiToken, hanyaAdmin, cekMasaJabatan, piketController.getKehadiranPiket);
router.post('/piket/kehadiran/toggle', verifikasiToken, hanyaAdmin, cekMasaJabatan, piketController.toggleKehadiranPiket);
router.get('/piket/qr', verifikasiToken, hanyaAdmin, cekMasaJabatan, piketController.getQRPiket);
router.get('/piket/anggota-tersedia', verifikasiToken, hanyaAdmin, cekMasaJabatan, piketController.anggotaTersedia);

// Anggota routes
router.post('/piket/scan', verifikasiToken, hanyaAnggota, piketController.scanPiket);
router.get('/piket/jadwal-saya', verifikasiToken, hanyaAnggota, piketController.jadwalSaya);

// ==================== KEGIATAN ====================
// Admin routes
router.get('/kegiatan', verifikasiToken, hanyaAdmin, cekMasaJabatan, kegiatanController.semuaKegiatan);
router.get('/kegiatan/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, kegiatanController.detailKegiatan);
router.post('/kegiatan', verifikasiToken, hanyaAdmin, cekMasaJabatan, kegiatanController.buatKegiatan);
router.put('/kegiatan/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, kegiatanController.editKegiatan);
router.delete('/kegiatan/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, kegiatanController.hapusKegiatan);
router.post('/kegiatan/:id/publikasi', verifikasiToken, hanyaAdmin, cekMasaJabatan, kegiatanController.publikasikan);

// Anggota routes
router.get('/kegiatan-aktif', verifikasiToken, hanyaAnggota, kegiatanController.kegiatanAktif);
router.post('/kehadiran-kegiatan/scan', verifikasiToken, hanyaAnggota, kegiatanController.scanKegiatan);
router.get('/kehadiran-kegiatan/:id', verifikasiToken, hanyaAdmin, cekMasaJabatan, kegiatanController.kehadiranPerKegiatan);

// ==================== LEADERBOARD ====================
router.get('/leaderboard', verifikasiToken, hanyaAdmin, cekMasaJabatan, leaderboardController.getLeaderboard);
router.get('/leaderboard/rekomendasi', verifikasiToken, hanyaAdmin, cekMasaJabatan, leaderboardController.getRekomendasi);
router.post('/leaderboard/pilih', verifikasiToken, hanyaAdmin, cekMasaJabatan, leaderboardController.pilihOfTheMonth);
router.get('/leaderboard/history', verifikasiToken, hanyaAdmin, cekMasaJabatan, leaderboardController.getHistory);

// ==================== EKSPOR (Admin Only) ====================
router.get('/ekspor/rapat/:id/excel', verifikasiToken, hanyaAdmin, cekMasaJabatan, eksporController.eksporRapatExcel);
router.get('/ekspor/rapat/:id/pdf', verifikasiToken, hanyaAdmin, cekMasaJabatan, eksporController.eksporRapatPDF);

// ==================== PENGINGAT (User) ====================
router.get('/pengingat', verifikasiToken, pengingatController.getPengingat);

module.exports = router;
