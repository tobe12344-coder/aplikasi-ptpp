import { Camera, RefreshCcw, Loader2, Timer as TimerIcon, TimerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface FullscreenWebcamProps {
  onCapture: (base64Image: string) => void;
  onCancel: () => void;
  initialFacingMode?: 'environment' | 'user';
  allowTimer?: boolean;
}

export function FullscreenWebcam({ onCapture, onCancel, initialFacingMode = 'environment', allowTimer = false }: FullscreenWebcamProps) {
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>(initialFacingMode);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const [isInitializing, setIsInitializing] = useState(true);
  const [timerActive, setTimerActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = async (mode: 'environment' | 'user') => {
    setIsInitializing(true);
    setFacingMode(mode);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      toast({ title: 'Kamera Gagal', description: 'Pastikan Anda memberikan izin akses kamera', variant: 'destructive' });
      onCancel();
    } finally {
      setIsInitializing(false);
    }
  };

  const toggleCamera = () => {
    startCamera(facingMode === 'environment' ? 'user' : 'environment');
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    startCamera(initialFacingMode);
    return () => {
      stopCamera();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const captureCameraPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      stopCamera();
      onCapture(dataUrl);
    }
  };

  const handleCaptureClick = () => {
    if (timerActive) {
      setCountdown(5);
    } else {
      captureCameraPhoto();
    }
  };

  useEffect(() => {
    if (countdown === null) return;
    
    if (countdown === 0) {
      captureCameraPhoto();
      setCountdown(null);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        {isInitializing && <Loader2 className="h-10 w-10 text-white animate-spin absolute" />}
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        
        {countdown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <span className="text-white text-[150px] font-black drop-shadow-2xl animate-ping">
              {countdown}
            </span>
          </div>
        )}
        
        {allowTimer && (
          <Button 
            type="button" 
            variant="ghost" 
            className="absolute top-6 right-6 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 h-14 w-14 border border-white/20"
            onClick={() => setTimerActive(!timerActive)}
            disabled={countdown !== null}
          >
            {timerActive ? <TimerIcon className="h-8 w-8 text-yellow-400" /> : <TimerOff className="h-8 w-8" />}
          </Button>
        )}
      </div>
      <div className="bg-black p-6 pb-12 flex justify-between items-center px-8 border-t border-slate-800">
        <Button type="button" variant="ghost" onClick={() => { stopCamera(); onCancel(); }} disabled={countdown !== null} className="text-white hover:bg-white/20 w-16">Batal</Button>
        <Button type="button" onClick={handleCaptureClick} disabled={isInitializing || countdown !== null} className="rounded-full h-16 w-16 p-0 bg-white hover:bg-slate-200 border-4 border-slate-400 flex items-center justify-center shadow-lg disabled:opacity-50">
          <Camera className="h-8 w-8 text-slate-800" />
        </Button>
        <Button type="button" variant="ghost" onClick={toggleCamera} disabled={isInitializing || countdown !== null} className="text-white hover:bg-white/20 w-16 p-0 flex flex-col items-center gap-1 disabled:opacity-50">
          <RefreshCcw className="h-6 w-6" />
          <span className="text-[10px]">Putar</span>
        </Button>
      </div>
    </div>
  );
}
