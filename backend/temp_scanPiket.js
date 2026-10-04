exports.scanPiket = async (req, res) => {
    try {
        const { kode_qr, tanggal_ganti } = req.body;
        const penggunaId = req.pengguna.id;

        if (!kode_qr) {
            return res.status(400).json({ sukses: false, pesan: 'Kode QR wajib diisi' });
        }

        let isGanti = false;
        let realKode = kode_qr;

        if (kode_qr.startsWith('GANTI-')) {
            isGanti = true;
            realKode = kode_qr.replace('GANTI-', '');
        }

        // Validasi QR
        const qrPiket = await QRPiket.findOne({
            where: { kode_qr: realKode },
            include: [{ model: Periode, as: 'periode' }]
        });

        if (!qrPiket) {
            return res.status(404).json({ sukses: false, pesan: 'QR tidak valid' });
        }

        if (!qrPiket.periode.aktif) {
            return res.status(400).json({ sukses: false, pesan: 'Periode sudah tidak aktif' });
        }

        // Cek hari ini
        const today = new Date();
        const hariIni = getNamaHari(today);
        const tanggalIni = formatLocalDate(today);

        // Cek apakah hari ini adalah hari kerja (senin-jumat)
        if (!['senin', 'selasa', 'rabu', 'kamis', 'jumat'].includes(hariIni)) {
            return res.status(400).json({ sukses: false, pesan: 'Hari ini bukan hari piket (Senin-Jumat)' });
        }

        let jadwalTargetHari = hariIni;
        
        // Jika mode ganti piket, cek apakah jadwal aslinya ada di hari yang dipilih
        if (isGanti) {
            if (!tanggal_ganti) {
                // Return flag to prompt frontend for tanggal_ganti
                return res.json({ sukses: true, data: { perlu_tanggal_ganti: true, pesan: 'Silakan pilih tanggal piket yang ingin diganti' } });
            }
            
            const dateGanti = new Date(tanggal_ganti);
            jadwalTargetHari = getNamaHari(dateGanti);
        }

        // Cek jadwal piket anggota berdasarkan hari
        const jadwalPiket = await JadwalPiket.findOne({
            where: {
                periode_id: qrPiket.periode_id,
                pengguna_id: penggunaId,
                hari: jadwalTargetHari,
                aktif: true
            }
        });

        if (!jadwalPiket) {
            if (isGanti) {
                return res.status(400).json({ sukses: false, pesan: `Anda tidak memiliki jadwal piket pada hari ${jadwalTargetHari.charAt(0).toUpperCase() + jadwalTargetHari.slice(1)} (Tanggal ${tanggal_ganti})` });
            }
            return res.status(400).json({
                sukses: false,
                pesan: `Hari ini bukan hari piket Anda. Jadwal piket Anda bukan hari ${hariIni.charAt(0).toUpperCase() + hariIni.slice(1)}.`
            });
        }

        // Cek apakah sudah scan hari ini (menggunakan tanggalIni = hari eksekusi)
        // Jika ganti piket, kita tetap catat kehadirannya untuk hari ini (real execution date), 
        // tapi jadwal_piket_id mengacu ke jadwal asli mereka
        const sudahScan = await KehadiranPiket.findOne({
            where: {
                jadwal_piket_id: jadwalPiket.id,
                tanggal: tanggalIni
            }
        });

        if (sudahScan) {
            if (sudahScan.waktu_selesai) {
                return res.status(400).json({ sukses: false, pesan: 'Anda sudah menyelesaikan piket secara penuh hari ini' });
            }

            // 1 Jam 15 Menit logic
            const SELISIH_MIN = 75 * 60 * 1000;
            const waktuMulai = new Date(sudahScan.waktu_scan);
            const durasiBerlalu = new Date() - waktuMulai;
            
            if (durasiBerlalu < SELISIH_MIN) {
                const sisaMenit = Math.ceil((SELISIH_MIN - durasiBerlalu) / 60000);
                return res.status(400).json({ 
                    sukses: false, 
                    pesan: `Anda baru bisa menyelesaikan piket (scan pulang) setelah 1 jam 15 menit dari waktu masuk. Sisa waktu: ${sisaMenit} menit.`
                });
            }

            return res.json({
                sukses: true,
                pesan: 'Melanjutkan piket, silakan upload bukti selesai.',
                data: {
                    kehadiran_piket_id: sudahScan.id,
                    hari: hariIni,
                    tanggal: tanggalIni,
                    waktu_scan: sudahScan.waktu_scan,
                    mode: 'checkout'
                }
            });
        }

        // Mulai Piket
        const kehadiran = await KehadiranPiket.create({
            jadwal_piket_id: jadwalPiket.id,
            tanggal: tanggalIni,
            waktu_scan: new Date()
        });

        res.json({
            sukses: true,
            pesan: isGanti ? 'Mulai piket (Pengganti) berhasil dicatat!' : 'Mulai piket berhasil dicatat! Silakan upload bukti awal.',
            data: {
                kehadiran_piket_id: kehadiran.id,
                hari: hariIni,
                tanggal: tanggalIni,
                waktu_scan: kehadiran.waktu_scan,
                mode: 'checkin'
            }
        });
    } catch (error) {
        console.error('Error scanPiket:', error);
        res.status(500).json({ sukses: false, pesan: 'Gagal mencatat absensi piket' });
    }
};
