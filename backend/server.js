require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { sequelize } = require('./models');
const routes = require('./routes');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy (Railway, Render, etc.)
app.set('trust proxy', 1);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads', 'piket');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : ['http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow all origins temporarily for mobile testing
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    // Tangani error multer
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                sukses: false,
                pesan: 'Ukuran foto terlalu besar. Maksimal 20MB per foto.'
            });
        }
        return res.status(400).json({
            sukses: false,
            pesan: `Gagal upload foto: ${err.message}`
        });
    }

    // Tangani error syntax JSON yang tidak valid
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            sukses: false,
            pesan: 'Format data JSON pada request tidak valid'
        });
    }

    console.error('Error:', err);
    res.status(err.status || 500).json({
        sukses: false,
        pesan: err.message || 'Terjadi kesalahan internal server'
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
