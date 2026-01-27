const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JadwalPiket = sequelize.define('JadwalPiket', {
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
    pengguna_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pengguna',
            key: 'id'
        }
    },
    hari: {
        type: DataTypes.ENUM('senin', 'selasa', 'rabu', 'kamis', 'jumat'),
        allowNull: false
    },
    aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'jadwal_piket',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: 'diperbarui_pada',
    indexes: [
        {
            unique: true,
            fields: ['periode_id', 'pengguna_id', 'hari'],
            name: 'unique_jadwal_piket'
        }
    ]
});

module.exports = JadwalPiket;
