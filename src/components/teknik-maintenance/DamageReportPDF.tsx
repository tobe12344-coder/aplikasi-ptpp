import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Polyline } from '@react-pdf/renderer';
import type { DamageReport } from '@/lib/types';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  redText: { color: 'red' },
  bold: { fontFamily: 'Helvetica-Bold' },
  italic: { fontFamily: 'Helvetica-Oblique' },
  textCenter: { textAlign: 'center' },
  textRight: { textAlign: 'right' },
  uppercase: { textTransform: 'uppercase' },
  underline: { textDecoration: 'underline' },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#000',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
  cell: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: '#000',
    padding: 4,
    justifyContent: 'center',
  },
  headerCell: {
    borderWidth: 1,
    borderColor: '#000',
    padding: 4,
  },
  noBorderTop: { borderTopWidth: 0 },
  noBorderBottom: { borderBottomWidth: 0 },
  noBorderLeft: { borderLeftWidth: 0 },
  noBorderRight: { borderRightWidth: 0 },
  doubleBorderBottom: { borderBottomWidth: 2, borderBottomStyle: 'solid' }, // Double not strictly supported, use 2px solid
  borderBottomDotted: { borderBottomWidth: 1, borderBottomStyle: 'dashed' }, // Dashed is supported
  checkBox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBoxLarge: {
    width: 14,
    height: 14,
    borderWidth: 1,
    borderColor: '#000',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionDivider: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 8,
    marginTop: 4,
    marginBottom: 2,
  },
});

const CheckMark = () => (
  <Svg viewBox="0 0 24 24" style={{ width: 8, height: 8 }}>
    <Polyline points="20 6 9 17 4 12" stroke="black" strokeWidth={4} fill="none" />
  </Svg>
);

interface Props {
  report: DamageReport;
}

export default function DamageReportPDF({ report }: Props) {
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

  const logoUrl = typeof window !== 'undefined' ? `${window.location.origin}/logo-pertamina.png` : '/logo-pertamina.png';

  // Helper for image url for react-pdf (must be absolute or valid uri)
  const getImageUrl = (url: string) => {
    if (typeof window !== 'undefined' && url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    return url;
  };

  // Safe title for browser's internal pdf viewer
  const safeLaporan = report.noLaporan ? report.noLaporan.replace(/[^a-zA-Z0-9-]/g, '_') : 'Laporan';
  const pdfTitle = `PTPP_${safeLaporan}.pdf`;

  return (
    <Document title={pdfTitle}>
      <Page size="A4" style={styles.page}>

        {/* HEADER TABLE */}
        <View style={styles.table}>
          <View style={styles.row}>
            {/* Col 1 */}
            <View style={[styles.cell, { width: '30%', justifyContent: 'flex-start' }]}>
              <Text style={styles.bold}>No. PTPP- <Text style={styles.redText}>{ptppNum}</Text> /{ptppRest}</Text>
              <Text style={[styles.textCenter, { marginTop: 8 }]}>Tanggal</Text>
              <Text style={[styles.textCenter, styles.redText]}>{tgl}</Text>
            </View>
            {/* Col 2 */}
            <View style={[styles.cell, { width: '40%', alignItems: 'center' }]}>
              <Text style={[styles.bold, styles.textCenter, { fontSize: 11 }]}>PERMINTAAN TINDAKAN PERBAIKAN</Text>
              <Text style={[styles.bold, styles.textCenter, { fontSize: 11 }]}>DAN PENCEGAHAN</Text>
              <Text style={[styles.bold, styles.textCenter, { fontSize: 11 }]}>(PTPP)</Text>
            </View>
            {/* Col 3 */}
            <View style={[styles.cell, { width: '30%', alignItems: 'flex-end', justifyContent: 'center' }]}>
              {/* Note: In a real app, make sure this image path resolves correctly in react-pdf */}
              <Image src={logoUrl} style={{ width: 100, height: 35, objectFit: 'contain' }} />
            </View>
          </View>
        </View>

        {/* INFO TABLE */}
        <View style={[styles.table, styles.noBorderTop, styles.doubleBorderBottom]}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderRight, styles.noBorderTop, { width: '15%' }]}><Text>Kepada / Fungsi</Text></View>
            <View style={[styles.cell, styles.noBorderLeft, styles.noBorderRight, styles.noBorderTop, { width: '2%' }]}><Text>:</Text></View>
            <View style={[styles.cell, styles.noBorderLeft, styles.noBorderTop, { width: '53%' }]}>
              <Text style={styles.redText}>Kiamnasmeithson / Maintenance</Text>
            </View>
            <View style={[styles.cell, styles.noBorderTop, { width: '30%', alignItems: 'center' }]}><Text>Area / Lokasi Temuan</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderRight, styles.noBorderTop, styles.noBorderBottom, { width: '15%' }]}><Text>Dari / Fungsi</Text></View>
            <View style={[styles.cell, styles.noBorderLeft, styles.noBorderRight, styles.noBorderTop, styles.noBorderBottom, { width: '2%' }]}><Text>:</Text></View>
            <View style={[styles.cell, styles.noBorderLeft, styles.noBorderTop, styles.noBorderBottom, { width: '53%' }]}>
              <Text style={[styles.redText, styles.uppercase]}>{report.namaPelapor} / {report.jabatanPelapor}</Text>
            </View>
            <View style={[styles.cell, styles.noBorderTop, styles.noBorderBottom, { width: '30%', alignItems: 'center' }]}>
              <Text style={[styles.redText, styles.uppercase, styles.bold]}>{report.areaKerusakan}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionDivider}>Di isi oleh pemohon/auditor</Text>

        {/* SUMBER KETIDAKSESUAIAN */}
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '100%', alignItems: 'center' }]}><Text style={styles.bold}>SUMBER KETIDAKSESUAIAN ATAU POTENSINYA</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '5%', alignItems: 'center' }]}><View style={styles.checkBox}>{report.sumberKetidaksesuaian === 'Keluhan' && <CheckMark />}</View></View>
            <View style={[styles.cell, { width: '28%' }]}><Text>Keluhan</Text></View>
            <View style={[styles.cell, { width: '5%', alignItems: 'center' }]}><View style={styles.checkBox}>{report.sumberKetidaksesuaian === 'Tinjauan Manajemen' && <CheckMark />}</View></View>
            <View style={[styles.cell, { width: '28%' }]}><Text>Tinjauan Manajemen</Text></View>
            <View style={[styles.cell, { width: '5%', alignItems: 'center' }]}><View style={styles.checkBox}>{report.sumberKetidaksesuaian === 'Usulan/Saran' && <CheckMark />}</View></View>
            <View style={[styles.cell, { width: '29%' }]}><Text>Usulan/Saran</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '5%', alignItems: 'center' }]}><View style={styles.checkBox}>{report.sumberKetidaksesuaian === 'Audit' && <CheckMark />}</View></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '28%' }]}><Text>Audit</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '5%', alignItems: 'center' }]}><View style={styles.checkBox}>{report.sumberKetidaksesuaian === 'Survey Lapangan' && <CheckMark />}</View></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '28%' }]}><Text>Survey Lapangan</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '5%', alignItems: 'center' }]}><View style={styles.checkBox}>{report.sumberKetidaksesuaian === 'Lain-lain' && <CheckMark />}</View></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '29%' }]}><Text>Lain-lain (Tinjauan Lapangan)</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '100%', alignItems: 'center' }]}><Text style={styles.bold}>KETIDAKSESUAIAN ATAU POTENSI YANG DITEMUKAN</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '5%', alignItems: 'center', justifyContent: 'flex-start' }]}><Text style={styles.redText}>1</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '95%', minHeight: 20, justifyContent: 'flex-start' }]}>
              <Text style={styles.redText}>{report.jenisKerusakan}</Text>
            </View>
          </View>
        </View>

        {/* GAMBAR DAN SIGNATURE PEMOHON */}
        <View style={[styles.table, styles.noBorderTop, styles.doubleBorderBottom]}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '60%', justifyContent: 'flex-start' }]}>
              <Text>*) Persyaratan yang dilanggar :</Text>
              <Text style={styles.redText}>{report.persyaratanDilanggar}</Text>
            </View>
            <View style={[styles.cell, styles.noBorderTop, { width: '40%', justifyContent: 'flex-start' }]}>
              <Text>Batas waktu reply/jawab : <Text style={styles.redText}>{report.batasWaktuReply}</Text></Text>
              <Text>*) Kategori : <Text style={styles.redText}>{report.kategoriPTPP || 'Perbaikan / Perawatan'}</Text></Text>
            </View>
          </View>

          <View style={styles.row}>
            {/* Image Area */}
            <View style={[styles.cell, styles.noBorderTop, styles.noBorderBottom, { width: '60%', minHeight: 120, justifyContent: 'flex-start', position: 'relative' }]}>
              <Text style={styles.bold}>ILUSTRASI / GAMBAR (jika ada) :</Text>
              {report.fotoKerusakan ? (
                <View style={{ alignItems: 'center', marginTop: 10 }}>
                  <Image src={getImageUrl(`/api/image-proxy?url=${encodeURIComponent(report.fotoKerusakan)}`)} style={{ maxHeight: 90, objectFit: 'contain' }} />
                </View>
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text style={styles.bold}>#UNKNOWN!</Text></View>
              )}
            </View>

            {/* Signature 1 */}
            <View style={[styles.cell, styles.noBorderTop, styles.noBorderBottom, { width: '20%', padding: 0 }]}>
              <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 4, alignItems: 'center' }}><Text>Pemohon/Auditor</Text></View>
              <View style={{ flex: 1, padding: 4, justifyContent: 'space-between' }}>
                <Text style={[styles.redText, { fontSize: 8 }]}>{report.jabatanPelapor}</Text>
                <View style={{ alignItems: 'flex-start', marginTop: 4 }}>
                  {report.signaturePemohon_image ? <Image src={report.signaturePemohon_image} style={{ height: 40, marginBottom: 4 }} /> : <View style={{ height: 44 }} />}
                  <Text style={[styles.redText, styles.underline, styles.uppercase]}>{report.signaturePemohon || report.namaPelapor}</Text>
                  <Text style={[styles.redText, styles.bold, { marginTop: 2 }]}>Tgl: {tgl}</Text>
                </View>
              </View>
            </View>

            {/* Signature 2 */}
            <View style={[styles.cell, styles.noBorderTop, styles.noBorderBottom, { width: '20%', padding: 0 }]}>
              <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 4, alignItems: 'center' }}><Text>Disetujui Oleh,</Text></View>
              <View style={{ flex: 1, padding: 4, justifyContent: 'space-between' }}>
                <Text style={[styles.redText, { fontSize: 8 }]}>Supervisor RSD</Text>
                <View style={{ alignItems: 'flex-start', marginTop: 4 }}>
                  {report.signatureSpvRsd1_image ? <Image src={report.signatureSpvRsd1_image} style={{ height: 40, marginBottom: 4 }} /> : <View style={{ height: 44 }} />}
                  <Text style={[styles.redText, styles.underline]}>{report.signatureSpvRsd1 || 'Urip Widodo'}</Text>
                  <Text style={[styles.redText, styles.bold, { marginTop: 2 }]}>Tgl: {report.signatureSpvRsd1_image ? formatSigDate(report.signatureSpvRsd1_timestamp) : '-'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <Text style={styles.sectionDivider}>Di isi oleh penerima laporan</Text>

        {/* TINDAK LANJUT */}
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '100%', alignItems: 'center' }]}>
              <Text style={[styles.bold, { letterSpacing: 2 }]}>TINDAK LANJUT</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '45%', alignItems: 'center' }]}><Text>PERBAIKAN/TINDAKAN SEMENTARA</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '15%', alignItems: 'center' }]}><Text>Tanggal Inspeksi</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '40%', alignItems: 'center' }]}><Text>Penerima</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '45%', minHeight: 110, justifyContent: 'flex-start' }]}>
              <Text>(Jika ada) :</Text>
              <Text style={[styles.redText, { marginTop: 8 }]}>{report.perbaikanSementara}</Text>
            </View>
            <View style={[styles.cell, styles.noBorderTop, { width: '15%', alignItems: 'center' }]}>
              <Text style={styles.redText}>{report.tanggalInspeksi || tgl}</Text>
            </View>

            {/* Signature 3 */}
            <View style={[styles.cell, styles.noBorderTop, { width: '20%', padding: 0 }]}>
              <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 4, alignItems: 'center' }}><Text>Penanggung Jawab</Text></View>
              <View style={{ flex: 1, padding: 4, justifyContent: 'space-between' }}>
                <Text style={[styles.redText, { fontSize: 8 }]}>Spv Maintenance</Text>
                <View style={{ alignItems: 'flex-start', marginTop: 4 }}>
                  {report.signatureSpvMaintenance_image ? <Image src={report.signatureSpvMaintenance_image} style={{ height: 40, marginBottom: 4 }} /> : <View style={{ height: 44 }} />}
                  <Text style={[styles.redText, styles.underline]}>{report.signatureSpvMaintenance || 'Kiamnasmeithson'}</Text>
                  <Text style={[styles.redText, styles.bold, { marginTop: 2 }]}>Tgl: {report.signatureSpvMaintenance_image ? formatSigDate(report.signatureSpvMaintenance_timestamp) : '-'}</Text>
                </View>
              </View>
            </View>

            {/* Signature 4 */}
            <View style={[styles.cell, styles.noBorderTop, { width: '20%', padding: 0 }]}>
              <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 4, alignItems: 'center' }}><Text>Disetujui oleh,</Text></View>
              <View style={{ flex: 1, padding: 4, justifyContent: 'space-between' }}>
                <Text style={[styles.redText, { fontSize: 8 }]}>Supervisor RSD</Text>
                <View style={{ alignItems: 'flex-start', marginTop: 4 }}>
                  {report.signatureSpvRsd2_image ? <Image src={report.signatureSpvRsd2_image} style={{ height: 40, marginBottom: 4 }} /> : <View style={{ height: 44 }} />}
                  <Text style={[styles.redText, styles.underline]}>{report.signatureSpvRsd2 || 'Urip Widodo'}</Text>
                  <Text style={[styles.redText, styles.bold, { marginTop: 2 }]}>Tgl: {report.signatureSpvRsd2_image ? formatSigDate(report.signatureSpvRsd2_timestamp) : '-'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* TABEL ANALISA & PERBAIKAN */}
        <View style={[styles.table, styles.noBorderTop]}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '5%', alignItems: 'center' }]}><Text>No</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '25%', alignItems: 'center' }]}><Text>Analisa Penyebab Awal Kerusakan</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '40%', alignItems: 'center' }]}><Text>Tindakan Perbaikan</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '15%', alignItems: 'center' }]}><Text>PIC</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '15%', alignItems: 'center' }]}><Text>Waktu Pelaksanaan</Text></View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, { width: '5%', minHeight: 30, justifyContent: 'flex-start', alignItems: 'center' }]}><Text style={styles.redText}>1</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '25%', justifyContent: 'flex-start' }]}><Text style={styles.redText}>{report.analisaPenyebab}</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '40%', justifyContent: 'flex-start' }]}><Text style={styles.redText}>{report.tindakanPerbaikan || report.pelaksanaanPerbaikan}</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '15%', justifyContent: 'flex-start', alignItems: 'center' }]}><Text style={styles.redText}>{report.pic || report.jabatanTimPerbaikan}</Text></View>
            <View style={[styles.cell, styles.noBorderTop, { width: '15%', justifyContent: 'flex-start', alignItems: 'center' }]}><Text style={styles.redText}>{report.waktuPelaksanaan || report.tanggalTindakLanjut}</Text></View>
          </View>
        </View>

        {/* DOKUMEN REVISI */}
        <View style={[styles.table, styles.noBorderTop, styles.doubleBorderBottom]}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.noBorderTop, styles.noBorderBottom, { width: '70%', justifyContent: 'flex-start' }]}>
              <Text>Dokumen yang direvisi (jika ada) :</Text>

              {/* Fake Grid */}
              <View style={{ flexDirection: 'row', marginTop: 8, paddingLeft: 16 }}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={styles.checkBoxLarge}>{report.dokumenDirevisi === 'Pedoman/Manual' && <CheckMark />}</View>
                    <Text style={{ marginLeft: 4 }}>Pedoman/Manual</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.checkBoxLarge}>{report.dokumenDirevisi === 'TKO' && <CheckMark />}</View>
                    <Text style={{ marginLeft: 4 }}>TKO</Text>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                    <View style={styles.checkBoxLarge}>{report.dokumenDirevisi === 'TKI' && <CheckMark />}</View>
                    <Text style={{ marginLeft: 4 }}>TKI</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.checkBoxLarge}>{report.dokumenDirevisi === 'TKPA' && <CheckMark />}</View>
                    <Text style={{ marginLeft: 4 }}>TKPA</Text>
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={styles.checkBoxLarge}>{report.dokumenDirevisi === 'Formulir' && <CheckMark />}</View>
                    <Text style={{ marginLeft: 4 }}>Formulir</Text>
                  </View>
                </View>
              </View>

            </View>
            <View style={[styles.cell, styles.noBorderTop, styles.noBorderBottom, { width: '30%', alignItems: 'center', justifyContent: 'flex-start' }]}>
              <Text>Target Waktu Verifikasi</Text>
              <Text style={[styles.redText, styles.bold, { marginTop: 8 }]}>{report.targetWaktuVerifikasi}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionDivider}>Di isi oleh pemohon/auditor</Text>

        {/* STATUS & AFTM */}
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '25%', justifyContent: 'flex-start' }]}>
              <Text style={{ marginBottom: 8 }}>Status</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, paddingLeft: 12 }}>
                <View style={styles.checkBoxLarge}>{report.status === 'Close' && <CheckMark />}</View>
                <Text style={{ marginLeft: 4 }}>Close</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 12 }}>
                <View style={styles.checkBoxLarge}>{report.status === 'Open' && <CheckMark />}</View>
                <Text style={{ marginLeft: 4 }}>Perlu Follow up</Text>
              </View>
              <Text style={{ marginTop: 16 }}>Catatan : <Text style={styles.redText}>{report.catatan}</Text></Text>
            </View>

            <View style={[styles.cell, { width: '55%', justifyContent: 'flex-start', paddingTop: 20 }]}>
              <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                <View style={{ width: 100 }}><Text>Tanggal</Text></View>
                <Text>: <Text style={styles.redText}>{report.tanggalVerifikasi || report.waktuPelaksanaan || report.tanggalTindakLanjut}</Text></Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 100 }}><Text>Target Verifikasi Selanjutnya</Text></View>
                <Text>: <Text style={styles.redText}>{report.targetVerifikasiSelanjutnya}</Text></Text>
              </View>
            </View>

            {/* Approval AFTM */}
            <View style={[styles.cell, { width: '20%', padding: 0, minHeight: 110 }]}>
              <View style={{ borderBottomWidth: 1, borderColor: '#000', padding: 4, alignItems: 'center' }}><Text>Approval AFTM</Text></View>
              <View style={{ flex: 1, padding: 4, justifyContent: 'flex-end' }}>
                <View style={{ alignItems: 'flex-start', marginTop: 4 }}>
                  {report.signatureAftm_image ? <Image src={report.signatureAftm_image} style={{ height: 40, marginBottom: 4 }} /> : <View style={{ height: 44 }} />}
                  <Text style={[styles.redText, styles.underline]}>{report.signatureAftm || 'Wahyudi'}</Text>
                  <Text style={[styles.redText, styles.bold, { marginTop: 2 }]}>Tgl: {report.signatureAftm_image ? formatSigDate(report.signatureAftm_timestamp) : '-'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </Page>

      {/* Lampiran Gambar Tindak Lanjut jika ada */}
      {report.konversiGambar && (
        <Page size="A4" style={styles.page}>
          <Text style={[styles.bold, styles.underline, { fontSize: 12, marginBottom: 12 }]}>LAMPIRAN: DOKUMENTASI HASIL PERBAIKAN</Text>
          <View style={{ borderWidth: 1, borderColor: '#000', padding: 8, alignItems: 'center' }}>
            <Image src={getImageUrl(`/api/image-proxy?url=${encodeURIComponent(report.konversiGambar)}`)} style={{ maxHeight: 700, objectFit: 'contain' }} />
          </View>
          <Text style={[styles.bold, { marginTop: 8 }]}>Dilampirkan pada tanggal: {report.tanggalTindakLanjut}</Text>
        </Page>
      )}

    </Document>
  );
}
