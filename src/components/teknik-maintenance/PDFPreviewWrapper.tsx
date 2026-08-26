'use client';

import { PDFViewer } from '@react-pdf/renderer';
import DamageReportPDF from './DamageReportPDF';
import type { DamageReport } from '@/lib/types';

export default function PDFPreviewWrapper({ report }: { report: DamageReport }) {
  return (
    <PDFViewer showToolbar={false} style={{ width: '100%', height: '100%', border: 'none' }}>
      <DamageReportPDF report={report} />
    </PDFViewer>
  );
}
