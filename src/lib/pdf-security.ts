import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type { SecurityReport, SecurityLog } from './types';
import { collection, query, where, getDocs, Firestore, orderBy } from 'firebase/firestore';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => void;
  lastAutoTable: { finalY: number };
}

export const getBase64FromUrl = async (url: string): Promise<string> => {
  if (!url) return '';
  try {
    const data = await fetch(url);
    const blob = await data.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
    });
  } catch (e) {
    console.error("Gagal convert image to base64", e);
    return "";
  }
};

export const downloadSecurityReport = async (firestore: Firestore, report: SecurityReport) => {
  try {
    const logsRef = collection(firestore, 'security-logs');
    const q = query(
      logsRef,
      where('date', '==', report.date),
      where('shift', '==', report.shift)
    );
    
    const querySnapshot = await getDocs(q);
    const logs = querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as SecurityLog))
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    const docPdf = new jsPDF('landscape') as jsPDFWithAutoTable;
    
    docPdf.setLineWidth(0.1);
    docPdf.rect(14, 10, 269, 25);

    docPdf.setFontSize(9);
    docPdf.text('FUNGSI  : HSSE REGION PAPUA MALUKU - DIREKTORAT PEMASARAN REGIONAL', 16, 16);
    docPdf.text('JUDUL    : LAPORAN HARIAN SECURITY', 16, 24);

    try {
      const logoBase64 = await getBase64FromUrl('/logo-pertamina.png');
      if (logoBase64) {
        docPdf.addImage(logoBase64, 'PNG', 230, 10, 40, 20);
      }
    } catch (e) {
      console.warn('Gagal memuat logo', e);
      docPdf.setFont('helvetica', 'bold');
      docPdf.setTextColor(0, 118, 169);
      docPdf.text('PERTAMINA', 245, 18);
      docPdf.setFontSize(7);
      docPdf.text('PATRA NIAGA', 245, 22);
    }
    docPdf.setTextColor(0, 0, 0);

    const tableData = await Promise.all((logs || []).map(async (l, idx) => {
      const firstPhotoUrl = (l.photos && l.photos[0]) || l.photo;
      const photoBase64 = firstPhotoUrl ? await getBase64FromUrl(firstPhotoUrl) : '';
      const dayName = format(new Date(l.date + 'T00:00:00'), 'eeee', { locale: idLocale });
      const formattedWaktu = `${dayName}, ${format(new Date(l.date), 'dd/MM/yyyy')}\n${l.shift || '-'} (${l.time} WIT)`;

      return [
        (idx + 1).toString().padStart(2, '0') + '.',
        formattedWaktu,
        l.activity,
        l.location || '-',
        l.officer,
        { content: '', image: photoBase64, width: 35 },
        l.details ? l.details.replace(/\*\*/g, '') : ''
      ];
    }));

    docPdf.autoTable({
      head: [['NO', 'WAKTU', 'KEGIATAN', 'LOKASI', 'PETUGAS', 'FOTO', 'KETERANGAN']],
      body: tableData,
      startY: 40,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        valign: 'middle',
        halign: 'left',
        minCellHeight: 25,
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.2
      },
      headStyles: {
        fillColor: [255, 218, 185],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 35 },
        5: { cellWidth: 40 },
        6: { cellWidth: 60 }
      },
      didDrawCell: (data: any) => {
        if (data.column.index === 5 && data.cell.raw && typeof data.cell.raw === 'object' && data.cell.raw.image) {
          const imgData = data.cell.raw.image;
          if (imgData) {
            try {
              docPdf.addImage(imgData, 'JPEG', data.cell.x + 2, data.cell.y + 2, 36, 21);
            } catch (e) {
              console.error("PDF Image Error:", e);
            }
          }
        }
      }
    });

    let finalY = docPdf.lastAutoTable.finalY + 15;
    if (finalY + 45 > docPdf.internal.pageSize.height) {
      docPdf.addPage();
      finalY = 20;
    }
    docPdf.setFontSize(9);
    
    // 1. Security Penyerah
    docPdf.text('Security Shift Berakhir,', 20, finalY);
    if (report.penyerahSignature) {
      try { docPdf.addImage(report.penyerahSignature, 'PNG', 20, finalY + 8, 40, 20); } catch (e) {}
    }
    docPdf.text(report.penyerahName || '( .......................................... )', 20, finalY + 33);
    docPdf.line(20, finalY + 34, 60, finalY + 34);

    // 2. Security Penerima
    docPdf.text('Security Shift Berikutnya,', 85, finalY);
    if (report.penerimaSignature) {
      try { docPdf.addImage(report.penerimaSignature, 'PNG', 85, finalY + 8, 40, 20); } catch (e) {}
    }
    docPdf.text(report.penerimaName || '( .......................................... )', 85, finalY + 33);
    docPdf.line(85, finalY + 34, 125, finalY + 34);

    // 3. HSSE
    docPdf.text('Mengetahui,', 150, finalY);
    docPdf.text('HSSE', 150, finalY + 5);
    if (report.isSignedByHSSE && report.hsseSignature) {
      try { docPdf.addImage(report.hsseSignature, 'PNG', 150, finalY + 8, 40, 20); } catch (e) {}
    }
    docPdf.text(report.isSignedByHSSE && report.hsseName ? report.hsseName : '( .......................................... )', 150, finalY + 33);
    docPdf.line(150, finalY + 34, 190, finalY + 34);

    // 4. AFTM
    docPdf.text('Menyetujui,', 215, finalY);
    docPdf.text('AFTM (Aviation Fuel Terminal Manager)', 215, finalY + 5);
    if (report.isSignedByAFTM && report.aftmSignature) {
      try { docPdf.addImage(report.aftmSignature, 'PNG', 215, finalY + 8, 40, 20); } catch (e) {}
    }
    docPdf.text(report.isSignedByAFTM && report.aftmName ? report.aftmName : '( .......................................... )', 215, finalY + 33);
    docPdf.line(215, finalY + 34, 275, finalY + 34);

    docPdf.save(`Laporan_Security_${report.date}_${report.shift}.pdf`);
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw error;
  }
};
