const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BuktiPiket = sequelize.define('BuktiPiket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    kehadiran_piket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'kehadiran_piket',
            key: 'id'
        }
    },
    tipe: {
        type: DataTypes.ENUM('selfie', 'sekre_sebelum', 'sekre_sesudah'),
        allowNull: false
    },
    file_path: {
        type: DataTypes.STRING(500),
        allowNull: false
    }
}, {
    tableName: 'bukti_piket',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: false
});

module.exports = BuktiPiket;
