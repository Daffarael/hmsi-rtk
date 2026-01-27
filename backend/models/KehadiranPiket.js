const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const KehadiranPiket = sequelize.define('KehadiranPiket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    jadwal_piket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'jadwal_piket',
            key: 'id'
        }
    },
    tanggal: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    waktu_scan: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'kehadiran_piket',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['jadwal_piket_id', 'tanggal'],
            name: 'unique_kehadiran_piket'
        }
    ]
});

module.exports = KehadiranPiket;
