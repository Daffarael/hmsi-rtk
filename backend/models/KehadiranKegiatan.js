const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KehadiranKegiatan = sequelize.define('KehadiranKegiatan', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kegiatan_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kegiatan',
            key: 'id'
        }
    },
    pengguna_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pengguna',
            key: 'id'
        }
    },
    waktu_scan: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'kehadiran_kegiatan',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['kegiatan_id', 'pengguna_id'],
            name: 'unique_kehadiran_per_kegiatan'
        }
    ]
});

module.exports = KehadiranKegiatan;
