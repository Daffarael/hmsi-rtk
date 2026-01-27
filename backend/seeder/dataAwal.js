require('dotenv').config();
const { sequelize, Periode, Divisi, Pengguna } = require('../models');
const bcrypt = require('bcryptjs');

const seedData = async () => {
    try {
        // Sync database
        await sequelize.sync({ force: true });
        console.log('✅ Database direset dan tabel dibuat ulang');

        // 1. Buat Periode
        const tahunSekarang = new Date().getFullYear();
        const tahunDepan = tahunSekarang + 1;

        const periode = await Periode.create({
            nama: `${tahunSekarang - 1}/${tahunSekarang}`,
            tanggal_mulai: new Date(`${tahunSekarang - 1}-01-01`),
            tanggal_selesai: new Date(`${tahunSekarang}-12-31`),
            aktif: true
        });
        console.log(`✅ Periode "${periode.nama}" berhasil dibuat`);

        // 2. Buat Divisi
        const divisi = await Divisi.create({
            nama: 'Divisi Internal',
            deskripsi: 'Divisi Internal HMSI',
            aktif: true
        });
        console.log(`✅ Divisi "${divisi.nama}" berhasil dibuat`);

        // 3. Buat Admin
        const kodePeriode = `${(tahunSekarang - 1).toString().slice(-2)}${tahunSekarang.toString().slice(-2)}`;
        const usernameAdmin = `adminhmsi${kodePeriode}`;

        const admin = await Pengguna.create({
            periode_id: periode.id,
            divisi_id: null,
            nama_lengkap: 'Admin HMSI',
            nama_panggilan: 'admin',
            nim: 'admin',
            nomor_telepon: null,
            username: usernameAdmin,
            kata_sandi: 'HidupRTK2526',
            angkatan: null,
            peran: 'admin',
            aktif: true
        });
        console.log(`✅ Admin berhasil dibuat:`);
        console.log(`   Username: ${admin.username}`);
        console.log(`   Password: HidupRTK2526`);

        console.log('\n🎉 Seeder berhasil dijalankan!');
        console.log('================================');
        console.log(`Periode aktif: ${periode.nama}`);
        console.log(`Divisi: ${divisi.nama}`);
        console.log(`Admin: ${admin.username} / HidupRTK2526`);
        console.log('================================\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error saat menjalankan seeder:', error);
        process.exit(1);
    }
};

seedData();
