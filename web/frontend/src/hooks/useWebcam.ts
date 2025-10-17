import { useRef, useState, useCallback, RefObject, useEffect } from 'react';
import { videoFrameToBase64 } from '@/utils/helpers';
import { CAMERA_WIDTH, CAMERA_HEIGHT } from '@/utils/constants';

export interface UseWebcamReturn {
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrame: () => string | null;
}

export const useWebcam = (): UseWebcamReturn => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Start camera stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Check if browser supports getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tarayıcınız kamera erişimini desteklemiyor');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: CAMERA_WIDTH },
          height: { ideal: CAMERA_HEIGHT },
          facingMode: 'user', // Front camera
        },
        audio: false,
      });

      // Set stream to video element and ensure playback starts
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        // Ensure autoplay works across browsers
        video.muted = true;
        // playsInline hint for iOS Safari and mobile browsers
        (video as any).playsInline = true;

        const tryPlay = async () => {
          try {
            await video.play();
          } catch (playErr) {
            console.warn('⚠️ Video autoplay engellendi, kullanıcı etkileşimi bekleniyor:', playErr);
          }
        };

        // Try immediately
        await tryPlay();

        // Wait until video metadata is ready (dimensions available)
        await new Promise<void>((resolve) => {
          let resolved = false;
          const maybeResolve = () => {
            if (!resolved && video.videoWidth > 0 && video.videoHeight > 0) {
              resolved = true;
              resolve();
            }
          };
          const onLoadedMetadata = () => { tryPlay().then(maybeResolve); };
          const onLoadedData = () => { tryPlay().then(maybeResolve); };
          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('loadeddata', onLoadedData);
          // Poll as a safety net
          const poll = setInterval(() => {
            maybeResolve();
            if (resolved) clearInterval(poll);
          }, 100);
          // Timeout fallback
          setTimeout(() => {
            if (!resolved) {
              resolved = true;
              resolve();
            }
          }, 2000);
        });
      }

      streamRef.current = stream;
      setIsActive(true);
      console.log('✅ Camera started successfully');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Kamera erişimi başarısız';
      setError(errorMessage);
      console.error('❌ Camera error:', err);
      
      // Check specific error types
      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('Kamera erişim izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.');
        } else if (err.name === 'NotFoundError') {
          setError('Kamera bulunamadı. Lütfen bir kamera bağlı olduğundan emin olun.');
        } else if (err.name === 'NotReadableError') {
          setError('Kamera kullanımda. Lütfen diğer uygulamaları kapatın.');
        }
      }
    }
  }, []);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setIsActive(false);
      console.log('🛑 Camera stopped');
      
    } catch (err) {
      console.error('❌ Error stopping camera:', err);
    }
  }, []);

  /**
   * Capture current video frame as base64
   */
  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) {
      console.log('⚠️ [capture] refs missing', {
        hasVideoRef: !!videoRef.current,
        hasCanvasRef: !!canvasRef.current,
      });
      return null;
    }

    // isActive kontrolünü üst seviye döngüde yapıyoruz

    try {
      const base64 = videoFrameToBase64(videoRef.current, canvasRef.current);
      return base64;
    } catch (err) {
      console.error('❌ [capture] error capturing frame:', err);
      return null;
    }
  }, [isActive]);

  // Ensure stream attaches when <video> mounts after camera start
  useEffect(() => {
    if (!isActive) return;

    let attachInterval: number | null = null;

    const tryAttach = async () => {
      if (videoRef.current && streamRef.current) {
        const video = videoRef.current;
        if (video.srcObject !== streamRef.current) {
          video.srcObject = streamRef.current;
        }
        video.muted = true;
        (video as any).playsInline = true;
        try {
          await video.play();
        } catch (err) {
          console.warn('⚠️ Video autoplay engellendi (auto-attach):', err);
        }
        if (attachInterval) {
          window.clearInterval(attachInterval);
          attachInterval = null;
        }
      }
    };

    // Try immediately and then poll briefly until video ref appears
    tryAttach();
    attachInterval = window.setInterval(tryAttach, 300);

    return () => {
      if (attachInterval) {
        window.clearInterval(attachInterval);
      }
    };
  }, [isActive]);

  return {
    videoRef,
    canvasRef,
    isActive,
    error,
    startCamera,
    stopCamera,
    captureFrame,
  };
};