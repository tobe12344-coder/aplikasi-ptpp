import React from 'react';
import type { MaintenanceChecklist } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';

interface PrintAllChecklistsProps {
  data: MaintenanceChecklist[];
}

export default function PrintAllChecklists({ data }: PrintAllChecklistsProps) {
  // Urutkan data berdasarkan nomor atau kategori
  const sortedData = [...data].sort((a, b) => parseInt(a.no) - parseInt(b.no));

  return (
    <div className="bg-white text-black p-8 mx-auto print:p-0 print:m-0" id="print-area">
      <div className="mb-6 text-center border-b-2 border-black pb-4">
        <h1 className="text-2xl font-bold uppercase tracking-wider">AFT-DEO SORONG</h1>
        <p className="text-lg font-medium">REKAP HASIL INSPEKSI / MAINTENANCE SARPRAS</p>
        <p className="text-sm">Tanggal Cetak: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: id })}</p>
      </div>

      <table className="w-full text-left border-collapse border border-black text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border border-black px-2 py-2 text-center w-10">No</th>
            <th className="border border-black px-2 py-2">Item Pekerjaan</th>
            <th className="border border-black px-2 py-2 w-24">Form (SF)</th>
            <th className="border border-black px-2 py-2 w-24">Periode</th>
            <th className="border border-black px-2 py-2 w-28 text-center">Last Insp</th>
            <th className="border border-black px-2 py-2 w-28 text-center">Next Insp</th>
            <th className="border border-black px-2 py-2 w-24 text-center">Status</th>
            <th className="border border-black px-2 py-2">Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item, index) => {
             const lastD = item.lastInspection ? format(parseISO(item.lastInspection), 'dd/MM/yyyy') : '-';
             const nextD = item.nextInspection ? format(parseISO(item.nextInspection), 'dd/MM/yyyy') : '-';

             return (
              <tr key={item.id || index}>
                <td className="border border-black px-2 py-1 text-center">{item.no}</td>
                <td className="border border-black px-2 py-1 font-semibold">{item.item}</td>
                <td className="border border-black px-2 py-1">{item.sf}</td>
                <td className="border border-black px-2 py-1">{item.period}</td>
                <td className="border border-black px-2 py-1 text-center">{lastD}</td>
                <td className="border border-black px-2 py-1 text-center">{nextD}</td>
                <td className="border border-black px-2 py-1 text-center font-semibold">{item.status}</td>
                <td className="border border-black px-2 py-1">{item.keterangan || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="flex justify-end pt-12">
        <div className="text-center w-48">
          <p className="mb-16">Sorong, {format(new Date(), 'dd MMMM yyyy', { locale: id })}</p>
          <p className="border-t border-black pt-2 font-bold">Mengetahui</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: landscape; }
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
