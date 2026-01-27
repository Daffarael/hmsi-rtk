const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JenisRapat = sequelize.define('JenisRapat', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nama: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    deskripsi: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'jenis_rapat',
    timestamps: true
});

module.exports = JenisRapat;
