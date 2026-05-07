import { useEffect, useRef, useState } from "react";
import Icon from "@/components/ui/icon";

interface Props {
  onScan: (result: string) => void;
  onClose: () => void;
  hint?: string;
}

export default function CameraScanner({ onScan, onClose, hint }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [scanning, setScanning] = useState(false);
  const detectorRef = useRef<BarcodeDetector | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setScanning(true);
      initDetector();
    } catch (_e) {
      setError("Нет доступа к камере. Разрешите доступ в настройках браузера.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const initDetector = async () => {
    if (!("BarcodeDetector" in window)) {
      setError("Ваш браузер не поддерживает сканирование QR. Используйте Chrome или Safari.");
      return;
    }
    try {
      detectorRef.current = new BarcodeDetector({ formats: ["qr_code", "ean_13", "ean_8", "code_128", "code_39"] });
      scan();
    } catch (_e) {
      setError("Не удалось запустить детектор штрихкодов.");
    }
  };

  const scan = async () => {
    const video = videoRef.current;
    const detector = detectorRef.current;
    if (!video || !detector || video.readyState < 2) {
      animFrameRef.current = requestAnimationFrame(scan);
      return;
    }
    try {
      const barcodes = await detector.detect(video);
      if (barcodes.length > 0) {
        const value = barcodes[0].rawValue;
        stopCamera();
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        onScan(value);
        return;
      }
    } catch (_e) { /* ignore */ }
    animFrameRef.current = requestAnimationFrame(scan);
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-64 h-64 relative">
            <div className="absolute inset-0 rounded-2xl border-2 border-accent/80" />
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-accent rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-accent rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-accent rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-accent rounded-br-xl" />
            {scanning && (
              <div className="absolute left-2 right-2 h-0.5 bg-accent/80 rounded-full animate-[scanline_2s_ease-in-out_infinite]" style={{ top: "50%", boxShadow: "0 0 8px 2px rgba(255,171,0,0.6)" }} />
            )}
          </div>

          <p className="text-white/70 text-sm mt-6 text-center px-8">
            {hint || "Наведите камеру на QR-код или штрихкод"}
          </p>
        </div>

        {error && (
          <div className="absolute bottom-24 left-4 right-4 bg-destructive/90 backdrop-blur text-white px-4 py-3 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
      </div>

      <div className="bg-black/90 px-6 py-6 safe-area-bottom">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="w-full py-3.5 rounded-xl border border-white/20 text-white font-medium flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
        >
          <Icon name="X" size={18} />
          Закрыть
        </button>
      </div>

      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-120px); }
          50% { transform: translateY(120px); }
          100% { transform: translateY(-120px); }
        }
      `}</style>
    </div>
  );
}
