const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rapat = sequelize.define('Rapat', {
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
    jenis_rapat_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'jenis_rapat',
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
    tanggal_rapat: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    waktu_rapat: {
        type: DataTypes.TIME,
        allowNull: true
    },
    lokasi: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Deskripsi lokasi dalam bentuk teks'
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
        allowNull: true
    }
}, {
    tableName: 'rapat',
    timestamps: true
});

module.exports = Rapat;
