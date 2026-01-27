const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OfTheMonth = sequelize.define('OfTheMonth', {
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
    bulan: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 12
        }
    },
    tahun: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    tipe: {
        type: DataTypes.ENUM('presidium', 'staff'),
        allowNull: false
    },
    pengguna_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pengguna',
            key: 'id'
        }
    },
    skor: {
        type: DataTypes.FLOAT,
        allowNull: true,
        comment: 'Skor kehadiran saat dipilih'
    },
    catatan: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'of_the_month',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['periode_id', 'bulan', 'tahun', 'tipe'],
            name: 'unique_otm_per_bulan_tipe'
        }
    ]
});

module.exports = OfTheMonth;
