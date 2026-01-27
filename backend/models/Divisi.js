const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Divisi = sequelize.define('Divisi', {
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
    tableName: 'divisi',
    timestamps: true
});

module.exports = Divisi;
