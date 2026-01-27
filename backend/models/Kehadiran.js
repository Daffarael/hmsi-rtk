const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Kehadiran = sequelize.define('Kehadiran', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    rapat_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'rapat',
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
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    tableName: 'kehadiran',
    timestamps: true,
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['rapat_id', 'pengguna_id'],
            name: 'unique_kehadiran_per_rapat'
        }
    ]
});

module.exports = Kehadiran;
