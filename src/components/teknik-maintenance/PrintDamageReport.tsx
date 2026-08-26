'use client';

import dynamic from 'next/dynamic';
import type { DamageReport } from '@/lib/types';

// Dynamic import with ssr: false to prevent Next.js from rendering react-pdf on the server
const PDFPreviewWrapper = dynamic(() => import('./PDFPreviewWrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-600 font-medium">Memuat PDF Viewer...</p>
      </div>
    </div>
  ),
});

const PDFDownloadButton = dynamic(() => import('./PDFDownloadButton'), {
  ssr: false,
  loading: () => (
    <button disabled className="px-4 py-2 bg-slate-300 text-slate-500 rounded-md text-sm font-medium">
      Memuat tombol...
    </button>
  ),
});

interface PrintDamageReportProps {
  report: DamageReport;
  onClose: () => void;
  shouldPrint: boolean;
}

export default function PrintDamageReport({ report, onClose, shouldPrint }: PrintDamageReportProps) {
  if (!shouldPrint) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/90 z-[9999] flex flex-col">
      {/* Top Bar */}
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Preview PTPP (Versi Vektor): {report.noLaporan}</h2>
          <p className="text-sm text-slate-500">Gunakan tombol di sebelah kanan untuk mendownload PDF.</p>
        </div>
        <div className="flex gap-3">
          <PDFDownloadButton report={report} />
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-100 text-sm font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* React-PDF Viewer */}
      <div className="flex-1 w-full h-full overflow-hidden bg-slate-200">
        <PDFPreviewWrapper report={report} />
      </div>
    </div>
  );
}