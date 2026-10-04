import re

with open('frontend/src/app/admin/piket/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

qr_jsx = """                                <div className={styles.qrContainer}>
                                    <QRCodeSVG
                                        value={qrData.kode_qr}
                                        size={isFullscreen ? 400 : 250}
                                        bgColor="#ffffff"
                                        fgColor="#000000"
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <p className={styles.qrInfo}>"""

new_qr_jsx = """                                <div style={{ display: 'flex', flexDirection: isFullscreen ? 'row' : 'column', gap: '30px', alignItems: 'center', justifyContent: 'center' }}>
                                    <div>
                                        <h4 style={{ textAlign: 'center', marginBottom: '10px' }}>QR Piket Reguler</h4>
                                        <div className={styles.qrContainer}>
                                            <QRCodeSVG
                                                value={qrData.kode_qr}
                                                size={isFullscreen ? 300 : 200}
                                                bgColor="#ffffff"
                                                fgColor="#000000"
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h4 style={{ textAlign: 'center', marginBottom: '10px', color: '#f59e0b' }}>QR Ganti Piket</h4>
                                        <div className={styles.qrContainer}>
                                            <QRCodeSVG
                                                value={`GANTI-${qrData.kode_qr}`}
                                                size={isFullscreen ? 300 : 200}
                                                bgColor="#ffffff"
                                                fgColor="#000000"
                                                level="H"
                                                includeMargin={true}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <p className={styles.qrInfo}>"""

content = content.replace(qr_jsx, new_qr_jsx)

with open('frontend/src/app/admin/piket/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Admin UI Patched")
