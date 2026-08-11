'use client';

import { useEffect, useState } from 'react';
import type { DamageReport } from '@/lib/types';

const CheckMark = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '80%', height: '80%' }}>
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

interface PrintDamageReportProps {
  report: DamageReport;
  onClose: () => void;
  shouldPrint: boolean;
}

export default function PrintDamageReport({ report, onClose, shouldPrint }: PrintDamageReportProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!shouldPrint) return null;

  const handleDownload = () => {
    setIsDownloading(true);
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
          setIsDownloading(false);
        });
      }).catch(err => {
        console.error("Error loading html2pdf", err);
        setIsDownloading(false);
      });
    }
  };

  const ptppMatch = report.noLaporan.match(/PTPP-(\d+)\/(.*)/);
  const ptppNum = ptppMatch ? ptppMatch[1] : '';
  const ptppRest = ptppMatch ? ptppMatch[2] : report.noLaporan;

  const tgl = report.timestamp ? report.timestamp.split(' ')[0] : '-';

  const formatSigDate = (ts: any) => {
    if (!ts) return '-';
    if (ts.toDate) {
      return ts.toDate().toISOString().split('T')[0];
    } else if (ts.seconds) {
      return new Date(ts.seconds * 1000).toISOString().split('T')[0];
    }
    return '-';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-[9999] flex flex-col">
      {/* Top Bar for Actions */}
      <div className="bg-white px-6 py-4 flex justify-between items-center shadow-md z-10">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Preview PTPP: {report.noLaporan}</h2>
          <p className="text-sm text-slate-500">Periksa kerapian dokumen sebelum mengunduh PDF.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-md hover:bg-slate-100 text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {isDownloading ? 'Mengekspor...' : 'Download PDF'}
          </button>
        </div>
      </div>

      {/* Preview Area (Scrollable background) */}
      <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-slate-200">
        <div className="bg-white shadow-2xl relative overflow-hidden" style={{ width: '210mm', minHeight: '297mm' }}>
          
          <div id="print-area" className="w-[210mm] bg-white p-6 font-sans text-[11px] leading-normal text-black" style={{ minHeight: '297mm' }}>

            <style>{`
              #print-area * { box-sizing: border-box; }
              #print-area table { width: 100%; border-collapse: collapse; }
              #print-area th, #print-area td { border: 1px solid black; padding: 4px 6px; }
              #print-area .no-border-t { border-top: none; }
              #print-area .no-border-b { border-bottom: none; }
              #print-area .no-border-l { border-left: none; }
              #print-area .no-border-r { border-right: none; }
              #print-area .double-border-b { border-bottom: 3px double black; }
              #print-area .red-text { color: red; }
              #print-area .valign-top { vertical-align: top; }
              #print-area .valign-mid { vertical-align: middle; }
              #print-area .valign-bot { vertical-align: bottom; }
              #print-area .font-bold { font-weight: bold; }
              #print-area .text-center { text-align: center; }
              #print-area .text-right { text-align: right; }
              #print-area .check-box { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; border: 1px solid black; margin-right: 4px; font-weight: bold; font-size: 10px; }
              #print-area .check-box-large { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border: 1px solid black; margin-right: 4px; font-weight: bold; font-size: 12px; }
              #print-area .section-divider { font-style: italic; font-size: 10px; margin-top: 4px; margin-bottom: 2px; }
            `}</style>

            {/* HEADER TABLE */}
            <table>
              <tbody>
                <tr>
                  <td className="w-[30%] valign-top font-bold">
                    <div>No. PTPP- <span className="red-text">{ptppNum}</span> /{ptppRest}</div>
                    <div className="text-center mt-4">Tanggal</div>
                    <div className="text-center red-text font-normal">{tgl}</div>
                  </td>
                  <td className="w-[40%] text-center valign-mid font-bold text-[12px]">
                    PERMINTAAN TINDAKAN PERBAIKAN<br/>
                    DAN PENCEGAHAN<br/>
                    (PTPP)
                  </td>
                  <td className="w-[30%] valign-mid text-right">
                    <img src="/logo-pertamina.png" alt="Logo Pertamina Patra Niaga" className="h-12 inline-block object-contain" />
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="no-border-t double-border-b">
              <tbody>
                <tr>
                  <td className="w-[15%] no-border-r">Kepada / Fungsi</td>
                  <td className="w-[1%] no-border-l no-border-r">:</td>
                  <td className="w-[54%] no-border-l red-text border-b-dotted">
                    Kiamnasmeithson / Maintenance
                  </td>
                  <td className="w-[30%] text-center">Area / Lokasi Temuan</td>
                </tr>
                <tr>
                  <td className="w-[15%] no-border-r">Dari / Fungsi</td>
                  <td className="w-[1%] no-border-l no-border-r">:</td>
                  <td className="w-[54%] no-border-l red-text">
                    <span className="uppercase">{report.namaPelapor}</span> / <span className="uppercase">{report.jabatanPelapor}</span>
                  </td>
                  <td className="w-[30%] text-center uppercase font-bold red-text">
                    {report.areaKerusakan}
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="italic text-[10px]">Di isi oleh pemohon/auditor</div>

            {/* SUMBER KETIDAKSESUAIAN */}
            <table className="no-border-t">
              <tbody>
                <tr>
                  <td colSpan={6} className="text-center font-bold">SUMBER KETIDAKSESUAIAN ATAU POTENSINYA</td>
                </tr>
                <tr>
                  <td className="w-[4%] text-center"><span className="check-box">{report.sumberKetidaksesuaian === 'Keluhan' ? <CheckMark /> : ''}</span></td>
                  <td className="w-[29%]">Keluhan</td>
                  <td className="w-[4%] text-center"><span className="check-box">{report.sumberKetidaksesuaian === 'Tinjauan Manajemen' ? <CheckMark /> : ''}</span></td>
                  <td className="w-[29%]">Tinjauan Manajemen</td>
                  <td className="w-[4%] text-center"><span className="check-box">{report.sumberKetidaksesuaian === 'Usulan/Saran' ? <CheckMark /> : ''}</span></td>
                  <td className="w-[30%]">Usulan/Saran</td>
                </tr>
                <tr>
                  <td className="text-center"><span className="check-box">{report.sumberKetidaksesuaian === 'Audit' ? <CheckMark /> : ''}</span></td>
                  <td>Audit</td>
                  <td className="text-center"><span className="check-box">{report.sumberKetidaksesuaian === 'Survey Lapangan' ? <CheckMark /> : ''}</span></td>
                  <td>Survey Lapangan</td>
                  <td className="text-center"><span className="check-box">{report.sumberKetidaksesuaian === 'Lain-lain' ? <CheckMark /> : ''}</span></td>
                  <td>Lain-lain (Tinjauan Lapangan)</td>
                </tr>
                <tr>
                  <td colSpan={6} className="text-center font-bold">KETIDAKSESUAIAN ATAU POTENSI YANG DITEMUKAN</td>
                </tr>
                <tr>
                  <td className="valign-top text-center red-text">1</td>
                  <td colSpan={5} className="valign-top red-text" style={{ minHeight: '60px' }}>
                    {report.jenisKerusakan}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* GAMBAR DAN SIGNATURE PEMOHON */}
            <table className="no-border-t double-border-b">
              <tbody>
                <tr>
                  <td className="w-[60%] valign-top">*) Persyaratan yang dilanggar : <br /><span className="red-text">{report.persyaratanDilanggar}</span></td>
                  <td colSpan={2} className="w-[40%] valign-top">
                    Batas waktu reply/jawab : <span className="red-text">{report.batasWaktuReply}</span><br />
                    *) Kategori : <span className="red-text">{report.kategoriPTPP || 'Perbaikan / Perawatan'}</span>
                  </td>
                </tr>
                <tr>
                  <td className="valign-top" style={{ height: '140px', position: 'relative' }}>
                    <span className="font-bold">ILUSTRASI / GAMBAR (jika ada) :</span>
                    {report.fotoKerusakan ? (
                      <div className="absolute inset-0 flex items-center justify-center pt-4">
                        <img src={`/api/image-proxy?url=${encodeURIComponent(report.fotoKerusakan)}`} alt="Kerusakan" className="max-h-[110px] max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center font-bold">#UNKNOWN!</div>
                    )}
                  </td>
                  <td className="valign-top w-[20%] p-0">
                    <table className="w-full h-full" style={{ border: 'none', height: '140px' }}>
                      <tbody>
                        <tr>
                          <td className="text-center no-border-t no-border-l no-border-r py-2">Pemohon/Auditor</td>
                        </tr>
                        <tr>
                          <td className="valign-top no-border-b no-border-l no-border-r p-2" style={{ minHeight: '100px' }}>
                            <div className="w-full flex flex-col justify-between h-full">
                              <div className="red-text text-left">{report.jabatanPelapor}</div>
                              <div className="flex flex-col items-start mt-auto">
                                <span className="red-text underline uppercase">{report.signaturePemohon || report.namaPelapor}</span>
                                <span className="red-text font-bold">Tgl: {tgl}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td className="valign-top w-[20%] p-0">
                    <table className="w-full h-full" style={{ border: 'none', minHeight: '140px' }}>
                      <tbody>
                        <tr>
                          <td className="text-center no-border-t no-border-l no-border-r py-2">Disetujui Oleh,</td>
                        </tr>
                        <tr>
                          <td className="valign-top no-border-b no-border-l no-border-r p-2" style={{ minHeight: '100px' }}>
                            <div className="w-full flex flex-col justify-between h-full">
                              <div className="red-text text-left">Supervisor RSD</div>
                              <div className="flex flex-col items-start mt-auto">
                                {report.signatureSpvRsd1_image && (
                                  <img src={report.signatureSpvRsd1_image} alt="Signature" className="h-10 object-contain mb-1" />
                                )}
                                <span className="red-text underline">{report.signatureSpvRsd1 || 'Urip Widodo'}</span>
                                <span className="red-text font-bold">Tgl: {report.signatureSpvRsd1_image ? formatSigDate(report.signatureSpvRsd1_timestamp) : '-'}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="section-divider">Di isi oleh penerima laporan</div>

            {/* TINDAK LANJUT */}
            <table className="no-border-t">
              <tbody>
                <tr>
                  <td colSpan={4} className="text-center font-bold tracking-widest text-[12px]">TINDAK LANJUT</td>
                </tr>
                <tr>
                  <td className="w-[45%] text-center">PERBAIKAN/TINDAKAN SEMENTARA</td>
                  <td className="w-[15%] text-center">Tanggal Inspeksi</td>
                  <td className="w-[40%] text-center" colSpan={2}>Penerima</td>
                </tr>
                <tr>
                  <td className="valign-top" style={{ minHeight: '80px' }}>
                    (Jika ada) : <br /><br />
                    <span className="red-text">{report.perbaikanSementara}</span>
                  </td>
                  <td className="text-center valign-mid red-text">
                    {report.tanggalInspeksi || tgl}
                  </td>
                  <td className="w-[20%] p-0 valign-top">
                    <table className="w-full h-full" style={{ border: 'none', minHeight: '80px' }}>
                      <tbody>
                        <tr>
                          <td className="text-center no-border-t no-border-l no-border-r py-2">Penanggung Jawab</td>
                        </tr>
                        <tr>
                          <td className="valign-top no-border-b no-border-l no-border-r p-2" style={{ minHeight: '80px' }}>
                            <div className="w-full flex flex-col justify-between h-full">
                              <div className="red-text text-left">Spv Maintenance</div>
                              <div className="flex flex-col items-start mt-auto">
                                {report.signatureSpvMaintenance_image && (
                                  <img src={report.signatureSpvMaintenance_image} alt="Signature" className="h-10 object-contain mb-1" />
                                )}
                                <span className="red-text underline">{report.signatureSpvMaintenance || 'Kiamnasmeithson'}</span>
                                <span className="red-text font-bold">Tgl: {report.signatureSpvMaintenance_image ? formatSigDate(report.signatureSpvMaintenance_timestamp) : '-'}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td className="w-[20%] p-0 valign-top">
                    <table className="w-full h-full" style={{ border: 'none', minHeight: '80px' }}>
                      <tbody>
                        <tr>
                          <td className="text-center no-border-t no-border-l no-border-r py-2">Disetujui oleh,</td>
                        </tr>
                        <tr>
                          <td className="valign-top no-border-b no-border-l no-border-r p-2" style={{ minHeight: '80px' }}>
                            <div className="w-full flex flex-col justify-between h-full">
                              <div className="red-text text-left">Supervisor RSD</div>
                              <div className="flex flex-col items-start mt-auto">
                                {report.signatureSpvRsd2_image && (
                                  <img src={report.signatureSpvRsd2_image} alt="Signature" className="h-10 object-contain mb-1" />
                                )}
                                <span className="red-text underline">{report.signatureSpvRsd2 || 'Urip Widodo'}</span>
                                <span className="red-text font-bold">Tgl: {report.signatureSpvRsd2_image ? formatSigDate(report.signatureSpvRsd2_timestamp) : '-'}</span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* TABEL ANALISA & PERBAIKAN */}
            <table className="no-border-t text-center">
              <tbody>
                <tr>
                  <td className="w-[5%]">No</td>
                  <td className="w-[25%]">Analisa Penyebab Awal Kerusakan</td>
                  <td className="w-[40%]">Tindakan Perbaikan</td>
                  <td className="w-[15%]">PIC</td>
                  <td className="w-[15%]">Waktu Pelaksanaan</td>
                </tr>
                <tr>
                  <td className="valign-top red-text" style={{ minHeight: '60px' }}>1</td>
                  <td className="valign-top text-left red-text">{report.analisaPenyebab}</td>
                  <td className="valign-top text-left red-text">{report.tindakanPerbaikan || report.pelaksanaanPerbaikan}</td>
                  <td className="valign-top red-text">{report.pic || report.jabatanTimPerbaikan}</td>
                  <td className="valign-top red-text">{report.waktuPelaksanaan || report.tanggalTindakLanjut}</td>
                </tr>
              </tbody>
            </table>

            {/* DOKUMEN REVISI */}
            <table className="no-border-t double-border-b">
              <tbody>
                <tr>
                  <td className="valign-top w-[70%]">
                    Dokumen yang direvisi (jika ada) :
                    <div className="grid grid-cols-3 gap-1 mt-2 mb-1 ml-4 w-3/4">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center"><span className="check-box-large">{report.dokumenDirevisi === 'Pedoman/Manual' ? <CheckMark /> : ''}</span> Pedoman/Manual</div>
                        <div className="flex items-center"><span className="check-box-large">{report.dokumenDirevisi === 'TKO' ? <CheckMark /> : ''}</span> TKO</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center"><span className="check-box-large">{report.dokumenDirevisi === 'TKI' ? <CheckMark /> : ''}</span> TKI</div>
                        <div className="flex items-center"><span className="check-box-large">{report.dokumenDirevisi === 'TKPA' ? <CheckMark /> : ''}</span> TKPA</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center"><span className="check-box-large">{report.dokumenDirevisi === 'Formulir' ? <CheckMark /> : ''}</span> Formulir</div>
                      </div>
                    </div>
                  </td>
                  <td className="valign-top w-[30%] text-center">
                    Target Waktu Verifikasi<br/>
                    <div className="mt-2 red-text font-bold">{report.targetWaktuVerifikasi}</div>
                  </td>
                </tr>
              </tbody>
            </table>

            <div className="section-divider">Di isi oleh pemohon/auditor</div>

            {/* STATUS & AFTM */}
            <table className="no-border-t">
              <tbody>
                <tr>
                  <td className="valign-top w-[25%]">
                    <div className="mb-2">Status</div>
                    <div className="flex items-center mb-1 ml-4"><span className="check-box-large">{report.status === 'Close' ? <CheckMark /> : ''}</span> Close</div>
                    <div className="flex items-center ml-4"><span className="check-box-large">{report.status === 'Open' ? <CheckMark /> : ''}</span> Perlu Follow up</div>
                    <div className="mt-4">Catatan : <span className="red-text">{report.catatan}</span></div>
                  </td>
                  <td className="valign-top w-[55%]">
                    <div className="mt-6 flex">
                      <div className="w-32">Tanggal</div>
                      <div>: <span className="red-text ml-4">{report.tanggalVerifikasi || report.waktuPelaksanaan || report.tanggalTindakLanjut}</span></div>
                    </div>
                    <div className="mt-1 flex">
                      <div className="w-32">Target Verifikasi Selanjutnya</div>
                      <div>: <span className="red-text ml-4">{report.targetVerifikasiSelanjutnya}</span></div>
                    </div>
                  </td>
                  <td className="valign-top w-[20%] p-2" style={{ minHeight: '100px' }}>
                    <div className="w-full flex flex-col justify-between h-full items-center text-center">
                      <div className="text-black mb-2">Approval AFTM</div>
                      <div className="flex flex-col items-center mt-auto">
                        {report.signatureAftm_image && (
                          <img src={report.signatureAftm_image} alt="Signature" className="h-10 object-contain mb-1" />
                        )}
                        <span className="red-text underline">{report.signatureAftm || 'Wahyudi'}</span>
                        <span className="red-text font-bold">Tgl: {report.signatureAftm_image ? formatSigDate(report.signatureAftm_timestamp) : '-'}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Lampiran Gambar Tindak Lanjut jika ada */}
            {report.konversiGambar && (
              <div className="break-before-page mt-8">
                <h3 className="font-bold text-[12px] mb-2 underline">LAMPIRAN: DOKUMENTASI HASIL PERBAIKAN</h3>
                <div className="border border-black p-2 inline-block">
                  <img src={`/api/image-proxy?url=${encodeURIComponent(report.konversiGambar)}`} alt="Hasil Perbaikan" className="max-w-full max-h-[800px] object-contain" />
                </div>
                <div className="mt-1 font-bold">Dilampirkan pada tanggal: {report.tanggalTindakLanjut}</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
