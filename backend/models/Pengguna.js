const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Pengguna = sequelize.define('Pengguna', {
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
    divisi_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'divisi',
            key: 'id'
        }
    },
    nama_lengkap: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    nama_panggilan: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    nim: {
        type: DataTypes.STRING(20),
        allowNull: false
    },
    nomor_telepon: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    kata_sandi: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    angkatan: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    peran: {
        type: DataTypes.ENUM('admin', 'anggota'),
        defaultValue: 'anggota'
    },
    tipe_anggota: {
        type: DataTypes.ENUM('presidium', 'staff'),
        defaultValue: 'staff'
    },
    aktif: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: 'pengguna',
    timestamps: true,
    hooks: {
        beforeCreate: async (pengguna) => {
            if (pengguna.kata_sandi) {
                pengguna.kata_sandi = await bcrypt.hash(pengguna.kata_sandi, 10);
            }
        },
        beforeUpdate: async (pengguna) => {
            if (pengguna.changed('kata_sandi')) {
                pengguna.kata_sandi = await bcrypt.hash(pengguna.kata_sandi, 10);
            }
        }
    }
});

// Method untuk verifikasi password
Pengguna.prototype.verifikasiKataSandi = async function (kataSandi) {
    return await bcrypt.compare(kataSandi, this.kata_sandi);
};

module.exports = Pengguna;
