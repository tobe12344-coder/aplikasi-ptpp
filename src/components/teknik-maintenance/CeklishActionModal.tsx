import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFirestore, doc, updateDoc, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { addDays, addMonths, addYears, format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UploadCloud, Camera } from 'lucide-react';
import type { MaintenanceChecklist } from '@/lib/types';
import { FullscreenWebcam } from '@/components/common/FullscreenWebcam';

interface CeklishActionModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: MaintenanceChecklist;
}

const calculateNextInspection = (currentDate: Date, period: string): Date => {
  switch (period) {
    case 'Daily': return addDays(currentDate, 1);
    case 'Weekly': return addDays(currentDate, 7);
    case 'Monthly': return addMonths(currentDate, 1);
    case '3 Monthly': return addMonths(currentDate, 3);
    case 'Six Monthly': return addMonths(currentDate, 6);
    case 'Yearly': return addYears(currentDate, 1);
    case 'Opr. Hours': return addMonths(currentDate, 1); // fallback estimation
    default: return addDays(currentDate, 7);
  }
};

export default function CeklishActionModal({ isOpen, setIsOpen, item }: CeklishActionModalProps) {
  const { toast } = useToast();
  const [keterangan, setKeterangan] = useState(item.keterangan || item.hasilCeklish || '');
  const [lastInspection, setLastInspection] = useState(item.lastInspection || format(new Date(), 'yyyy-MM-dd'));
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.id) return;
    setIsLoading(true);

    try {
      const db = getFirestore();
      const storage = getStorage();
      const docRef = doc(db, 'maintenance_checklists', item.id);
      
      let formUrl = item.formUrl;

      // Handle File Upload
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `maintenance/${item.id}_${new Date().getTime()}.${fileExt}`;
        const sRef = storageRef(storage, fileName);
        await uploadBytes(sRef, file);
        formUrl = await getDownloadURL(sRef);
      }

      // Automatically advance schedule based on the selected lastInspection
      const inspectionDate = new Date(lastInspection);
      const nextInspection = format(calculateNextInspection(inspectionDate, item.period), 'yyyy-MM-dd');
      
      // Status will be dynamically calculated on the list view, but we save it as Complete here.
      const status = 'Complete';

      await updateDoc(docRef, {
        status,
        keterangan,
        hasilCeklish: '', // Kosongkan karena sudah digabung
        formUrl: formUrl || null,
        lastInspection,
        nextInspection,
        updatedAt: new Date().toISOString(),
      });

      // Add history record
      const historyRef = collection(db, 'maintenance_history');
      await addDoc(historyRef, {
        checklistId: item.id,
        item: item.item,
        sf: item.sf,
        period: item.period,
        inspectionDate: lastInspection,
        status: status,
        keterangan: keterangan,
        formUrl: formUrl || null,
        createdAt: new Date().toISOString(),
        // createdBy could be added if user info is available
      });

      toast({ title: 'Berhasil', description: 'Data ceklish berhasil diperbarui' });
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui data: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isCameraActive && (
        <FullscreenWebcam 
          initialFacingMode="environment" 
          onCapture={(base64) => { 
            const byteString = atob(base64.split(',')[1]);
            const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], { type: mimeString });
            const capturedFile = new File([blob], 'captured_image.jpg', { type: mimeString });
            setFile(capturedFile);
            setIsCameraActive(false); 
          }} 
          onCancel={() => setIsCameraActive(false)} 
        />
      )}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Hasil Ceklish</DialogTitle>
          <DialogDescription>
            {item.item} - {item.sf} ({item.period})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="lastInspection">Tanggal Inspeksi (Last Inspection)</Label>
            <Input 
              id="lastInspection" 
              type="date"
              value={lastInspection}
              onChange={(e) => setLastInspection(e.target.value)}
              required 
            />
            <p className="text-xs text-green-600 mt-1">Status dan Jadwal Next Inspection akan otomatis diperbarui.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan / Hasil Temuan</Label>
            <Textarea 
              id="keterangan" 
              value={keterangan}
              onChange={(e) => setKeterangan(e.target.value)}
              placeholder="Tambahkan catatan jika perlu..."
            />
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>Upload Form Ceklish (Scanned PDF/Foto)</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Input 
                id="file" 
                type="file" 
                accept=".pdf,image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Button type="button" variant="outline" onClick={() => setIsCameraActive(true)} className="gap-2 shrink-0">
                <Camera className="h-4 w-4" /> Ambil Foto
              </Button>
            </div>
            {file && <p className="text-xs text-green-600 truncate">Terpilih: {file.name}</p>}
            {item.formUrl && !file && (
              <p className="text-xs text-blue-600"><a href={item.formUrl} target="_blank" rel="noreferrer">Lihat Form Tersimpan Saat Ini</a></p>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Data'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
