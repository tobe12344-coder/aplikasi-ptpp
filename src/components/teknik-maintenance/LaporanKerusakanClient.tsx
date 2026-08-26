'use client';

import { useState, useRef, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, addDoc, updateDoc, doc, deleteDoc, serverTimestamp, type CollectionReference } from 'firebase/firestore';
import { generateSequentialNoLaporan } from '@/lib/generateNoLaporan';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SignaturePadModal } from '@/components/common/SignaturePadModal';
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
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectAction, setRejectAction] = useState<'part1' | 'part2_rsd' | 'part3' | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  
  // Print state
  const [printReport, setPrintReport] = useState<DamageReport | null>(null);

  // Form states - Create
  const [areaKerusakan, setAreaKerusakan] = useState('');
  const [jenisKerusakan, setJenisKerusakan] = useState('');
  const [sumberKetidaksesuaian, setSumberKetidaksesuaian] = useState('');
  const [kategoriPTPP, setKategoriPTPP] = useState<'Perbaikan' | 'Perawatan'>('Perbaikan');
  const [persyaratanDilanggar, setPersyaratanDilanggar] = useState('');
  const [batasWaktuReply, setBatasWaktuReply] = useState('');
  const [priority, setPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');
  const [fotoKerusakan, setFotoKerusakan] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const today = new Date();
    let daysToAdd = 3; // Sedang
    if (priority === 'Rendah') daysToAdd = 7;
    if (priority === 'Tinggi') daysToAdd = 1;
    
    today.setDate(today.getDate() + daysToAdd);
    setBatasWaktuReply(format(today, 'yyyy-MM-dd'));
  }, [priority]);

  // Form states - Edit (Teknik & Approval)
  const [analisaPenyebab, setAnalisaPenyebab] = useState('');
  const [perbaikanSementara, setPerbaikanSementara] = useState('');
  const [tanggalInspeksi, setTanggalInspeksi] = useState('');
  const [tindakanPerbaikan, setTindakanPerbaikan] = useState('');
  const [pic, setPic] = useState('');
  const [waktuPelaksanaan, setWaktuPelaksanaan] = useState('');
  const [dokumenDirevisi, setDokumenDirevisi] = useState('');
  const [targetWaktuVerifikasi, setTargetWaktuVerifikasi] = useState('');
  
  // Part 3
  const [status, setStatus] = useState<'Open' | 'Close' | 'On Progres' | 'Perlu Follow up' | 'REJECTED'>('Open');
  const [tanggalVerifikasi, setTanggalVerifikasi] = useState('');
  const [targetVerifikasiSelanjutnya, setTargetVerifikasiSelanjutnya] = useState('');
  const [catatan, setCatatan] = useState('');
  const [konversiGambar, setKonversiGambar] = useState<File | null>(null);

  // Legacy fields
  const [tanggalTindakLanjut, setTanggalTindakLanjut] = useState('');
  const [pelaksanaanPerbaikan, setPelaksanaanPerbaikan] = useState('');
  const [jabatanTimPerbaikan, setJabatanTimPerbaikan] = useState('');
  const [kebutuhanMaterial, setKebutuhanMaterial] = useState('');
  const [statusPengadaan, setStatusPengadaan] = useState('');

  const reportsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'damage_reports') as CollectionReference<DamageReport>,
      orderBy('timestamp', 'desc')
    );
  }, [firestore]);

  const { data: reports, loading } = useCollection<DamageReport>(reportsQuery as any);

  const isAdminOrTeknik = user?.role === 'admin' || user?.role === 'teknik';



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

      const noLaporan = await generateSequentialNoLaporan(firestore);
      const now = new Date();

      const newReport: Omit<DamageReport, 'id'> = {
        noLaporan,
        timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
        namaPelapor: user.displayName || user.email || 'Unknown',
        jabatanPelapor: user.role?.toUpperCase() || 'KARYAWAN',
        kepadaFungsi: 'Maintenance',
        areaKerusakan,
        jenisKerusakan,
        fotoKerusakan: fotoUrl,
        sumberKetidaksesuaian,
        kategoriPTPP,
        persyaratanDilanggar,
        batasWaktuReply,
        signaturePemohon: user.displayName || user.email || 'Unknown',
        priority,
        status: 'Open',
        workflowState: 'WAITING_SPV_RSD_1',
        timestamp_obj: serverTimestamp() as any, // For sorting, using any to bypass type check for now
      };

      await addDoc(collection(firestore, 'damage_reports'), newReport);
      
      // Kirim Notifikasi WhatsApp secara asynchronous tanpa memblokir UI
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aplikasi-ptpp.com';
      const waMessage = `Halo Urip Widodo, terdapat 1 laporan PTPP baru (No: ${noLaporan}) dari ${newReport.namaPelapor} yang membutuhkan review Anda.\n\n` +
                        `*Prioritas:* ${priority}\n` +
                        `*Area:* ${areaKerusakan}\n` +
                        `*Kendala:* ${jenisKerusakan}\n\n` +
                        `Silakan klik link berikut untuk login dan melakukan review:\n${appUrl}`;
      
      sendWhatsAppNotification(waMessage, undefined, '085729804292').catch(err => console.error('Gagal memanggil Server Action WA:', err));

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
    // Part 2
    setAnalisaPenyebab(report.analisaPenyebab || '');
    setPerbaikanSementara(report.perbaikanSementara || '');
    setTanggalInspeksi(report.tanggalInspeksi || '');
    setTindakanPerbaikan(report.tindakanPerbaikan || report.pelaksanaanPerbaikan || '');
    setPic(report.pic || report.jabatanTimPerbaikan || '');
    setWaktuPelaksanaan(report.waktuPelaksanaan || report.tanggalTindakLanjut || '');
    setDokumenDirevisi(report.dokumenDirevisi || '');
    setTargetWaktuVerifikasi(report.targetWaktuVerifikasi || '');
    
    // Part 3
    setStatus(report.status || 'Open');
    setTanggalVerifikasi(report.tanggalVerifikasi || '');
    setTargetVerifikasiSelanjutnya(report.targetVerifikasiSelanjutnya || '');
    setCatatan(report.catatan || '');
    
    // Legacy
    setTanggalTindakLanjut(report.tanggalTindakLanjut || '');
    setPelaksanaanPerbaikan(report.pelaksanaanPerbaikan || '');
    setJabatanTimPerbaikan(report.jabatanTimPerbaikan || '');
    setKebutuhanMaterial(report.kebutuhanMaterial || '');
    setStatusPengadaan(report.statusPengadaan || '');
    
    setIsEditOpen(true);
  };

  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [signatureAction, setSignatureAction] = useState<'part1' | 'part2' | 'part2_rsd' | 'part3' | null>(null);

  const updateReportState = async (updates: Partial<DamageReport>, successMsg: string) => {
    if (!firestore || !selectedReport?.id) return;
    setIsSubmitting(true);
    try {
      const reportRef = doc(firestore, 'damage_reports', selectedReport.id);
      await updateDoc(reportRef, updates);
      toast({ title: 'Sukses', description: successMsg });
      setIsEditOpen(false);
    } catch (error) {
      console.error('Error updating report:', error);
      toast({ title: 'Error', description: 'Gagal memperbarui laporan', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSignatureModal = (action: 'part1' | 'part2' | 'part2_rsd' | 'part3') => {
    setSignatureAction(action);
    setSignatureModalOpen(true);
  };

  const handleSignatureSave = async (dataUrl: string) => {
    setSignatureModalOpen(false);
    
    if (signatureAction === 'part1') {
      await updateReportState({
        workflowState: 'WAITING_MAINTENANCE',
        signatureSpvRsd1: user?.displayName || user?.email || 'Unknown',
        signatureSpvRsd1_timestamp: serverTimestamp() as any,
        signatureSpvRsd1_image: dataUrl,
        tanggalInspeksi: format(new Date(), 'yyyy-MM-dd'),
      }, 'Bagian 1 berhasil disetujui (SPV RSD). Lanjut ke Teknik.');
    } else if (signatureAction === 'part2') {
      await savePart2Data(dataUrl);
    } else if (signatureAction === 'part2_rsd') {
      await updateReportState({
        workflowState: 'WAITING_AFTM',
        signatureSpvRsd2: user?.displayName || user?.email || 'Unknown',
        signatureSpvRsd2_timestamp: serverTimestamp() as any,
        signatureSpvRsd2_image: dataUrl,
      }, 'Tindak lanjut perbaikan disetujui (SPV RSD). Lanjut ke AFTM.');

      // Kirim Notifikasi ke AFTM (Wahyudi) setelah SPV RSD setuju
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aplikasi-ptpp.com';
      const waMessage = `Halo Wahyudi, laporan PTPP No: ${selectedReport?.noLaporan} telah disetujui oleh Supervisor RSD dan kini membutuhkan Approval AFTM dari Anda untuk menutup (close) laporan.\n\n` +
                        `Silakan klik link berikut untuk login dan melakukan approval:\n${appUrl}`;
      
      sendWhatsAppNotification(waMessage, undefined, '081380887280').catch(err => console.error('Gagal memanggil Server Action WA:', err));
    } else if (signatureAction === 'part3') {
      await updateReportState({
        status, 
        tanggalVerifikasi: format(new Date(), 'yyyy-MM-dd'),
        targetVerifikasiSelanjutnya,
        catatan,
        workflowState: 'COMPLETED',
        signatureAftm: user?.displayName || user?.email || 'Unknown',
        signatureAftm_timestamp: serverTimestamp() as any,
        signatureAftm_image: dataUrl,
      }, 'Laporan PTPP selesai dan ditutup (AFTM).');
    }
  };

  const openRejectModal = (action: 'part1' | 'part2_rsd' | 'part3') => {
    setRejectAction(action);
    setRejectNote('');
    setIsRejectOpen(true);
  };

  const handleRejectSave = async () => {
    if (!firestore || !selectedReport?.id) return;
    setIsSubmitting(true);
    try {
      let updates: Partial<DamageReport> = {};
      let successMsg = '';
      
      if (rejectAction === 'part1') {
        updates = {
          status: 'REJECTED',
          workflowState: 'REJECTED',
          rejectNoteRSD1: rejectNote
        };
        successMsg = 'Laporan telah ditolak.';
      } else if (rejectAction === 'part2_rsd') {
        updates = {
          workflowState: 'WAITING_MAINTENANCE',
          rejectNoteRSD2: rejectNote,
          signatureSpvMaintenance: '',
          signatureSpvMaintenance_image: '',
          signatureSpvMaintenance_timestamp: null,
        };
        successMsg = 'Laporan dikembalikan ke SPV Maintenance untuk direvisi.';
      } else if (rejectAction === 'part3') {
        updates = {
          workflowState: 'WAITING_MAINTENANCE',
          rejectNoteAFTM: rejectNote,
          signatureSpvMaintenance: '',
          signatureSpvMaintenance_image: '',
          signatureSpvMaintenance_timestamp: null,
          signatureSpvRsd2: '',
          signatureSpvRsd2_image: '',
          signatureSpvRsd2_timestamp: null,
        };
        successMsg = 'Laporan dikembalikan ke SPV Maintenance dengan catatan AFTM.';
      }
      
      const reportRef = doc(firestore, 'damage_reports', selectedReport.id);
      await updateDoc(reportRef, updates);
      toast({ title: 'Sukses', description: successMsg });
      setIsRejectOpen(false);
      setIsEditOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Gagal menolak laporan', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const savePart2Data = async (signatureDataUrl: string) => {
    if (!firestore || !selectedReport?.id) return;
    setIsSubmitting(true);
    try {
      let fotoUrl = selectedReport.konversiGambar || '';
      if (konversiGambar) {
        fotoUrl = await uploadPhoto(konversiGambar, `damage_reports/teknik_${Date.now()}_${konversiGambar.name}`);
      }
      const updates = {
        perbaikanSementara,
        tanggalInspeksi,
        analisaPenyebab,
        tindakanPerbaikan,
        pic,
        waktuPelaksanaan,
        dokumenDirevisi,
        targetWaktuVerifikasi,
        konversiGambar: fotoUrl,
        workflowState: 'WAITING_SPV_RSD_2',
        signatureSpvMaintenance: user?.displayName || user?.email || 'Unknown',
        signatureSpvMaintenance_timestamp: serverTimestamp() as any,
        signatureSpvMaintenance_image: signatureDataUrl,
      } as Partial<DamageReport>;
      
      const reportRef = doc(firestore, 'damage_reports', selectedReport.id);
      await updateDoc(reportRef, updates);
      
      // Kirim Notifikasi ke SPV RSD (Urip Widodo) bahwa SPV Maintenance telah merespon
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://aplikasi-ptpp.com';
      const waMessage = `Halo Urip Widodo, laporan PTPP No: ${selectedReport.noLaporan} telah ditindaklanjuti oleh tim Maintenance dan membutuhkan tanda tangan / persetujuan Anda.\n\n` +
                        `*Perbaikan:* ${tindakanPerbaikan}\n` +
                        `*PIC:* ${pic}\n\n` +
                        `Silakan klik link berikut untuk login dan menyetujui laporan:\n${appUrl}`;
      
      sendWhatsAppNotification(waMessage, undefined, '085729804292').catch(err => console.error('Gagal memanggil Server Action WA:', err));

      toast({ title: 'Sukses', description: 'Tindak lanjut disimpan dan ditandatangani.' });
      setIsEditOpen(false);
    } catch (err) {
      toast({ title: 'Error', description: 'Gagal menyimpan tindak lanjut.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetCreateForm = () => {
    setAreaKerusakan('');
    setJenisKerusakan('');
    setSumberKetidaksesuaian('');
    setKategoriPTPP('Perbaikan');
    setPersyaratanDilanggar('');
    setBatasWaktuReply('');
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kategori PTPP</Label>
                  <Select required value={kategoriPTPP} onValueChange={(v: any) => setKategoriPTPP(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Perbaikan">Perbaikan</SelectItem>
                      <SelectItem value="Perawatan">Perawatan</SelectItem>
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Persyaratan yang Dilanggar (Opsional)</Label>
                  <Input 
                    value={persyaratanDilanggar} 
                    onChange={e => setPersyaratanDilanggar(e.target.value)} 
                    placeholder="Contoh: SOP No. 123..." 
                  />
                </div>

                <div className="space-y-2">
                  <Label>Batas Waktu Reply (Opsional)</Label>
                  <Input 
                    type="date"
                    value={batasWaktuReply} 
                    onChange={e => setBatasWaktuReply(e.target.value)} 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Foto Kerusakan (Opsional tapi disarankan)</Label>
                <Input type="file" accept="image/*" onChange={e => setFotoKerusakan(e.target.files?.[0] || null)} />
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
                        {report.workflowState === 'COMPLETED' ? (
                          <span className="flex items-center text-green-600 font-medium text-xs bg-green-50 px-2 py-1 rounded-full w-fit">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> SELESAI ({report.status})
                          </span>
                        ) : report.workflowState === 'REJECTED' ? (
                          <span className="flex items-center text-red-600 font-medium text-xs bg-red-50 px-2 py-1 rounded-full w-fit">
                            <AlertCircle className="w-3 h-3 mr-1" /> DITOLAK
                          </span>
                        ) : (
                          <span className="flex items-center text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded-full w-fit">
                            <AlertCircle className="w-3 h-3 mr-1" /> 
                            {report.workflowState === 'WAITING_SPV_RSD_1' ? 'Tinjauan SPV RSD' :
                             report.workflowState === 'WAITING_MAINTENANCE' ? 'Proses Teknik' :
                             report.workflowState === 'WAITING_SPV_RSD_2' ? 'Review Teknik (RSD)' :
                             report.workflowState === 'WAITING_AFTM' ? 'Approval AFTM' : 'DRAFT'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" className="h-8" onClick={() => setPrintReport(report)}>
                            <Printer className="w-4 h-4 mr-1" /> Print PTPP
                          </Button>
                          <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => openEditModal(report)}>
                            <Edit className="w-4 h-4 mr-1" /> Detail / Aksi
                          </Button>
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

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail PTPP - {selectedReport?.noLaporan}</DialogTitle>
          </DialogHeader>

          <Accordion type="single" collapsible defaultValue="part1" className="w-full">
            {/* Bagian 1 */}
            <AccordionItem value="part1">
              <AccordionTrigger className="text-lg font-semibold text-slate-800">Bagian 1: Di isi oleh Pemohon/Auditor</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-md border">
                  <div><strong>Dari / Fungsi:</strong> {selectedReport?.namaPelapor} / {selectedReport?.jabatanPelapor}</div>
                  <div><strong>Kepada / Fungsi:</strong> {selectedReport?.kepadaFungsi || 'Maintenance'}</div>
                  <div><strong>Kategori:</strong> {selectedReport?.kategoriPTPP || 'Perbaikan'}</div>
                  <div><strong>Sumber:</strong> {selectedReport?.sumberKetidaksesuaian || '-'}</div>
                  <div className="md:col-span-2"><strong>Ketidaksesuaian (Keluhan):</strong> {selectedReport?.jenisKerusakan}</div>
                  <div className="md:col-span-2"><strong>Persyaratan Dilanggar:</strong> {selectedReport?.persyaratanDilanggar || '-'}</div>
                  <div><strong>Batas Waktu Reply:</strong> {selectedReport?.batasWaktuReply || '-'}</div>
                  <div><strong>Prioritas:</strong> {selectedReport?.priority}</div>
                  {selectedReport?.fotoKerusakan && (
                    <div className="md:col-span-2 mt-2">
                      <p className="font-semibold text-sm mb-2 text-slate-700">Foto Kerusakan:</p>
                      <img 
                        src={selectedReport.fotoKerusakan} 
                        alt="Foto Kerusakan" 
                        className="max-h-64 rounded-md border shadow-sm object-contain" 
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-md border mt-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">Pemohon / Auditor</p>
                    {selectedReport?.signaturePemohon_image ? (
                      <div className="mt-1 flex flex-col items-start">
                        <img src={selectedReport.signaturePemohon_image} alt="Signature" className="h-12 object-contain border-b border-slate-200" />
                        <p className="font-semibold text-slate-900 mt-1">{selectedReport?.signaturePemohon || selectedReport?.namaPelapor}</p>
                      </div>
                    ) : (
                      <p className="font-semibold text-slate-900">{selectedReport?.signaturePemohon || selectedReport?.namaPelapor}</p>
                    )}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500 uppercase">Disetujui Oleh (Supervisor RSD)</p>
                    {selectedReport?.signatureSpvRsd1_image ? (
                      <div className="mt-1 flex flex-col items-start sm:items-end">
                        <img src={selectedReport.signatureSpvRsd1_image} alt="Signature" className="h-12 object-contain border-b border-slate-200" />
                        <p className="font-semibold text-green-600 text-sm mt-1">{selectedReport.signatureSpvRsd1}</p>
                      </div>
                    ) : selectedReport?.signatureSpvRsd1 ? (
                      <p className="font-semibold text-green-600">{selectedReport.signatureSpvRsd1}</p>
                    ) : (
                      (user?.role === 'spv_rsd' || user?.role === 'admin') && (selectedReport?.workflowState === 'WAITING_SPV_RSD_1' || !selectedReport?.workflowState) ? (
                        <div className="flex gap-2 mt-1 justify-end">
                          <Button onClick={() => openSignatureModal('part1')} disabled={isSubmitting} size="sm">Tanda Tangani Bagian 1</Button>
                          <Button onClick={() => openRejectModal('part1')} disabled={isSubmitting} size="sm" variant="destructive">Tolak Laporan</Button>
                        </div>
                      ) : (
                        <p className="text-yellow-600 italic text-sm mt-1">Menunggu Persetujuan</p>
                      )
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Bagian 2 */}
            <AccordionItem value="part2">
              <AccordionTrigger className="text-lg font-semibold text-slate-800">Bagian 2: Di isi oleh Penerima Laporan</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {(!selectedReport?.workflowState || selectedReport?.workflowState === 'WAITING_SPV_RSD_1' || selectedReport?.workflowState === 'DRAFT' || selectedReport?.workflowState === 'REJECTED') ? (
                  <div className="p-4 bg-slate-50 border rounded text-center text-slate-500">
                    Menunggu persetujuan Bagian 1 sebelum bisa diproses. (Atau laporan telah ditolak).
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedReport?.rejectNoteRSD1 && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                        <strong>Catatan Penolakan SPV RSD (Tahap 1):</strong> {selectedReport.rejectNoteRSD1}
                      </div>
                    )}
                    {selectedReport?.rejectNoteRSD2 && selectedReport.workflowState === 'WAITING_MAINTENANCE' && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                        <strong>Catatan Revisi dari SPV RSD (Tahap 2):</strong> {selectedReport.rejectNoteRSD2}
                      </div>
                    )}
                    {selectedReport?.rejectNoteAFTM && selectedReport.workflowState === 'WAITING_MAINTENANCE' && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                        <strong>Catatan Revisi dari AFTM:</strong> {selectedReport.rejectNoteAFTM}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Perbaikan / Tindakan Sementara</Label>
                        <Input value={perbaikanSementara} onChange={e => setPerbaikanSementara(e.target.value)} disabled={!!selectedReport.signatureSpvMaintenance} />
                      </div>
                      <div className="space-y-2">
                        <Label>Tanggal Inspeksi</Label>
                        <Input type="date" value={tanggalInspeksi} onChange={e => setTanggalInspeksi(e.target.value)} disabled={!!selectedReport.signatureSpvMaintenance} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Analisa Penyebab Kerusakan</Label>
                      <Textarea value={analisaPenyebab} onChange={e => setAnalisaPenyebab(e.target.value)} disabled={!!selectedReport.signatureSpvMaintenance} rows={2} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Tindakan Perbaikan</Label>
                        <Textarea value={tindakanPerbaikan} onChange={e => setTindakanPerbaikan(e.target.value)} disabled={!!selectedReport.signatureSpvMaintenance} rows={2} />
                      </div>
                      <div className="space-y-2">
                        <Label>PIC (Tim Teknik)</Label>
                        <Input value={pic} onChange={e => setPic(e.target.value)} disabled={!!selectedReport.signatureSpvMaintenance} />
                      </div>
                      <div className="space-y-2">
                        <Label>Target Waktu Pelaksanaan</Label>
                        <Input type="date" value={waktuPelaksanaan} onChange={e => setWaktuPelaksanaan(e.target.value)} disabled={!!selectedReport.signatureSpvMaintenance} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Dokumen yang Direvisi (Jika ada)</Label>
                        <Select value={dokumenDirevisi} onValueChange={setDokumenDirevisi} disabled={!!selectedReport.signatureSpvMaintenance}>
                          <SelectTrigger><SelectValue placeholder="Pilih dokumen..." /></SelectTrigger>
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
                        <Label>Target Waktu Verifikasi</Label>
                        <Input type="date" value={targetWaktuVerifikasi} onChange={e => setTargetWaktuVerifikasi(e.target.value)} disabled={!!selectedReport.signatureSpvMaintenance} />
                      </div>
                    </div>

                    {!selectedReport.signatureSpvMaintenance && (
                      <div className="space-y-2">
                        <Label>Foto Hasil Perbaikan (Opsional)</Label>
                        <Input type="file" accept="image/*" onChange={e => setKonversiGambar(e.target.files?.[0] || null)} />
                      </div>
                    )}
                    {selectedReport.konversiGambar && (
                      <div className="text-sm mt-2">
                        <p className="font-semibold text-slate-700 mb-2">Foto Hasil Perbaikan:</p>
                        <img 
                          src={selectedReport.konversiGambar} 
                          alt="Foto Hasil Perbaikan" 
                          className="max-h-64 rounded-md border shadow-sm object-contain" 
                        />
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-md border mt-4 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase">Penanggung Jawab (SPV Maintenance)</p>
                        {selectedReport?.signatureSpvMaintenance_image ? (
                          <div className="mt-1 flex flex-col items-start">
                            <img src={selectedReport.signatureSpvMaintenance_image} alt="Signature" className="h-12 object-contain border-b border-slate-200" />
                            <p className="font-semibold text-slate-900 text-sm mt-1">{selectedReport.signatureSpvMaintenance}</p>
                          </div>
                        ) : selectedReport?.signatureSpvMaintenance ? (
                          <p className="font-semibold text-slate-900">{selectedReport.signatureSpvMaintenance}</p>
                        ) : (
                          (user?.role === 'spv_maintenance' || user?.role === 'teknik' || user?.role === 'admin') ? (
                            <Button onClick={() => openSignatureModal('part2')} disabled={isSubmitting} size="sm" className="mt-1">Simpan & Tanda Tangani</Button>
                          ) : (
                            <p className="text-yellow-600 italic text-sm mt-1">Menunggu SPV Maintenance</p>
                          )
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-slate-500 uppercase">Disetujui Oleh (Supervisor RSD)</p>
                        {selectedReport?.signatureSpvRsd2_image ? (
                          <div className="mt-1 flex flex-col items-start sm:items-end">
                            <img src={selectedReport.signatureSpvRsd2_image} alt="Signature" className="h-12 object-contain border-b border-slate-200" />
                            <p className="font-semibold text-green-600 text-sm mt-1">{selectedReport.signatureSpvRsd2}</p>
                          </div>
                        ) : selectedReport?.signatureSpvRsd2 ? (
                          <p className="font-semibold text-green-600">{selectedReport.signatureSpvRsd2}</p>
                        ) : (
                          (user?.role === 'spv_rsd' || user?.role === 'admin') && selectedReport?.signatureSpvMaintenance ? (
                          <div className="flex flex-col sm:flex-row gap-2 mt-1 justify-end">
                            <Button onClick={() => openSignatureModal('part2_rsd')} disabled={isSubmitting} size="sm">Tanda Tangani Bagian 2</Button>
                            <Button onClick={() => openRejectModal('part2_rsd')} disabled={isSubmitting} size="sm" variant="destructive">Tolak (Revisi)</Button>
                          </div>
                        ) : (
                            <p className="text-yellow-600 italic text-sm mt-1">Menunggu Persetujuan</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Bagian 3 */}
            <AccordionItem value="part3">
              <AccordionTrigger className="text-lg font-semibold text-slate-800">Bagian 3: Verifikasi & Approval Akhir</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-4">
                {(selectedReport?.workflowState !== 'WAITING_AFTM' && selectedReport?.workflowState !== 'COMPLETED') ? (
                  <div className="p-4 bg-slate-50 border rounded text-center text-slate-500">
                    Menunggu persetujuan Bagian 2 selesai sebelum verifikasi akhir.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Status PTPP</Label>
                        <Select value={status} onValueChange={(v: any) => setStatus(v)} disabled={!!selectedReport.signatureAftm}>
                          <SelectTrigger><SelectValue placeholder="Pilih status..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Close">Close</SelectItem>
                            <SelectItem value="Perlu Follow up">Perlu Follow up</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {status === 'Perlu Follow up' && (
                        <div className="space-y-2">
                          <Label>Target Verifikasi Selanjutnya</Label>
                          <Input type="date" value={targetVerifikasiSelanjutnya} onChange={e => setTargetVerifikasiSelanjutnya(e.target.value)} disabled={!!selectedReport.signatureAftm} />
                        </div>
                      )}
                      <div className="space-y-2 md:col-span-2">
                        <Label>Catatan</Label>
                        <Textarea value={catatan} onChange={e => setCatatan(e.target.value)} disabled={!!selectedReport.signatureAftm} rows={2} />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end items-center bg-white p-4 rounded-md border mt-4">
                      <div className="text-right">
                        <p className="text-xs text-slate-500 uppercase">Approval AFTM</p>
                        {selectedReport?.signatureAftm_image ? (
                          <div className="mt-1 flex flex-col items-end">
                            <img src={selectedReport.signatureAftm_image} alt="Signature" className="h-12 object-contain border-b border-slate-200" />
                            <p className="font-semibold text-green-600 text-sm mt-1">{selectedReport.signatureAftm}</p>
                          </div>
                        ) : selectedReport?.signatureAftm ? (
                          <p className="font-semibold text-green-600">{selectedReport.signatureAftm}</p>
                        ) : (
                          (user?.role === 'aftm' || user?.role === 'admin') ? (
                          <div className="flex flex-col sm:flex-row gap-2 mt-1 justify-end">
                            <Button onClick={() => openSignatureModal('part3')} disabled={isSubmitting} size="sm">Tanda Tangani & Tutup PTPP</Button>
                            <Button onClick={() => openRejectModal('part3')} disabled={isSubmitting} size="sm" variant="destructive">Tolak (Revisi)</Button>
                          </div>
                        ) : (
                            <p className="text-yellow-600 italic text-sm mt-1">Menunggu AFTM</p>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </DialogContent>
      </Dialog>

      {printReport && (
        <PrintDamageReport 
          report={printReport} 
          onClose={() => setPrintReport(null)} 
          shouldPrint={true}
        />
      )}
      {/* Signature Modal */}
      <SignaturePadModal 
        isOpen={signatureModalOpen}
        onClose={() => setSignatureModalOpen(false)}
        onSave={handleSignatureSave}
        title={
          signatureAction === 'part1' ? 'Tanda Tangan SPV RSD (Bagian 1)' :
          signatureAction === 'part2' ? 'Tanda Tangan SPV Maintenance' :
          signatureAction === 'part2_rsd' ? 'Tanda Tangan SPV RSD (Bagian 2)' :
          'Tanda Tangan AFTM (Approval Akhir)'
        }
      />
      {/* Reject Modal */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {rejectAction === 'part1' ? 'Tolak Laporan (Tahap 1)' :
               rejectAction === 'part2_rsd' ? 'Tolak & Kembalikan ke Maintenance (Tahap 2)' :
               'Tolak & Kembalikan ke Maintenance (AFTM)'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Catatan Penolakan / Revisi</Label>
              <Textarea 
                value={rejectNote} 
                onChange={e => setRejectNote(e.target.value)} 
                placeholder="Masukkan alasan penolakan atau catatan revisi yang harus dilakukan..."
                rows={4}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsRejectOpen(false)}>Batal</Button>
              <Button type="button" variant="destructive" onClick={handleRejectSave} disabled={isSubmitting || !rejectNote.trim()}>
                {isSubmitting ? 'Menyimpan...' : 'Konfirmasi Tolak'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
