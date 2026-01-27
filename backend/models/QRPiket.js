const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const crypto = require('crypto');

const QRPiket = sequelize.define('QRPiket', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    periode_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'periode',
            key: 'id'
        }
    },
    kode_qr: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'qr_piket',
    timestamps: true,
    createdAt: 'dibuat_pada',
    updatedAt: false,
    hooks: {
        beforeCreate: (qrPiket) => {
            if (!qrPiket.kode_qr) {
                qrPiket.kode_qr = `PIKET-${crypto.randomBytes(16).toString('hex').toUpperCase()}`;
            }
        }
    }
});

module.exports = QRPiket;
