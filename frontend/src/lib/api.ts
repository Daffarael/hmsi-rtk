import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface ApiResponse<T = any> {
    sukses: boolean;
    pesan?: string;
    data?: T;
    token?: string;
    perlu_transfer?: boolean;
}

class ApiClient {
    private getToken(): string | undefined {
        return Cookies.get('token');
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
        const token = this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.pesan || 'Terjadi kesalahan');
            }

            return data;
        } catch (error: any) {
            if (error.message === 'Failed to fetch') {
                throw new Error('Tidak dapat terhubung ke server');
            }
            throw error;
        }
    }

    // Auth
    async masuk(username: string, kata_sandi: string) {
        return this.request('/autentikasi/masuk', {
            method: 'POST',
            body: JSON.stringify({ username, kata_sandi }),
        });
    }

    async keluar() {
        return this.request('/autentikasi/keluar', { method: 'POST' });
    }

    async saya() {
        return this.request('/autentikasi/saya');
    }

    async akhiriJabatan(konfirmasi_teks: string) {
        return this.request('/autentikasi/akhiri-jabatan', {
            method: 'POST',
            body: JSON.stringify({ konfirmasi_teks }),
        });
    }

    async buatKodeTransfer(kode_transfer: string) {
        return this.request('/autentikasi/transfer/buat-kode', {
            method: 'POST',
            body: JSON.stringify({ kode_transfer }),
        });
    }

    async daftarAdminBaru(kode_transfer: string, kata_sandi_baru: string) {
        return this.request('/autentikasi/transfer/daftar', {
            method: 'POST',
            body: JSON.stringify({ kode_transfer, kata_sandi_baru }),
        });
    }

    // Pengguna
    async semuaPengguna(params?: { divisi_id?: string; cari?: string }) {
        const query = new URLSearchParams(params as any).toString();
        return this.request(`/pengguna${query ? `?${query}` : ''}`);
    }

    async penggunaById(id: number) {
        return this.request(`/pengguna/${id}`);
    }

    async buatPengguna(data: any) {
        return this.request('/pengguna', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updatePengguna(id: number, data: any) {
        return this.request(`/pengguna/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async hapusPengguna(id: number) {
        return this.request(`/pengguna/${id}`, { method: 'DELETE' });
    }

    async resetPassword(id: number) {
        return this.request(`/pengguna/${id}/reset-password`, { method: 'POST' });
    }

    // Divisi
    async semuaDivisi() {
        return this.request('/divisi');
    }

    async buatDivisi(data: any) {
        return this.request('/divisi', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateDivisi(id: number, data: any) {
        return this.request(`/divisi/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async hapusDivisi(id: number) {
        return this.request(`/divisi/${id}`, { method: 'DELETE' });
    }

    // Jenis Rapat
    async semuaJenisRapat() {
        return this.request('/jenis-rapat');
    }

    async buatJenisRapat(data: any) {
        return this.request('/jenis-rapat', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateJenisRapat(id: number, data: any) {
        return this.request(`/jenis-rapat/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async hapusJenisRapat(id: number) {
        return this.request(`/jenis-rapat/${id}`, { method: 'DELETE' });
    }

    // Rapat
    async semuaRapat(params?: any) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/rapat${query ? `?${query}` : ''}`);
    }

    async rapatById(id: number) {
        return this.request(`/rapat/${id}`);
    }

    async buatRapat(data: any) {
        return this.request('/rapat', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateRapat(id: number, data: any) {
        return this.request(`/rapat/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async hapusRapat(id: number) {
        return this.request(`/rapat/${id}`, { method: 'DELETE' });
    }

    async publikasiQR(id: number, durasi_menit?: number) {
        return this.request(`/rapat/${id}/publikasi`, {
            method: 'POST',
            body: JSON.stringify({ durasi_menit }),
        });
    }

    async batalkanPublikasi(id: number) {
        return this.request(`/rapat/${id}/batalkan-publikasi`, { method: 'POST' });
    }

    async rapatAktif() {
        return this.request('/rapat-aktif');
    }

    // Kehadiran
    async scanQR(kode_qr: string) {
        return this.request('/kehadiran/scan', {
            method: 'POST',
            body: JSON.stringify({ kode_qr }),
        });
    }

    async kehadiranPerRapat(rapatId: number) {
        return this.request(`/kehadiran/rapat/${rapatId}`);
    }

    async riwayatSaya() {
        return this.request('/kehadiran/riwayat-saya');
    }


    async statistikAnggota() {
        return this.request('/kehadiran/statistik');
    }

    // Pengingat (User reminders)
    async getPengingat() {
        return this.request('/pengingat');
    }

    // Ekspor
    eksporExcelUrl(rapatId: number): string {
        return `${API_URL}/ekspor/rapat/${rapatId}/excel`;
    }

    eksporPdfUrl(rapatId: number): string {
        return `${API_URL}/ekspor/rapat/${rapatId}/pdf`;
    }

    // ==================== PIKET ====================

    // Admin: Get jadwal piket (grouped by day or filtered by day)
    async getJadwalPiket(hari?: string) {
        const query = hari ? `?hari=${hari}` : '';
        return this.request(`/piket/jadwal${query}`);
    }

    // Admin: Set jadwal piket (assign member to day)
    async setJadwalPiket(pengguna_id: number, hari: string) {
        return this.request('/piket/jadwal', {
            method: 'POST',
            body: JSON.stringify({ pengguna_id, hari }),
        });
    }

    // Admin: Hapus jadwal piket
    async hapusJadwalPiket(id: number) {
        return this.request(`/piket/jadwal/${id}`, { method: 'DELETE' });
    }

    // Admin: Get kehadiran piket
    async getKehadiranPiket(bulan?: number, tahun?: number) {
        const params = new URLSearchParams();
        if (bulan) params.append('bulan', bulan.toString());
        if (tahun) params.append('tahun', tahun.toString());
        const query = params.toString();
        return this.request(`/piket/kehadiran${query ? `?${query}` : ''}`);
    }

    // Admin: Toggle kehadiran piket
    async toggleKehadiranPiket(jadwal_id: number, tanggal: string, hadir: boolean) {
        return this.request('/piket/kehadiran/toggle', {
            method: 'POST',
            body: JSON.stringify({ jadwal_id, tanggal, hadir }),
        });
    }

    // Admin: Get/Generate QR piket
    async getQRPiket() {
        return this.request('/piket/qr');
    }

    // Admin: Get anggota tersedia (belum dijadwalkan di hari tertentu)
    async anggotaTersedia(hari?: string) {
        const query = hari ? `?hari=${hari}` : '';
        return this.request(`/piket/anggota-tersedia${query}`);
    }

    // Anggota: Scan piket QR
    async scanPiket(kode_qr: string) {
        return this.request<{ kehadiran_piket_id?: number; hari?: string }>('/piket/scan', {
            method: 'POST',
            body: JSON.stringify({ kode_qr }),
        });
    }

    // Anggota: Get jadwal saya
    async jadwalSaya() {
        return this.request('/piket/jadwal-saya');
    }

    // Anggota: Upload bukti piket (uses FormData, no JSON content-type)
    async uploadBuktiPiket(kehadiranPiketId: number, files: File[], tipeList: string[]) {
        const token = this.getToken();
        const formData = new FormData();
        files.forEach((file, i) => {
            formData.append('foto', file);
            formData.append('tipe', tipeList[i]);
        });

        const response = await fetch(`${API_URL}/piket/bukti/${kehadiranPiketId}`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.pesan || 'Gagal mengupload bukti piket');
        }
        return data;
    }

    // Get bukti piket
    async getBuktiPiket(kehadiranPiketId: number) {
        return this.request(`/piket/bukti/${kehadiranPiketId}`);
    }

    // ==================== KEGIATAN ====================

    // Admin: Get semua kegiatan
    async semuaKegiatan() {
        return this.request('/kegiatan');
    }

    // Admin: Get detail kegiatan
    async detailKegiatan(id: number) {
        return this.request(`/kegiatan/${id}`);
    }

    // Admin: Buat kegiatan
    async buatKegiatan(data: { nama: string; deskripsi?: string; tanggal_kegiatan: string; waktu_kegiatan?: string; lokasi?: string }) {
        return this.request('/kegiatan', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Admin: Edit kegiatan
    async editKegiatan(id: number, data: Partial<{ nama: string; deskripsi: string; tanggal_kegiatan: string; waktu_kegiatan: string; lokasi: string }>) {
        return this.request(`/kegiatan/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    // Admin: Hapus kegiatan
    async hapusKegiatan(id: number) {
        return this.request(`/kegiatan/${id}`, { method: 'DELETE' });
    }

    // Admin: Publikasikan kegiatan
    async publikasikanKegiatan(id: number, kadaluarsa_menit?: number) {
        return this.request(`/kegiatan/${id}/publikasi`, {
            method: 'POST',
            body: JSON.stringify({ kadaluarsa_menit }),
        });
    }

    // Admin: Batalkan publikasi kegiatan
    async batalkanPublikasiKegiatan(id: number) {
        return this.request(`/kegiatan/${id}/batalkan-publikasi`, { method: 'POST' });
    }

    // Admin: Get kehadiran kegiatan
    async kehadiranKegiatan(id: number) {
        return this.request(`/kehadiran-kegiatan/${id}`);
    }

    // Anggota: Get kegiatan aktif
    async kegiatanAktif() {
        return this.request('/kegiatan-aktif');
    }

    // Anggota: Scan kegiatan
    async scanKegiatan(kode_qr: string) {
        return this.request('/kehadiran-kegiatan/scan', {
            method: 'POST',
            body: JSON.stringify({ kode_qr }),
        });
    }

    // ==================== LEADERBOARD ====================

    // Admin: Get leaderboard
    async getLeaderboard(bulan?: number, tahun?: number, tipe?: 'presidium' | 'staff') {
        const params = new URLSearchParams();
        if (bulan) params.append('bulan', bulan.toString());
        if (tahun) params.append('tahun', tahun.toString());
        if (tipe) params.append('tipe', tipe);
        const query = params.toString();
        return this.request(`/leaderboard${query ? `?${query}` : ''}`);
    }

    // Admin: Get rekomendasi Of the Month
    async getRekomendasi(bulan?: number, tahun?: number) {
        const params = new URLSearchParams();
        if (bulan) params.append('bulan', bulan.toString());
        if (tahun) params.append('tahun', tahun.toString());
        const query = params.toString();
        return this.request(`/leaderboard/rekomendasi${query ? `?${query}` : ''}`);
    }

    // Admin: Pilih Of the Month
    async pilihOfTheMonth(bulan: number, tahun: number, tipe: 'presidium' | 'staff', pengguna_id: number, catatan?: string) {
        return this.request('/leaderboard/pilih', {
            method: 'POST',
            body: JSON.stringify({ bulan, tahun, tipe, pengguna_id, catatan }),
        });
    }

    // Admin: Get history Of the Month
    async getHistoryOtm() {
        return this.request('/leaderboard/history');
    }
}

export const api = new ApiClient();
export default api;
