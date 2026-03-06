require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./models');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'piket');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Server HMSI Absensi berjalan dengan baik' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        sukses: false,
        pesan: 'Terjadi kesalahan internal server'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        sukses: false,
        pesan: 'Endpoint tidak ditemukan'
    });
});

// Start server
const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('✅ Koneksi database berhasil');

        // Sync database (create tables if not exist)
        await sequelize.sync({ alter: false });
        console.log('✅ Sinkronisasi database berhasil');

        app.listen(PORT, () => {
            console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
            console.log(`📝 API tersedia di http://localhost:${PORT}/api`);
        });

    } catch (error) {
        console.error('❌ Gagal memulai server:', error);
        process.exit(1);
    }
};

startServer();
