const sequelize = require('../config/database');
const Periode = require('./Periode');
const Pengguna = require('./Pengguna');
const Divisi = require('./Divisi');
const JenisRapat = require('./JenisRapat');
const Rapat = require('./Rapat');
const Kehadiran = require('./Kehadiran');
const TransferAdmin = require('./TransferAdmin');
const JadwalPiket = require('./JadwalPiket');
const KehadiranPiket = require('./KehadiranPiket');
const QRPiket = require('./QRPiket');
const Kegiatan = require('./Kegiatan');
const KehadiranKegiatan = require('./KehadiranKegiatan');
const OfTheMonth = require('./OfTheMonth');
const BuktiPiket = require('./BuktiPiket');

// ==================== ASOSIASI ====================

// Periode -> Pengguna (1:N)
Periode.hasMany(Pengguna, { foreignKey: 'periode_id', as: 'pengguna' });
Pengguna.belongsTo(Periode, { foreignKey: 'periode_id', as: 'periode' });

// Periode -> Rapat (1:N)
Periode.hasMany(Rapat, { foreignKey: 'periode_id', as: 'rapat' });
Rapat.belongsTo(Periode, { foreignKey: 'periode_id', as: 'periode' });

// Periode -> TransferAdmin (1:N)
Periode.hasMany(TransferAdmin, { foreignKey: 'periode_id', as: 'transfer_admin' });
TransferAdmin.belongsTo(Periode, { foreignKey: 'periode_id', as: 'periode' });

// Divisi -> Pengguna (1:N)
Divisi.hasMany(Pengguna, { foreignKey: 'divisi_id', as: 'anggota' });
Pengguna.belongsTo(Divisi, { foreignKey: 'divisi_id', as: 'divisi' });

// JenisRapat -> Rapat (1:N)
JenisRapat.hasMany(Rapat, { foreignKey: 'jenis_rapat_id', as: 'rapat' });
Rapat.belongsTo(JenisRapat, { foreignKey: 'jenis_rapat_id', as: 'jenis_rapat' });

// Rapat -> Kehadiran (1:N)
Rapat.hasMany(Kehadiran, { foreignKey: 'rapat_id', as: 'kehadiran' });
Kehadiran.belongsTo(Rapat, { foreignKey: 'rapat_id', as: 'rapat' });

// Pengguna -> Kehadiran (1:N)
Pengguna.hasMany(Kehadiran, { foreignKey: 'pengguna_id', as: 'kehadiran' });
Kehadiran.belongsTo(Pengguna, { foreignKey: 'pengguna_id', as: 'pengguna' });

// Pengguna -> TransferAdmin (1:N) - Admin lama
Pengguna.hasMany(TransferAdmin, { foreignKey: 'admin_lama_id', as: 'transfer_dibuat' });
TransferAdmin.belongsTo(Pengguna, { foreignKey: 'admin_lama_id', as: 'admin_lama' });

// ==================== ASOSIASI PIKET ====================

// Periode -> JadwalPiket (1:N)
Periode.hasMany(JadwalPiket, { foreignKey: 'periode_id', as: 'jadwal_piket' });
JadwalPiket.belongsTo(Periode, { foreignKey: 'periode_id', as: 'periode' });

// Pengguna -> JadwalPiket (1:N)
Pengguna.hasMany(JadwalPiket, { foreignKey: 'pengguna_id', as: 'jadwal_piket' });
JadwalPiket.belongsTo(Pengguna, { foreignKey: 'pengguna_id', as: 'pengguna' });

// JadwalPiket -> KehadiranPiket (1:N)
JadwalPiket.hasMany(KehadiranPiket, { foreignKey: 'jadwal_piket_id', as: 'kehadiran_piket' });
KehadiranPiket.belongsTo(JadwalPiket, { foreignKey: 'jadwal_piket_id', as: 'jadwal_piket' });

// KehadiranPiket -> BuktiPiket (1:N)
KehadiranPiket.hasMany(BuktiPiket, { foreignKey: 'kehadiran_piket_id', as: 'bukti_piket' });
BuktiPiket.belongsTo(KehadiranPiket, { foreignKey: 'kehadiran_piket_id', as: 'kehadiran_piket' });

// Periode -> QRPiket (1:1)
Periode.hasOne(QRPiket, { foreignKey: 'periode_id', as: 'qr_piket' });
QRPiket.belongsTo(Periode, { foreignKey: 'periode_id', as: 'periode' });

// ==================== ASOSIASI KEGIATAN ====================

// Periode -> Kegiatan (1:N)
Periode.hasMany(Kegiatan, { foreignKey: 'periode_id', as: 'kegiatan' });
Kegiatan.belongsTo(Periode, { foreignKey: 'periode_id', as: 'periode' });

// Kegiatan -> KehadiranKegiatan (1:N)
Kegiatan.hasMany(KehadiranKegiatan, { foreignKey: 'kegiatan_id', as: 'kehadiran' });
KehadiranKegiatan.belongsTo(Kegiatan, { foreignKey: 'kegiatan_id', as: 'kegiatan' });

// Pengguna -> KehadiranKegiatan (1:N)
Pengguna.hasMany(KehadiranKegiatan, { foreignKey: 'pengguna_id', as: 'kehadiran_kegiatan' });
KehadiranKegiatan.belongsTo(Pengguna, { foreignKey: 'pengguna_id', as: 'pengguna' });

// ==================== ASOSIASI OF THE MONTH ====================

// Periode -> OfTheMonth (1:N)
Periode.hasMany(OfTheMonth, { foreignKey: 'periode_id', as: 'of_the_month' });
OfTheMonth.belongsTo(Periode, { foreignKey: 'periode_id', as: 'periode' });

// Pengguna -> OfTheMonth (1:N)
Pengguna.hasMany(OfTheMonth, { foreignKey: 'pengguna_id', as: 'penghargaan' });
OfTheMonth.belongsTo(Pengguna, { foreignKey: 'pengguna_id', as: 'pengguna' });

module.exports = {
    sequelize,
    Periode,
    Pengguna,
    Divisi,
    JenisRapat,
    Rapat,
    Kehadiran,
    TransferAdmin,
    JadwalPiket,
    KehadiranPiket,
    QRPiket,
    Kegiatan,
    KehadiranKegiatan,
    OfTheMonth,
    BuktiPiket
};
