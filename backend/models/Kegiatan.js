const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kegiatan = sequelize.define('Kegiatan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    periode_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'periode',
            key: 'id'
        }
    },
    nama: {
        type: DataTypes.STRING(200),
        allowNull: false
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    tanggal_kegiatan: {
        type: DataTypes.DATE,
        allowNull: false
    },
    waktu_kegiatan: {
        type: DataTypes.TIME,
        allowNull: true
    },
    lokasi: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    kode_qr: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    dipublikasikan: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    dipublikasikan_pada: {
        type: DataTypes.DATE,
        allowNull: true
    },
    kadaluarsa_pada: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Waktu batas scan QR'
    }
}, {
    tableName: 'kegiatan',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada'
});

module.exports = Kegiatan;
