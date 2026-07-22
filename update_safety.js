const fs = require('fs');

const path = 'd:/aftdeo-app/src/components/safety-briefing/SafetyBriefingClient.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Imports
code = code.replace(
  "import { Camera, Loader2, Printer, ImageIcon } from 'lucide-react';",
  "import { Camera, Loader2, Printer, ImageIcon, Trash2, Edit, PenLine } from 'lucide-react';\nimport SignatureCanvas from 'react-signature-canvas';\nimport { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';\nimport { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';"
);

code = code.replace(
  "import { addSafetyBriefing } from '@/firebase/firestore/safety-briefing';",
  "import { addSafetyBriefing, deleteSafetyBriefing, updateSafetyBriefing } from '@/firebase/firestore/safety-briefing';"
);

// 2. Schema
code = code.replace(
  "conductor: z.string().min(1, 'Nama pemateri wajib diisi'),",
  "conductor: z.string().min(1, 'Nama pemateri wajib diisi'),\n  pengawasName: z.string().min(1, 'Pilih pengawas'),"
);

// 3. Form defaultValues
code = code.replace(
  "conductor: '',",
  "conductor: '',\n      pengawasName: '',"
);

// 4. Variables & Refs
code = code.replace(
  "const [isExporting, setIsExporting] = useState(false);",
  "const [isExporting, setIsExporting] = useState(false);\n  const [isDeleting, setIsDeleting] = useState<string | null>(null);\n  const signatureRef = useRef<SignatureCanvas | null>(null);\n  const PENGAWAS_LIST = ['Urip Widodo', 'Kiamnas Meithson', 'Harry Nugroho', 'Boetros Galih Hutajulu', 'Delvelino Wader', 'Dewi Septiany'];"
);

// 5. Submit function
code = code.replace(
  "addSafetyBriefing(firestore, { \n        ...values, \n        photos: photoUrls,\n        photo: photoUrls.length > 0 ? photoUrls[0] : '' \n      });",
  "const signatureData = signatureRef.current && !signatureRef.current.isEmpty() ? signatureRef.current.toDataURL() : '';\n      if (!signatureData) {\n        toast({ variant: 'destructive', title: 'Tanda tangan Pengawas wajib diisi' });\n        setIsUploading(false);\n        return;\n      }\n      \n      addSafetyBriefing(firestore, { \n        ...values, \n        photos: photoUrls,\n        photo: photoUrls.length > 0 ? photoUrls[0] : '',\n        pengawasSignature: signatureData,\n        isSignedByPengawas: true,\n        isSignedByAFTM: false\n      });"
);

code = code.replace(
  "conductor: '',\n        attendees: [],",
  "conductor: '',\n        pengawasName: '',\n        attendees: [],"
);

code = code.replace(
  "setPhotoPreviews([]);",
  "setPhotoPreviews([]);\n      if (signatureRef.current) signatureRef.current.clear();"
);

// 6. Form Fields for Pengawas & Signature
const formFieldsHTML = `
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="pengawasName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pengawas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Pilih Pengawas" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PENGAWAS_LIST.map((name) => (
                          <SelectItem key={name} value={name}>{name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="space-y-2">
                  <FormLabel>Tanda Tangan Pengawas</FormLabel>
                  <div className="border rounded-md bg-white">
                    <SignatureCanvas 
                      ref={signatureRef} 
                      canvasProps={{ className: 'w-full h-32 rounded-md' }} 
                    />
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => signatureRef.current?.clear()} className="text-xs h-6 px-2 text-muted-foreground mt-1">Ulangi Tanda Tangan</Button>
                </div>
              </div>
`;
code = code.replace(
  /<FormField\s+control=\{form\.control\}\s+name="attendees"/,
  formFieldsHTML + "\n              <FormField control={form.control} name=\"attendees\""
);

// 7. exportSingleToPDF and Accordion Actions
const exportSingleFunction = `
  const handleDelete = async (id: string) => {
    if (!firestore) return;
    setIsDeleting(id);
    try {
      await deleteSafetyBriefing(firestore, id);
      toast({ title: 'Berhasil dihapus' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gagal menghapus' });
    } finally {
      setIsDeleting(null);
    }
  };

  const exportSingleToPDF = async (b: SafetyBriefing) => {
    setIsExporting(true);
    try {
      const doc = new jsPDF('portrait') as jsPDFWithAutoTable;
      doc.setFontSize(16);
      doc.text('LAPORAN SAFETY BRIEFING', 105, 20, { align: 'center' });
      doc.setFontSize(11);
      
      doc.text(\`Tanggal: \${format(b.timestamp.toDate(), 'eeee, d MMMM yyyy', { locale: indonesiaLocale })}\`, 14, 35);
      doc.text(\`Topik/Judul: \${b.topic}\`, 14, 42);
      doc.text(\`Pemateri: \${b.conductor}\`, 14, 49);
      doc.text(\`Pengawas: \${b.pengawasName || '-'}\`, 14, 56);
      
      doc.text('Catatan/Ringkasan:', 14, 65);
      doc.setFontSize(10);
      const splitNotes = doc.splitTextToSize(b.notes || '-', 180);
      doc.text(splitNotes, 14, 71);
      
      let currentY = 71 + (splitNotes.length * 5) + 5;
      
      doc.setFontSize(11);
      doc.text(\`Peserta Hadir (\${b.attendees.length} orang):\`, 14, currentY);
      
      // AutoTable for attendees
      const attendeesRows = [];
      for (let i=0; i<b.attendees.length; i+=3) {
        attendeesRows.push([b.attendees[i] || '', b.attendees[i+1] || '', b.attendees[i+2] || '']);
      }
      doc.autoTable({
        startY: currentY + 3,
        head: [],
        body: attendeesRows,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 2 }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 10;
      
      // Photos
      let photoUrl = b.photos && b.photos.length > 0 ? b.photos[0] : (b.photo || '');
      if (photoUrl) {
         doc.text('Dokumentasi:', 14, currentY);
         const photoBase64 = await getBase64FromUrl(photoUrl);
         if (photoBase64) {
           doc.addImage(photoBase64, 'JPEG', 14, currentY + 5, 80, 50);
           currentY += 60;
         }
      }
      
      // Signatures
      currentY = Math.max(currentY, 200);
      doc.text('Mengetahui,', 14, currentY);
      
      doc.text('Pengawas', 30, currentY + 10, { align: 'center' });
      if (b.pengawasSignature) {
        doc.addImage(b.pengawasSignature, 'PNG', 10, currentY + 12, 40, 20);
      }
      doc.text(\`(\${b.pengawasName || '....................'})\`, 30, currentY + 37, { align: 'center' });
      
      doc.text('AFTM', 160, currentY + 10, { align: 'center' });
      if (b.aftmSignature) {
        doc.addImage(b.aftmSignature, 'PNG', 140, currentY + 12, 40, 20);
      }
      doc.text(\`(\${b.aftmName || '....................'})\`, 160, currentY + 37, { align: 'center' });
      
      doc.save(\`Safety_Briefing_\${b.topic.substring(0, 15)}_\${format(b.timestamp.toDate(), 'yyyyMMdd')}.pdf\`);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gagal Cetak PDF' });
    } finally {
      setIsExporting(false);
    }
  };
`;
code = code.replace(
  "const exportToPDF = async () => {",
  exportSingleFunction + "\n\n  const exportToPDF = async () => {"
);

// 8. Add buttons in Accordion
const buttonsHTML = `
                        <div className="flex justify-between w-full pr-4 items-center gap-2">
                          <div className="flex flex-col text-left">
                            <span className="font-semibold">{briefing.topic}</span>
                            <span className="text-xs text-muted-foreground">{format(briefing.timestamp.toDate(), "eeee, d MMMM yyyy", { locale: indonesiaLocale })}</span>
                          </div>
                          <div className="flex items-center gap-2 mr-2" onClick={(e) => e.stopPropagation()}>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => exportSingleToPDF(briefing)}>
                              <Printer className="h-3.5 w-3.5" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50">
                                  {isDeleting === briefing.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Riwayat?</AlertDialogTitle>
                                  <AlertDialogDescription>Data safety briefing ini akan dihapus secara permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => handleDelete(briefing.id!)}>Hapus</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
`;
code = code.replace(
  /<div className="flex justify-between w-full pr-4">[\s\S]*?<\/div>/,
  buttonsHTML
);

fs.writeFileSync(path, code);
