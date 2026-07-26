# HMSI-RTK — Sistem Absensi QR

Sistem manajemen kehadiran berbasis QR Code untuk **Himpunan Mahasiswa Sistem Informasi (HMSI) Universitas Andalas**. Mencakup absensi rapat, piket, kegiatan, serta fitur leaderboard dan laporan.

---

## 🗂️ Struktur Project

```
HMSI-RTK/
├── backend/          # REST API (Express.js + Sequelize + MySQL)
├── frontend/         # Web App (Next.js 14 + TypeScript)
├── render.yaml       # Konfigurasi deployment Render (backend)
└── .nvmrc            # Node.js version (20.18.0)
```

---

## ⚙️ Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 14, TypeScript, Framer Motion |
| Backend | Express.js, Sequelize ORM |
| Database | MySQL (Laragon lokal / Aiven production) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Deploy Backend | [Render](https://render.com) |
| Deploy Frontend | [Vercel](https://vercel.com) |

---

## 🚀 Setup Development Lokal

### Prasyarat
- Node.js `v20.18.0` (gunakan `.nvmrc` atau `nvm use`)
- MySQL aktif (Laragon / XAMPP / native)
- Database `hmsi_absensi` sudah dibuat

### 1. Clone Repository

```bash
git clone <repo-url>
cd HMSI-RTK
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Buat file `.env` di folder `backend/`:

```env
# Database MySQL
DB_HOST=localhost
DB_PORT=3306
DB_NAME=hmsi_absensi
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000
```

Jalankan seeder data awal (opsional):

```bash
npm run seed
```

Jalankan backend:

```bash
npm run dev
```

Backend berjalan di: `http://localhost:5000`

### 3. Setup Frontend

```bash
cd frontend
npm install
```

Buat file `.env.local` di folder `frontend/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

Jalankan frontend:

```bash
npm run dev
```

Frontend berjalan di: `http://localhost:3000`

---

## 🌐 Deployment

### Backend → Render

1. Connect repository ke [Render](https://render.com)
2. Render otomatis membaca `render.yaml` di root repository
3. Set environment variables di dashboard Render:
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` → dari Aiven MySQL
   - `JWT_SECRET` → string acak yang panjang dan aman
   - `FRONTEND_URL` → URL Vercel frontend kamu

### Frontend → Vercel

1. Connect repository ke [Vercel](https://vercel.com)
2. Set **Root Directory** ke `frontend`
3. Set environment variable di dashboard Vercel:
   - `NEXT_PUBLIC_API_URL` → URL backend Render kamu (contoh: `https://hmsi-rtk-backend.onrender.com/api`)

---

## 📋 Scripts

### Backend

| Command | Keterangan |
|---|---|
| `npm run dev` | Jalankan development server (nodemon) |
| `npm start` | Jalankan production server |
| `npm run seed` | Isi data awal ke database |

### Frontend

| Command | Keterangan |
|---|---|
| `npm run dev` | Jalankan development server |
| `npm run build` | Build untuk production |
| `npm start` | Jalankan production server |
| `npm run lint` | Cek linting |

---

## 👥 Tim

**HMSI Universitas Andalas**
