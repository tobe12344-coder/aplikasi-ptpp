'use client';

import { PDFDownloadLink } from '@react-pdf/renderer';
import DamageReportPDF from './DamageReportPDF';
import type { DamageReport } from '@/lib/types';

export default function PDFDownloadButton({ report }: { report: DamageReport }) {
  // Buat nama file yang aman (hapus karakter aneh)
  const safeLaporan = report.noLaporan ? report.noLaporan.replace(/[^a-zA-Z0-9-]/g, '_') : 'Laporan';
  const fileName = `PTPP_${safeLaporan}.pdf`;

  return (
    <PDFDownloadLink
      document={<DamageReportPDF report={report} />}
      fileName={fileName}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
    >
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
      {({ blob, url, loading, error }) =>
        loading ? 'Menyiapkan PDF...' : 'Download PDF'
      }
    </PDFDownloadLink>
  );
}
