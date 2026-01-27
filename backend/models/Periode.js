const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Periode = sequelize.define('Periode', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Format: 2025/2026'
    },
    tanggal_mulai: {
        type: DataTypes.DATE,
        allowNull: false
    },
    tanggal_selesai: {
        type: DataTypes.DATE,
        allowNull: false
    },
    aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'periode',
    timestamps: true
});

module.exports = Periode;
