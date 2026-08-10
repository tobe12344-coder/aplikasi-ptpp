import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureDataUrl: string) => void;
  title?: string;
  description?: string;
}

export function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  title = "Tanda Tangan Digital",
  description = "Silakan berikan tanda tangan Anda di dalam kotak di bawah ini."
}: SignaturePadModalProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [error, setError] = useState<string | null>(null);

  const handleClear = () => {
    sigCanvas.current?.clear();
    setError(null);
  };

  const handleSave = () => {
    if (sigCanvas.current?.isEmpty()) {
      setError("Tanda tangan tidak boleh kosong.");
      return;
    }
    
    // Get the base64 string of the signature
    const dataUrl = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    if (dataUrl) {
      onSave(dataUrl);
      setError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="border-2 border-dashed border-gray-300 rounded-md bg-slate-50 w-full overflow-hidden" style={{ height: '200px' }}>
            <SignatureCanvas 
              ref={sigCanvas}
              penColor="black"
              canvasProps={{
                className: 'signature-canvas w-full h-full'
              }}
            />
          </div>
          
          {error && <p className="text-sm text-red-500 w-full text-left">{error}</p>}
          
          <div className="flex justify-between w-full">
            <Button type="button" variant="outline" onClick={handleClear}>
              Bersihkan
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Batal
              </Button>
              <Button type="button" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                Simpan
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
