'use client';

import { useState, useEffect, useRef } from 'react';

import { generateSequentialNoLaporan } from '@/lib/generateNoLaporan';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import type { DamageReport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { sendWhatsAppNotification } from '@/app/actions/fonnte';
import { useRouter } from 'next/navigation';
import SignatureCanvas from 'react-signature-canvas';

export default function GuestLaporanForm() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  // Form states
  const [namaPelapor, setNamaPelapor] = useState('');
  const [areaKerusakan, setAreaKerusakan] = useState('');
  const [jenisKerusakan, setJenisKerusakan] = useState('');
  const [sumberKetidaksesuaian, setSumberKetidaksesuaian] = useState('');
  const [kategoriPTPP, setKategoriPTPP] = useState<'Perbaikan' | 'Perawatan'>('Perbaikan');
  const [persyaratanDilanggar, setPersyaratanDilanggar] = useState('');
  const [batasWaktuReply, setBatasWaktuReply] = useState('');
  const [priority, setPriority] = useState<'Rendah' | 'Sedang' | 'Tinggi'>('Sedang');
  const [fotoKerusakan, setFotoKerusakan] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    const today = new Date();
    let daysToAdd = 3; // Sedang
    if (priority === 'Rendah') daysToAdd = 7;
    if (priority === 'Tinggi') daysToAdd = 1;
    
    today.setDate(today.getDate() + daysToAdd);
    setBatasWaktuReply(format(today, 'yyyy-MM-dd'));
  }, [priority]);



  const uploadPhoto = async (file: File, path: string) => {
    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore) return;
    
    const dataUrl = sigCanvas.current?.isEmpty() ? null : sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');

    if (!dataUrl) {
      toast({
        title: 'Validasi Gagal',
        description: 'Tanda tangan wajib diisi.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      let fotoUrl = '';
      if (fotoKerusakan) {
        fotoUrl = await uploadPhoto(fotoKerusakan, `damage_reports/guest_${Date.now()}_${fotoKerusakan.name}`);
      }

      const noLaporan = await generateSequentialNoLaporan(firestore);
      const now = new Date();

      const newReport: Omit<DamageReport, 'id'> = {
        noLaporan,
        timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
        namaPelapor: namaPelapor || 'Tamu',
        jabatanPelapor: 'TAMU (GUEST)',
        kepadaFungsi: 'Maintenance',
        areaKerusakan,
        jenisKerusakan,
        fotoKerusakan: fotoUrl,
        sumberKetidaksesuaian,
        kategoriPTPP,
        persyaratanDilanggar,
        batasWaktuReply,
        signaturePemohon: namaPelapor || 'Tamu',
        signaturePemohon_image: dataUrl,
        priority,
        status: 'Open',
        workflowState: 'WAITING_SPV_RSD_1',
        timestamp_obj: serverTimestamp() as any,
      };

      await addDoc(collection(firestore, 'damage_reports'), newReport);
      
      const appUrl = 'https://deomaintenance.com/';
      const waMessage = `🚨 *LAPORAN KERUSAKAN BARU* 🚨\n\n` +
                        `*No PTPP:* ${noLaporan}\n` +
                        `*Pelapor:* ${newReport.namaPelapor} (${newReport.jabatanPelapor})\n` +
                        `*Prioritas:* ${priority}\n` +
                        `*Area:* ${areaKerusakan}\n` +
                        `*Kendala:* ${jenisKerusakan}\n\n` +
                        `Silakan klik link berikut untuk login dan melakukan review:\n${appUrl}`;
      
      sendWhatsAppNotification(waMessage, undefined, '085729804292').catch(err => console.error('Gagal memanggil Server Action WA:', err));

      toast({
        title: 'Sukses',
        description: 'Laporan berhasil dikirim. Terima kasih atas partisipasi Anda.',
      });
      
      // Reset form
      setNamaPelapor('');
      setAreaKerusakan('');
      setJenisKerusakan('');
      setSumberKetidaksesuaian('');
      setPersyaratanDilanggar('');
      setFotoKerusakan(null);
      sigCanvas.current?.clear();
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

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="bg-slate-50 border-b">
        <CardTitle className="text-2xl text-slate-800">Form Laporan Kerusakan</CardTitle>
        <CardDescription>
          Silakan lengkapi form di bawah ini untuk melaporkan kerusakan sarana dan prasarana.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Area Kerusakan (Lokasi)</Label>
            <Input 
              required 
              value={areaKerusakan} 
              onChange={e => setAreaKerusakan(e.target.value)} 
              placeholder="Contoh: Kantor, Refueller DEO 10, Tangki Timbun 1..." 
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Kerusakan (Deskripsi Lengkap)</Label>
            <Textarea 
              required 
              value={jenisKerusakan} 
              onChange={e => setJenisKerusakan(e.target.value)} 
              placeholder="Jelaskan secara lengkap jenis kerusakan..." 
              rows={4} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2 md:col-span-2">
              <Label>Tingkat Prioritas</Label>
              <Select required value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih prioritas..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rendah">Rendah (Aman ditunda)</SelectItem>
                  <SelectItem value="Sedang">Sedang (Perlu segera)</SelectItem>
                  <SelectItem value="Tinggi">Tinggi (Kritis)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Foto Kerusakan (Opsional tapi disarankan)</Label>
            <Input 
              type="file" 
              accept="image/*" 
              onChange={e => setFotoKerusakan(e.target.files?.[0] || null)} 
              className="cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <Label>Nama Pelapor</Label>
            <Input 
              required 
              value={namaPelapor} 
              onChange={e => setNamaPelapor(e.target.value)} 
              placeholder="Masukkan nama lengkap Anda..." 
            />
          </div>

          <div className="space-y-2">
            <Label>Tanda Tangan</Label>
            <div className="flex flex-col gap-2">
              <div className="border-2 border-dashed border-gray-300 rounded-md bg-slate-50 w-full overflow-hidden" style={{ height: '200px' }}>
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{
                    className: 'signature-canvas w-full h-full'
                  }}
                />
              </div>
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => sigCanvas.current?.clear()}>
                  Bersihkan Tanda Tangan
                </Button>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-between gap-2 border-t mt-6">
            <Button type="button" variant="outline" onClick={() => router.push('/login')}>
              Kembali ke Login
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
              {isSubmitting ? 'Mengirim...' : 'Kirim Laporan'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
