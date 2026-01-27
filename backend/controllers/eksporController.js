const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { Rapat, Kehadiran, Pengguna, JenisRapat } = require('../models');

// Export kehadiran rapat ke Excel
exports.eksporRapatExcel = async (req, res) => {
    try {
        const rapat = await Rapat.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id
            },
            include: [{ model: JenisRapat, as: 'jenis_rapat' }]
        });

        if (!rapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Rapat tidak ditemukan'
            });
        }

        const kehadiran = await Kehadiran.findAll({
            where: { rapat_id: rapat.id },
            include: [{
                model: Pengguna,
                as: 'pengguna',
                attributes: ['nama_lengkap', 'nim', 'angkatan', 'nomor_telepon']
            }],
            order: [['waktu_scan', 'ASC']]
        });

        // Buat workbook Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Kehadiran');

        // Header info rapat
        worksheet.mergeCells('A1:E1');
        worksheet.getCell('A1').value = `Daftar Hadir: ${rapat.nama}`;
        worksheet.getCell('A1').font = { bold: true, size: 14 };

        worksheet.mergeCells('A2:E2');
        worksheet.getCell('A2').value = `Tanggal: ${rapat.tanggal_rapat} | Lokasi: ${rapat.lokasi || '-'}`;

        worksheet.mergeCells('A3:E3');
        worksheet.getCell('A3').value = `Jenis Rapat: ${rapat.jenis_rapat?.nama || '-'}`;

        // Header tabel
        worksheet.addRow([]);
        worksheet.addRow(['No', 'Nama Lengkap', 'NIM', 'Angkatan', 'Waktu Scan']);

        const headerRow = worksheet.getRow(5);
        headerRow.font = { bold: true };
        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE5E7EB' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Data kehadiran
        kehadiran.forEach((k, index) => {
            const row = worksheet.addRow([
                index + 1,
                k.pengguna?.nama_lengkap || '-',
                k.pengguna?.nim || '-',
                k.pengguna?.angkatan || '-',
                new Date(k.waktu_scan).toLocaleString('id-ID')
            ]);

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
            });
        });

        // Set column widths
        worksheet.columns = [
            { width: 5 },
            { width: 30 },
            { width: 15 },
            { width: 12 },
            { width: 25 }
        ];

        // Total
        worksheet.addRow([]);
        worksheet.addRow(['', `Total Hadir: ${kehadiran.length} orang`, '', '', '']);

        // Set response headers
        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=kehadiran-${rapat.nama.replace(/\s+/g, '-')}.xlsx`
        );

        // Write to response
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error ekspor excel:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};

// Export kehadiran rapat ke PDF
exports.eksporRapatPDF = async (req, res) => {
    try {
        const rapat = await Rapat.findOne({
            where: {
                id: req.params.id,
                periode_id: req.pengguna.periode_id
            },
            include: [{ model: JenisRapat, as: 'jenis_rapat' }]
        });

        if (!rapat) {
            return res.status(404).json({
                sukses: false,
                pesan: 'Rapat tidak ditemukan'
            });
        }

        const kehadiran = await Kehadiran.findAll({
            where: { rapat_id: rapat.id },
            include: [{
                model: Pengguna,
                as: 'pengguna',
                attributes: ['nama_lengkap', 'nim', 'angkatan']
            }],
            order: [['waktu_scan', 'ASC']]
        });

        // Buat PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=kehadiran-${rapat.nama.replace(/\s+/g, '-')}.pdf`
        );

        doc.pipe(res);

        // Header
        doc.fontSize(18).font('Helvetica-Bold').text('DAFTAR HADIR RAPAT', { align: 'center' });
        doc.fontSize(14).font('Helvetica-Bold').text('HMSI UNIVERSITAS ANDALAS', { align: 'center' });
        doc.moveDown();

        // Info Rapat
        doc.fontSize(11).font('Helvetica');
        doc.text(`Nama Rapat: ${rapat.nama}`);
        doc.text(`Jenis Rapat: ${rapat.jenis_rapat?.nama || '-'}`);
        doc.text(`Tanggal: ${rapat.tanggal_rapat}`);
        doc.text(`Waktu: ${rapat.waktu_rapat || '-'}`);
        doc.text(`Lokasi: ${rapat.lokasi || '-'}`);
        doc.moveDown();

        // Tabel header
        const tableTop = doc.y;
        const tableLeft = 50;

        doc.font('Helvetica-Bold');
        doc.text('No', tableLeft, tableTop, { width: 30 });
        doc.text('Nama Lengkap', tableLeft + 30, tableTop, { width: 180 });
        doc.text('NIM', tableLeft + 210, tableTop, { width: 100 });
        doc.text('Angkatan', tableLeft + 310, tableTop, { width: 60 });
        doc.text('Waktu Scan', tableLeft + 370, tableTop, { width: 120 });

        doc.moveTo(tableLeft, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Data
        doc.font('Helvetica');
        let y = tableTop + 25;

        kehadiran.forEach((k, index) => {
            if (y > 700) {
                doc.addPage();
                y = 50;
            }

            doc.text(String(index + 1), tableLeft, y, { width: 30 });
            doc.text(k.pengguna?.nama_lengkap || '-', tableLeft + 30, y, { width: 180 });
            doc.text(k.pengguna?.nim || '-', tableLeft + 210, y, { width: 100 });
            doc.text(String(k.pengguna?.angkatan || '-'), tableLeft + 310, y, { width: 60 });
            doc.text(new Date(k.waktu_scan).toLocaleString('id-ID'), tableLeft + 370, y, { width: 120 });

            y += 20;
        });

        // Total
        doc.moveDown(2);
        doc.font('Helvetica-Bold').text(`Total Hadir: ${kehadiran.length} orang`);

        doc.end();

    } catch (error) {
        console.error('Error ekspor PDF:', error);
        res.status(500).json({
            sukses: false,
            pesan: 'Terjadi kesalahan server'
        });
    }
};
