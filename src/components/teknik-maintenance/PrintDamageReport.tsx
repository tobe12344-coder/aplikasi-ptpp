'use client';

import { useEffect } from 'react';
import type { DamageReport } from '@/lib/types';

interface PrintDamageReportProps {
  report: DamageReport;
  onClose: () => void;
  shouldPrint: boolean;
}

export default function PrintDamageReport({ report, onClose, shouldPrint }: PrintDamageReportProps) {
  useEffect(() => {
    if (shouldPrint) {
      // Small delay to ensure images are loaded
      const timer = setTimeout(() => {
        const element = document.getElementById('print-area');
        if (element) {
          import('html2pdf.js').then((html2pdfModule) => {
            const html2pdf = html2pdfModule.default;
            const opt = {
              margin: [0, 0, 0, 0] as [number, number, number, number], // top, left, bottom, right in mm
              filename: `SF_PTPP_${report.noLaporan}.pdf`,
              image: { type: 'jpeg' as const, quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true, logging: false },
              jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
            };

            html2pdf().set(opt).from(element).save().then(() => {
              onClose();
            });
          }).catch(err => {
            console.error("Error loading html2pdf", err);
            onClose();
          });
        } else {
          onClose();
        }
      }, 800);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [shouldPrint, onClose, report.noLaporan]);

  if (!shouldPrint) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center">
      <div className="bg-white p-4 rounded-lg shadow-xl text-center">
        <p className="text-lg font-medium mb-2">Mengekspor PDF...</p>
        <p className="text-sm text-gray-500">Mohon tunggu sebentar.</p>
      </div>

      {/* Hidden print area for html2pdf */}
      <div className="absolute left-[-9999px] top-0 opacity-0 pointer-events-none">
        <div id="print-area" className="w-[210mm] bg-white p-8 font-serif text-[11px] leading-tight text-black" style={{ minHeight: '297mm' }}>

          {/* Header */}
          <table className="w-full border-collapse border border-black mb-4">
            <tbody>
              <tr>
                <td className="border border-black p-2 w-1/3 align-top">
                  <div className="font-bold text-sm">
                    {report.noLaporan.match(/PTPP-(\d+)\/(.*)/) ? (
                      <>No. PTPP- <span className="text-red-600">{report.noLaporan.match(/PTPP-(\d+)\/(.*)/)?.[1]}</span> /{report.noLaporan.match(/PTPP-(\d+)\/(.*)/)?.[2]}</>
                    ) : (
                      <>No. PTPP : {report.noLaporan}</>
                    )}
                  </div>
                  <div className="mt-4 text-center text-sm font-bold">Tanggal<br/><span className="text-red-600 font-normal">{report.timestamp.split(' ')[0]}</span></div>
                </td>
                <td className="border border-black p-2 w-1/3 text-center align-middle font-bold text-sm">
                  PERMINTAAN TINDAKAN PERBAIKAN<br />DAN PENCEGAHAN<br />(PTPP)
                </td>
                <td className="border border-black p-4 w-1/3 text-right align-middle">
                  {/* Logo Pertamina */}
                  <div className="flex justify-end items-center h-full">
                    <img src="/logo-pertamina.png" alt="Logo Pertamina Patra Niaga" className="h-20 w-auto object-contain" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Info Box */}
          <table className="w-full border-collapse border border-black mb-2">
            <tbody>
              <tr>
                <td className="border border-black p-2 w-1/2">
                  <div className="flex justify-between">
                    <span className="w-24">Kepada / Fungsi</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 text-red-600">Spv Maintenance / Maintenance</span>
                  </div>
                </td>
                <td className="border border-black p-2 w-1/2 text-center">
                  Area / Lokasi Temuan
                </td>
              </tr>
              <tr>
                <td className="border border-black p-2">
                  <div className="flex justify-between">
                    <span className="w-24">Dari / Fungsi</span>
                    <span className="mr-2">:</span>
                    <span className="flex-1 uppercase">{report.namaPelapor} / {report.jabatanPelapor}</span>
                  </div>
                </td>
                <td className="border border-black p-2 text-center uppercase font-bold">
                  {report.areaKerusakan}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="italic text-xs mb-1">Di isi oleh pemohon/auditor</div>

          {/* Sumber Ketidaksesuaian */}
          <table className="w-full border-collapse border border-black mb-0">
            <tbody>
              <tr>
                <td colSpan={6} className="border border-black bg-gray-100 p-1 text-center font-bold">
                  SUMBER KETIDAKSESUAIAN ATAU POTENSINYA
                </td>
              </tr>
              <tr>
                <td className="border border-black p-1 w-6 text-center font-bold">{report.sumberKetidaksesuaian === 'Keluhan' ? 'X' : ''}</td>
                <td className="border border-black p-1">Keluhan</td>
                <td className="border border-black p-1 w-6 text-center font-bold">{report.sumberKetidaksesuaian === 'Tinjauan Manajemen' ? 'X' : ''}</td>
                <td className="border border-black p-1">Tinjauan Manajemen</td>
                <td className="border border-black p-1 w-6 text-center font-bold">{report.sumberKetidaksesuaian === 'Usulan/Saran' ? 'X' : ''}</td>
                <td className="border border-black p-1">Usulan/Saran</td>
              </tr>
              <tr>
                <td className="border border-black p-1 w-6 text-center font-bold">{report.sumberKetidaksesuaian === 'Audit' ? 'X' : ''}</td>
                <td className="border border-black p-1">Audit</td>
                <td className="border border-black p-1 w-6 text-center font-bold">{report.sumberKetidaksesuaian === 'Survey Lapangan' ? 'X' : ''}</td>
                <td className="border border-black p-1">Survey Lapangan</td>
                <td className="border border-black p-1 w-6 text-center font-bold">{report.sumberKetidaksesuaian === 'Lain-lain' ? 'X' : ''}</td>
                <td className="border border-black p-1">Lain-lain (Tinjauan Lapangan)</td>
              </tr>
              <tr>
                <td colSpan={6} className="border border-black bg-gray-100 p-1 text-center font-bold">
                  KETIDAKSESUAIAN ATAU POTENSI YANG DITEMUKAN
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="border border-black p-4 h-24 align-top">
                  {report.jenisKerusakan}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Gambar dan Signature Pemohon */}
          <table className="w-full border-collapse border border-black mb-2 border-t-0">
            <tbody>
              <tr>
                <td className="border border-black p-1 w-2/3">*) Persyaratan yang dilanggar : <br /><br /></td>
                <td colSpan={2} className="border border-black p-1">Batas waktu reply/jawab : </td>
              </tr>
              <tr>
                <td className="border border-black p-2 h-40 align-top relative">
                  <span className="font-bold">ILUSTRASI / GAMBAR (jika ada) :</span>
                  {report.fotoKerusakan ? (
                    <div className="mt-2 flex justify-center h-32">
                      <img src={report.fotoKerusakan} alt="Kerusakan" className="max-h-full object-contain" crossOrigin="anonymous" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center font-bold text-lg">N/A</div>
                  )}
                </td>
                <td className="border border-black p-0 w-1/3 align-top" colSpan={2}>
                  <table className="w-full h-full border-collapse">
                    <tbody>
                      <tr>
                        <td colSpan={2} className="border-b border-black p-1">*) Kategori : Perbaikan / Perawatan</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black p-1 text-center w-1/2">Pemohon/Auditor</td>
                        <td className="p-1 text-center w-1/2">Disetujui Oleh,</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black h-24 align-bottom text-center p-1">
                          <div className="uppercase underline mb-1">{report.namaPelapor}</div>
                          <div className="text-red-600">Tgl: {report.timestamp.split(' ')[0]}</div>
                        </td>
                        <td className="h-24 align-bottom text-center p-1 relative">
                          <div className="absolute top-2 right-2 text-red-600 font-bold">Supervisor RSD</div>
                          <div className="text-red-600 underline mb-1">Urip Widodo</div>
                          <div className="text-red-600">Tgl: {report.timestamp.split(' ')[0]}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="italic text-xs mb-1">Di isi oleh penerima CAR/PAR</div>

          {/* Tindak Lanjut */}
          <table className="w-full border-collapse border border-black mb-0">
            <tbody>
              <tr>
                <td colSpan={4} className="border border-black bg-gray-200 p-1 text-center font-bold text-lg tracking-widest">
                  TINDAK LANJUT
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black p-1 w-1/2 text-center">PERBAIKAN/TINDAKAN SEMENTARA</td>
                <td className="border border-black p-1 w-1/4 text-center">Status Pengadaan</td>
                <td className="border border-black p-1 w-1/4 text-center">Penerima</td>
              </tr>
              <tr>
                <td colSpan={2} className="border border-black p-2 h-20 align-top">
                  (Jika ada) : <br />
                  {report.perbaikanSementara}
                </td>
                <td className="border border-black p-2 h-20 align-top text-center text-sm font-bold flex items-center justify-center">
                  {report.statusPengadaan}
                </td>
                <td className="border border-black p-0 align-top">
                  <table className="w-full h-full border-collapse">
                    <tbody>
                      <tr>
                        <td className="border-r border-b border-black p-1 text-center w-1/2 text-[10px]">Penanggung Jawab</td>
                        <td className="border-b border-black p-1 text-center w-1/2 text-[10px]">Disetujui oleh,</td>
                      </tr>
                      <tr>
                        <td className="border-r border-black p-1 text-center align-bottom h-16 relative">
                          <div className="absolute top-1 right-1 left-1 text-red-600 text-[10px]">Spv Maintenance</div>
                          <div className="text-red-600 underline">Kiamnasmeithson</div>
                        </td>
                        <td className="p-1 text-center align-bottom relative">
                          <div className="absolute top-1 right-1 left-1 text-red-600 text-[10px]">AFTM DEO</div>
                          <div className="text-red-600 underline">Wahyudi</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black mb-0 border-t-0 text-center">
            <tbody>
              <tr className="bg-gray-100">
                <td className="border border-black p-1 w-8">No</td>
                <td className="border border-black p-1">Analisa Penyebab Awal Kerusakan</td>
                <td className="border border-black p-1">Tindakan Perbaikan</td>
                <td className="border border-black p-1">PIC</td>
                <td className="border border-black p-1">Waktu Pelaksanaan</td>
              </tr>
              <tr>
                <td className="border border-black p-1 h-16 align-top">1</td>
                <td className="border border-black p-1 align-top text-left">{report.analisaPenyebab}</td>
                <td className="border border-black p-1 align-top text-left">{report.pelaksanaanPerbaikan}</td>
                <td className="border border-black p-1 align-top">{report.jabatanTimPerbaikan}</td>
                <td className="border border-black p-1 align-top">{report.tanggalTindakLanjut}</td>
              </tr>
            </tbody>
          </table>

          <table className="w-full border-collapse border border-black mb-2 border-t-0">
          <tbody>
            <tr>
              <td className="border border-black p-1">
                Dokumen yang direvisi (jika ada) :<br/>
                <div className="grid grid-cols-3 gap-2 mt-2 mb-2 ml-4 max-w-lg">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center"><div className="w-4 h-4 border border-black mr-2 font-bold flex items-center justify-center text-[10px]">{report.dokumenDirevisi === 'Pedoman/Manual' ? 'X' : ''}</div> Pedoman/Manual</div>
                    <div className="flex items-center"><div className="w-4 h-4 border border-black mr-2 font-bold flex items-center justify-center text-[10px]">{report.dokumenDirevisi === 'TKO' ? 'X' : ''}</div> TKO</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center"><div className="w-4 h-4 border border-black mr-2 font-bold flex items-center justify-center text-[10px]">{report.dokumenDirevisi === 'TKI' ? 'X' : ''}</div> TKI</div>
                    <div className="flex items-center"><div className="w-4 h-4 border border-black mr-2 font-bold flex items-center justify-center text-[10px]">{report.dokumenDirevisi === 'TKPA' ? 'X' : ''}</div> TKPA</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center"><div className="w-4 h-4 border border-black mr-2 font-bold flex items-center justify-center text-[10px]">{report.dokumenDirevisi === 'Formulir' ? 'X' : ''}</div> Formulir</div>
                  </div>
                </div>
              </td>
              <td className="border border-black p-1 w-1/4 align-top">
                Target Waktu Verifikasi<br/>
                Tgl : {report.tanggalTindakLanjut}
              </td>
            </tr>
          </tbody>
        </table>

          <div className="italic text-xs mb-1">Di isi oleh pemohon/auditor</div>
          <table className="w-full border-collapse border border-black mb-4">
            <tbody>
              <tr>
                <td className="border border-black p-2 w-2/3">
                  <div className="flex mb-4">
                    <div className="w-24">Status</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center"><div className="w-4 h-4 border border-black mr-2 font-bold flex items-center justify-center text-[10px]">{report.status === 'Close' ? 'X' : ''}</div> Close</div>
                      <div className="flex items-center"><div className="w-4 h-4 border border-black mr-2 font-bold flex items-center justify-center text-[10px]">{report.status === 'Open' ? 'X' : ''}</div> Perlu Follow up</div>
                    </div>
                    <div className="ml-12 flex-1">
                      <div>Tanggal : {report.tanggalTindakLanjut}</div>
                      <div className="mt-1">Target Verifikasi Selanjutnya : </div>
                    </div>
                  </div>
                  <div>Catatan : </div>
                </td>
                <td className="border border-black p-1 w-1/3 align-top text-center">
                  Approval Pemohon / Auditor
                  <div className="mt-16 underline uppercase">{report.namaPelapor}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Lampiran Gambar Tindak Lanjut jika ada */}
          {report.konversiGambar && (
            <div className="break-before-page">
              <h3 className="font-bold text-lg mb-4 underline">LAMPIRAN: DOKUMENTASI HASIL PERBAIKAN</h3>
              <div className="border border-black p-4 inline-block">
                <img src={report.konversiGambar} alt="Hasil Perbaikan" className="max-w-full max-h-[800px] object-contain" crossOrigin="anonymous" />
              </div>
              <div className="mt-2 font-bold">Dilampirkan pada tanggal: {report.tanggalTindakLanjut}</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
