'use client';

import { useState, useRef } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, type CollectionReference, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import type { DamageReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Plus, Search, Printer, Edit, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PrintDamageReport from './PrintDamageReport';
import { sendWhatsAppNotification } from '@/app/actions/fonnte';

export default function LaporanKerusakanClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DamageReport | null>(null);
  
  // Print state
  const [printReport, setPrintReport] = useState<DamageReport | null>(null);

  // Form states - Create
  const [areaKerusakan, setAreaKerusakan] = useState('');
  const [jenisKerusakan, setJenisKerusakan] = useState('');
  const [sumberKetidaksesuaian, setSumberKetidaksesuaian] = useState('');
  const [priority, setPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');
  const [fotoKerusakan, setFotoKerusakan] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states - Edit (Teknik)
  const [analisaPenyebab, setAnalisaPenyebab] = useState('');
  const [tanggalTindakLanjut, setTanggalTindakLanjut] = useState('');
  const [pelaksanaanPerbaikan, setPelaksanaanPerbaikan] = useState('');
  const [jabatanTimPerbaikan, setJabatanTimPerbaikan] = useState('');
  const [status, setStatus] = useState<'Open' | 'Close' | 'On Progres'>('Open');
  const [kebutuhanMaterial, setKebutuhanMaterial] = useState('');
  const [perbaikanSementara, setPerbaikanSementara] = useState('');
  const [statusPengadaan, setStatusPengadaan] = useState('');
  const [dokumenDirevisi, setDokumenDirevisi] = useState('');
  const [konversiGambar, setKonversiGambar] = useState<File | null>(null);

  const reportsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'damage_reports') as CollectionReference<DamageReport>,
      orderBy('timestamp', 'desc')
    );
  }, [firestore]);

  const { data: reports, loading } = useCollection<DamageReport>(reportsQuery);

  const isAdminOrTeknik = user?.role === 'admin' || user?.role === 'teknik';

  const generateNoLaporan = () => {
    const date = new Date();
    const year = date.getFullYear();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PTPP-${random}/PNDB240000/${year}`;
  };

  const uploadPhoto = async (file: File, path: string) => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !user) return;
    
    setIsSubmitting(true);
    try {
      let fotoUrl = '';
      if (fotoKerusakan) {
        fotoUrl = await uploadPhoto(fotoKerusakan, `damage_reports/pelapor_${Date.now()}_${fotoKerusakan.name}`);
      }

      const noLaporan = generateNoLaporan();
      const now = new Date();

      const newReport: Omit<DamageReport, 'id'> = {
        noLaporan,
        timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
        namaPelapor: user.displayName || user.email || 'Unknown',
        jabatanPelapor: user.role?.toUpperCase() || 'KARYAWAN',
        areaKerusakan,
        jenisKerusakan,
        fotoKerusakan: fotoUrl,
        sumberKetidaksesuaian,
        priority,
        status: 'Open',
        timestamp_obj: serverTimestamp() as any, // For sorting, using any to bypass type check for now
      };

      await addDoc(collection(firestore, 'damage_reports'), newReport);
      
      // Kirim Notifikasi WhatsApp secara asynchronous tanpa memblokir UI
      const waMessage = `🚨 *LAPORAN KERUSAKAN BARU* 🚨\n\n` +
                        `*No PTPP:* ${noLaporan}\n` +
                        `*Pelapor:* ${newReport.namaPelapor} (${newReport.jabatanPelapor})\n` +
                        `*Prioritas:* ${priority}\n` +
                        `*Area:* ${areaKerusakan}\n` +
                        `*Kendala:* ${jenisKerusakan}\n\n` +
                        `_Silakan segera cek aplikasi untuk tindak lanjut._`;
      
      sendWhatsAppNotification(waMessage).catch(err => console.error('Gagal memanggil Server Action WA:', err));

      toast({
        title: 'Sukses',
        description: 'Laporan berhasil dikirim',
      });
      setIsCreateOpen(false);
      resetCreateForm();
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengirim laporan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (report: DamageReport) => {
    setSelectedReport(report);
    setAnalisaPenyebab(report.analisaPenyebab || '');
    setTanggalTindakLanjut(report.tanggalTindakLanjut || '');
    setPelaksanaanPerbaikan(report.pelaksanaanPerbaikan || '');
    setJabatanTimPerbaikan(report.jabatanTimPerbaikan || '');
    setStatus(report.status || 'Open');
    setKebutuhanMaterial(report.kebutuhanMaterial || '');
    setPerbaikanSementara(report.perbaikanSementara || '');
    setStatusPengadaan(report.statusPengadaan || '');
    setDokumenDirevisi(report.dokumenDirevisi || '');
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !selectedReport?.id) return;

    setIsSubmitting(true);
    try {
      let fotoTindakLanjutUrl = selectedReport.konversiGambar;
      if (konversiGambar) {
        fotoTindakLanjutUrl = await uploadPhoto(konversiGambar, `damage_reports/teknik_${Date.now()}_${konversiGambar.name}`);
      }

      const reportRef = doc(firestore, 'damage_reports', selectedReport.id);
      
      await updateDoc(reportRef, {
        analisaPenyebab,
        tanggalTindakLanjut,
        pelaksanaanPerbaikan,
        jabatanTimPerbaikan,
        status,
        kebutuhanMaterial,
        perbaikanSementara,
        statusPengadaan,
        dokumenDirevisi,
        konversiGambar: fotoTindakLanjutUrl
      });

      toast({
        title: 'Sukses',
        description: 'Laporan berhasil diperbarui',
      });
      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: 'Error',
        description: 'Gagal memperbarui laporan',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setAreaKerusakan('');
    setJenisKerusakan('');
    setSumberKetidaksesuaian('');
    setPriority('Sedang');
    setFotoKerusakan(null);
  };

  const filteredReports = reports?.filter(report => 
    report.noLaporan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.areaKerusakan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    report.namaPelapor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Cari no laporan, area, atau nama pelapor..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto flex items-center gap-2">
              <Plus className="h-4 w-4" /> Buat Laporan Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Laporan Kerusakan Sarpras</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
              
              <div className="space-y-2">
                <Label>Area Kerusakan (Lokasi)</Label>
                <Input required value={areaKerusakan} onChange={e => setAreaKerusakan(e.target.value)} placeholder="Contoh: Kantor, Refueller DEO 10, Tangki Timbun 1..." />
              </div>

              <div className="space-y-2">
                <Label>Jenis Kerusakan (Deskripsi Lengkap)</Label>
                <Textarea required value={jenisKerusakan} onChange={e => setJenisKerusakan(e.target.value)} placeholder="Jelaskan secara lengkap jenis kerusakan..." rows={3} />
              </div>

              <div className="space-y-2">
                <Label>Sumber Ketidaksesuaian</Label>
                <Select required value={sumberKetidaksesuaian} onValueChange={setSumberKetidaksesuaian}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih sumber..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Keluhan">Keluhan</SelectItem>
                    <SelectItem value="Audit">Audit</SelectItem>
                    <SelectItem value="Tinjauan Manajemen">Tinjauan Manajemen</SelectItem>
                    <SelectItem value="Survey Lapangan">Survey Lapangan</SelectItem>
                    <SelectItem value="Usulan/Saran">Usulan / Saran</SelectItem>
                    <SelectItem value="Lain-lain">Lain-lain</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tingkat Prioritas</Label>
                <Select required value={priority} onValueChange={(v: any) => setPriority(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih prioritas..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rendah">Rendah (Aman ditunda)</SelectItem>
                    <SelectItem value="Sedang">Sedang (Perlu segera)</SelectItem>
                    <SelectItem value="Tinggi">Tinggi (Kritis / Operasional terhenti)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Foto Kerusakan (Opsional tapi disarankan)</Label>
                <Input type="file" accept="image/*" capture="environment" onChange={e => setFotoKerusakan(e.target.files?.[0] || null)} />
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">No Laporan</th>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Pelapor</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Prioritas</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-8">Memuat data...</td></tr>
                ) : filteredReports?.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-8 text-gray-500">Belum ada laporan kerusakan.</td></tr>
                ) : (
                  filteredReports?.map((report) => (
                    <tr key={report.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{report.noLaporan}</td>
                      <td className="px-4 py-3 text-slate-500">{report.timestamp}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{report.namaPelapor}</p>
                        <p className="text-xs text-slate-500">{report.jabatanPelapor}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate" title={report.areaKerusakan}>{report.areaKerusakan}</td>
                      <td className="px-4 py-3">
                        <Badge variant={report.priority === 'Tinggi' ? 'destructive' : report.priority === 'Sedang' ? 'default' : 'secondary'}>
                          {report.priority || 'Sedang'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {report.status === 'Open' ? (
                          <span className="flex items-center text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full w-fit">
                            <AlertCircle className="w-3 h-3 mr-1" /> OPEN
                          </span>
                        ) : report.status === 'On Progres' ? (
                          <span className="flex items-center text-yellow-600 font-medium text-xs bg-yellow-50 px-2 py-1 rounded-full w-fit">
                            <AlertCircle className="w-3 h-3 mr-1" /> ON PROGRES
                          </span>
                        ) : (
                          <span className="flex items-center text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-full w-fit">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> CLOSE
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => setPrintReport(report)}>
                            <Printer className="w-4 h-4 mr-1" /> Print PTPP
                          </Button>
                          {isAdminOrTeknik && (
                            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openEditModal(report)}>
                              <Edit className="w-4 h-4 mr-1" /> Tindak Lanjut
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal untuk Admin/Teknik */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tindak Lanjut Laporan - {selectedReport?.noLaporan}</DialogTitle>
          </DialogHeader>
          <div className="bg-slate-50 p-4 rounded-md border text-sm mb-4">
            <p><strong>Keluhan:</strong> {selectedReport?.jenisKerusakan}</p>
            <p><strong>Area:</strong> {selectedReport?.areaKerusakan}</p>
          </div>
          
          <form onSubmit={handleEditSubmit} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Analisa Penyebab Kerusakan</Label>
                <Textarea value={analisaPenyebab} onChange={e => setAnalisaPenyebab(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Pelaksanaan Perbaikan / Tindakan</Label>
                <Textarea value={pelaksanaanPerbaikan} onChange={e => setPelaksanaanPerbaikan(e.target.value)} rows={3} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Tindak Lanjut</Label>
                <Input type="date" value={tanggalTindakLanjut} onChange={e => setTanggalTindakLanjut(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Perbaikan / Tindakan Sementara (Jika ada)</Label>
                <Input value={perbaikanSementara} onChange={e => setPerbaikanSementara(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="space-y-2">
                <Label>Kebutuhan Material</Label>
                <Input value={kebutuhanMaterial} onChange={e => setKebutuhanMaterial(e.target.value)} placeholder="Contoh: Lampu, Cat..." />
              </div>
              <div className="space-y-2">
                <Label>Status Pengadaan</Label>
                <Select value={statusPengadaan} onValueChange={setStatusPengadaan}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status pengadaan..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pengadaan Material">Pengadaan Material</SelectItem>
                    <SelectItem value="Pengadaan Jasa">Pengadaan Jasa</SelectItem>
                    <SelectItem value="Swakelola">Swakelola</SelectItem>
                    <SelectItem value="E-Purchasing">E-Purchasing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status Laporan</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="On Progres">On Progres</SelectItem>
                    <SelectItem value="Close">Close</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Dokumen yang Direvisi (Jika ada)</Label>
                <Select value={dokumenDirevisi} onValueChange={setDokumenDirevisi}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih dokumen yang direvisi..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tidak Ada">Tidak Ada</SelectItem>
                    <SelectItem value="Pedoman/Manual">Pedoman / Manual</SelectItem>
                    <SelectItem value="TKO">TKO</SelectItem>
                    <SelectItem value="TKI">TKI</SelectItem>
                    <SelectItem value="TKPA">TKPA</SelectItem>
                    <SelectItem value="Formulir">Formulir</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tim Perbaikan (Jabatan)</Label>
                <Input value={jabatanTimPerbaikan} onChange={e => setJabatanTimPerbaikan(e.target.value)} placeholder="Contoh: Tim Teknik" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Foto Hasil Perbaikan (Opsional)</Label>
              <Input type="file" accept="image/*" capture="environment" onChange={e => setKonversiGambar(e.target.files?.[0] || null)} />
              {selectedReport?.konversiGambar && (
                <p className="text-xs text-blue-600 mt-1">Foto perbaikan sudah ada. Upload baru untuk mengganti.</p>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600">
                {isSubmitting ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden print component */}
      <div className="hidden">
        {printReport && (
          <PrintDamageReport 
            report={printReport} 
            onClose={() => setPrintReport(null)} 
            shouldPrint={true}
          />
        )}
      </div>

    </div>
  );
}
