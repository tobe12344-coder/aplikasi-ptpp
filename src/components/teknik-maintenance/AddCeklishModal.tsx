import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddCeklishModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function AddCeklishModal({ isOpen, setIsOpen }: AddCeklishModalProps) {
  const { toast } = useToast();
  const [no, setNo] = useState('');
  const [item, setItem] = useState('');
  const [sf, setSf] = useState('');
  const [period, setPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!no || !item || !sf || !period) {
      toast({ variant: 'destructive', title: 'Error', description: 'Harap isi semua kolom wajib' });
      return;
    }
    
    setIsLoading(true);
    try {
      const db = getFirestore();
      const colRef = collection(db, 'maintenance_checklists');
      
      await addDoc(colRef, {
        no,
        item,
        sf,
        period,
        lastInspection: '',
        nextInspection: '',
        status: 'Pending',
        keterangan: '',
        createdAt: new Date().toISOString()
      });

      toast({ title: 'Berhasil', description: 'Item baru berhasil ditambahkan' });
      setIsOpen(false);
      // Reset form
      setNo('');
      setItem('');
      setSf('');
      setPeriod('');
    } catch (error: any) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'Gagal menambahkan data: ' + error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Item Checklist</DialogTitle>
          <DialogDescription>
            Masukkan detail sarana/prasarana baru untuk maintenance.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="no">Nomor Urut</Label>
            <Input 
              id="no" 
              value={no}
              onChange={(e) => setNo(e.target.value)}
              placeholder="Contoh: 18"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="item">Nama Item</Label>
            <Input 
              id="item" 
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="Contoh: Hose End Strainer"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sf">Kode SF (Form)</Label>
            <Input 
              id="sf" 
              value={sf}
              onChange={(e) => setSf(e.target.value)}
              placeholder="Contoh: SF-205"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Periode Maintenance</Label>
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
                <SelectItem value="Opr. Hours">Opr. Hours (Jam Operasi)</SelectItem>
              </SelectContent>
            </Select>
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
  );
}
