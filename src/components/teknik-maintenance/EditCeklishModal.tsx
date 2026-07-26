import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { MaintenanceChecklist } from '@/lib/types';

interface EditCeklishModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  item: MaintenanceChecklist;
}

export default function EditCeklishModal({ isOpen, setIsOpen, item }: EditCeklishModalProps) {
  const { toast } = useToast();
  const [no, setNo] = useState(item.no);
  const [itemName, setItemName] = useState(item.item);
  const [sf, setSf] = useState(item.sf);
  const [period, setPeriod] = useState(item.period);
  const [sfFile, setSfFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNo(item.no);
      setItemName(item.item);
      setSf(item.sf);
      setPeriod(item.period);
      setSfFile(null);
    }
  }, [isOpen, item]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!item.id || !no || !itemName || !sf || !period) {
      toast({ variant: 'destructive', title: 'Error', description: 'Harap isi semua kolom wajib' });
      return;
    }
    
    setIsLoading(true);
    try {
      const db = getFirestore();
      const storage = getStorage();
      let sfFileUrl = item.sfFileUrl || null;

      // If user uploads a new file, override the old one
      if (sfFile) {
        const fileExt = sfFile.name.split('.').pop();
        const fileName = `maintenance_templates/${sf}_${new Date().getTime()}.${fileExt}`;
        const sRef = storageRef(storage, fileName);
        await uploadBytes(sRef, sfFile);
        sfFileUrl = await getDownloadURL(sRef);
      }
      
      const docRef = doc(db, 'maintenance_checklists', item.id);
      
      await updateDoc(docRef, {
        no,
        item: itemName,
        sf,
        period,
        sfFileUrl,
        updatedAt: new Date().toISOString()
      });

      toast({ title: 'Berhasil', description: 'Item berhasil diperbarui' });
      setIsOpen(false);
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal memperbarui data: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Item Checklist</DialogTitle>
          <DialogDescription>
            Ubah detail sarana/prasarana atau perbarui file SF template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-no">Nomor Urut</Label>
            <Input 
              id="edit-no" 
              value={no}
              onChange={(e) => setNo(e.target.value)}
              placeholder="Contoh: 18"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-item">Nama Item</Label>
            <Input 
              id="edit-item" 
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Contoh: Hose End Strainer"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sf">Kode SF (Form)</Label>
            <Input 
              id="edit-sf" 
              value={sf}
              onChange={(e) => setSf(e.target.value)}
              placeholder="Contoh: SF-205"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-period">Periode Maintenance</Label>
            <Select value={period} onValueChange={setPeriod} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Daily">Daily (Harian)</SelectItem>
                <SelectItem value="Weekly">Weekly (Mingguan)</SelectItem>
                <SelectItem value="Monthly">Monthly (Bulanan)</SelectItem>
                <SelectItem value="3 Monthly">3 Monthly (Per 3 Bulan)</SelectItem>
                <SelectItem value="Six Monthly">Six Monthly (Per 6 Bulan)</SelectItem>
                <SelectItem value="Yearly">Yearly (Tahunan)</SelectItem>
                <SelectItem value="3 Yearly">3 Yearly (Per 3 Tahun)</SelectItem>
                <SelectItem value="5 Yearly">5 Yearly (Per 5 Tahun)</SelectItem>
                <SelectItem value="Opr. Hours">Opr. Hours (Jam Operasi)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-sfFile">Upload File SF Template Baru (Opsional)</Label>
            <Input 
              id="edit-sfFile" 
              type="file" 
              accept=".pdf,image/*" 
              onChange={(e) => setSfFile(e.target.files?.[0] || null)} 
            />
            <p className="text-xs text-gray-500">
              Format: PDF atau Gambar. Biarkan kosong jika tidak ingin mengubah template saat ini.
              {item.sfFileUrl && (
                <span className="block mt-1 text-green-600 font-medium">
                  Status: Template kustom sudah ada.
                </span>
              )}
            </p>
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
                'Simpan Perubahan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
