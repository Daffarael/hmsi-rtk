import re

with open('frontend/src/app/anggota/scan/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add states
states_hook = r"const \[piketStep, setPiketStep\] = useState<PiketStep>\('selfie'\);"
new_states = """const [piketStep, setPiketStep] = useState<PiketStep>('selfie');
    const [showGantiForm, setShowGantiForm] = useState(false);
    const [pendingQR, setPendingQR] = useState('');
    const [tanggalGanti, setTanggalGanti] = useState('');"""
content = re.sub(states_hook, new_states, content)

# Update reset logic
reset_logic = r"setPiketStep\('selfie'\);\n\s+setKehadiranPiketId\(null\);"
new_reset = """setPiketStep('selfie');
        setShowGantiForm(false);
        setPendingQR('');
        setTanggalGanti('');
        setKehadiranPiketId(null);"""
content = re.sub(reset_logic, new_reset, content)

# Update scanPiket call
scan_call = r"""const response = await api\.scanPiket\(decodedText\);\n.*?if \(response\.sukses && response\.data\?\.kehadiran_piket_id\) \{"""
new_scan_call = """const response = await api.scanPiket(decodedText);
                            
                            if (response.sukses && response.data?.perlu_tanggal_ganti) {
                                setShowGantiForm(true);
                                setPendingQR(decodedText);
                                setIsProcessing(false);
                                return;
                            }
                            
                            setResult({
                                sukses: response.sukses,
                                pesan: response.pesan,
                                data: response.data as ScanResult['data'],
                            });
                            if (response.sukses && response.data?.kehadiran_piket_id) {"""
content = re.sub(scan_call, new_scan_call, content, flags=re.DOTALL)

# Add submitGanti logic
submit_logic = """
    const handleSubmitGanti = async () => {
        if (!tanggalGanti) return;
        setIsProcessing(true);
        setShowGantiForm(false);
        try {
            const response = await api.scanPiket(pendingQR, tanggalGanti);
            setResult({
                sukses: response.sukses,
                pesan: response.pesan,
                data: response.data as ScanResult['data'],
            });
            if (response.sukses && response.data?.kehadiran_piket_id) {
                setKehadiranPiketId(response.data.kehadiran_piket_id);
                setPiketMode(true);
                const mode = response.data.mode as 'checkin' | 'checkout';
                setPiketFlowMode(mode || 'checkin');
                setPiketStep(mode === 'checkout' ? 'selfie_keluar' : 'selfie');
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan saat memproses absen piket ganti');
        } finally {
            setIsProcessing(false);
        }
    };
"""
# Insert before renderPiketFlow
content = content.replace("    const renderPiketFlow = () => {", submit_logic + "\n    const renderPiketFlow = () => {")

# Add JSX for Ganti Form
ganti_jsx = """
                {showGantiForm && (
                    <div className={styles.gantiForm}>
                        <h3>Ganti Jadwal Piket</h3>
                        <p>Pilih tanggal jadwal piket asli Anda yang ingin diganti ke hari ini:</p>
                        <input 
                            type="date" 
                            className="input-field" 
                            value={tanggalGanti}
                            onChange={(e) => setTanggalGanti(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button 
                                className="btn btn-secondary" 
                                onClick={() => {
                                    setShowGantiForm(false);
                                    startScanning();
                                }}
                            >
                                Batal
                            </button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleSubmitGanti}
                                disabled={!tanggalGanti || isProcessing}
                            >
                                Lanjut
                            </button>
                        </div>
                    </div>
                )}
"""

# Insert after <div className={styles.scannerWrapper}> {error && ...} {isProcessing && ...}
scanner_overlay = r"(\{\!isProcessing && \!result && \!piketMode && \(.*?</AnimatePresence>)"
# wait, it's safer to put it above result render
result_render = r"\{result && \!piketMode && \("
content = content.replace("{result && !piketMode && (", ganti_jsx + "\n                {result && !piketMode && !showGantiForm && (")

# Update !piketMode condition to !piketMode && !showGantiForm
content = content.replace("{!isProcessing && !result && !piketMode && (", "{!isProcessing && !result && !piketMode && !showGantiForm && (")

with open('frontend/src/app/anggota/scan/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Patch successful!")
