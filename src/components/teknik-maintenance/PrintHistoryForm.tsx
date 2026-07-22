import React from 'react';
import type { MaintenanceHistory } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface PrintHistoryFormProps {
  item: MaintenanceHistory;
}

/**
 * This component is purely for the print layout for history
 */
export default function PrintHistoryForm({ item }: PrintHistoryFormProps) {
  const inspectionDateFormatted = item.inspectionDate ? format(parseISO(item.inspectionDate), 'dd MMMM yyyy', { locale: id }) : '-';

  return (
    <div className="bg-white text-black p-8 max-w-[210mm] mx-auto print:p-0 print:m-0" id="print-area">
      <div className="border-2 border-black p-6">
        <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold uppercase tracking-wider">AFT-DEO SORONG</h1>
            <p className="text-sm font-medium">HASIL INSPEKSI / MAINTENANCE</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold">{item.sf}</h2>
            <p className="text-sm">Periode: {item.period}</p>
          </div>
        </div>

        <div className="mb-8">
          <table className="w-full text-left">
            <tbody>
              <tr>
                <td className="w-48 font-bold py-2">Item Pekerjaan</td>
                <td className="w-4 py-2">:</td>
                <td className="py-2 border-b border-black">{item.item}</td>
              </tr>
              <tr>
                <td className="font-bold py-2">Tanggal Pelaksanaan</td>
                <td className="py-2">:</td>
                <td className="py-2 border-b border-black">{inspectionDateFormatted}</td>
              </tr>
              <tr>
                <td className="font-bold py-2">Status</td>
                <td className="py-2">:</td>
                <td className="py-2 border-b border-black font-semibold">{item.status}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mb-8">
          <h3 className="font-bold mb-4">HASIL PEMERIKSAAN / CHECKLIST:</h3>
          <div className="border border-black min-h-[10rem] p-4 whitespace-pre-wrap">
            {item.hasilCeklish || 'Telah diperiksa.'}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="font-bold mb-4">KETERANGAN / TINDAK LANJUT:</h3>
          <div className="border border-black min-h-[8rem] p-4 whitespace-pre-wrap">
            {item.keterangan || '-'}
          </div>
        </div>

        <div className="flex justify-end pt-12">
          <div className="text-center w-48">
            <p className="mb-16">Sorong, {inspectionDateFormatted}</p>
            <p className="border-t border-black pt-2 font-bold">Teknisi / Pelaksana</p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}} />
    </div>
  );
}
