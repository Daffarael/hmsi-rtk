const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransferAdmin = sequelize.define('TransferAdmin', {
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
    admin_lama_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'pengguna',
            key: 'id'
        }
    },
    kode_transfer: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    sudah_digunakan: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    digunakan_pada: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'transfer_admin',
    timestamps: true,
    updatedAt: false
});

module.exports = TransferAdmin;
