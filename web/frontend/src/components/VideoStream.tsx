import React, { useEffect, useRef } from 'react';
import { Video, VideoOff } from 'lucide-react';
import { Landmark, BoundingBox } from '@/types';

interface VideoStreamProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  isActive: boolean;
  landmarks?: Landmark[] | null;
  boundingBox?: BoundingBox | null;
  showLandmarks?: boolean;
  showBoundingBox?: boolean;
  handDetected?: boolean;
}

export const VideoStream: React.FC<VideoStreamProps> = ({
  videoRef,
  canvasRef,
  isActive,
  landmarks,
  boundingBox,
  showLandmarks = true,
  showBoundingBox = true,
  handDetected,
}) => {
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Draw landmarks and bounding box on overlay canvas
   */
  useEffect(() => {
    if (!overlayCanvasRef.current || !videoRef.current || !isActive) {
      return;
    }

    const canvas = overlayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth || video.width;
    canvas.height = video.videoHeight || video.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw bounding box (normalized 0..1 or pixel). Canvas already mirrored via CSS, so DO NOT mirror here.
    if (showBoundingBox && boundingBox) {
      const width = canvas.width;
      const height = canvas.height;
      // If backend sends normalized (0..1), scale; if pixel, clamp accordingly
      const isNormalized = boundingBox.x1 <= 1 && boundingBox.y1 <= 1 && boundingBox.x2 <= 1 && boundingBox.y2 <= 1;
      const bx1 = isNormalized ? boundingBox.x1 * width : boundingBox.x1;
      const by1 = isNormalized ? boundingBox.y1 * height : boundingBox.y1;
      const bx2 = isNormalized ? boundingBox.x2 * width : boundingBox.x2;
      const by2 = isNormalized ? boundingBox.y2 * height : boundingBox.y2;

      const x = Math.max(0, Math.min(width, Math.min(bx1, bx2)));
      const y = Math.max(0, Math.min(height, Math.min(by1, by2)));
      const w = Math.max(0, Math.min(width, Math.abs(bx2 - bx1)));
      const h = Math.max(0, Math.min(height, Math.abs(by2 - by1)));

      ctx.strokeStyle = '#3B82F6'; // Blue
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);
    }

    // Draw landmarks
    if (showLandmarks && landmarks && landmarks.length > 0) {
      const width = canvas.width;
      const height = canvas.height;

      // Draw connections (hand skeleton)
      const connections = [
        // Thumb
        [0, 1], [1, 2], [2, 3], [3, 4],
        // Index finger
        [0, 5], [5, 6], [6, 7], [7, 8],
        // Middle finger
        [0, 9], [9, 10], [10, 11], [11, 12],
        // Ring finger
        [0, 13], [13, 14], [14, 15], [15, 16],
        // Pinky
        [0, 17], [17, 18], [18, 19], [19, 20],
        // Palm
        [5, 9], [9, 13], [13, 17],
      ];

      // Draw connection lines
      ctx.strokeStyle = '#10B981'; // Green
      ctx.lineWidth = 2;
      connections.forEach(([start, end]) => {
        if (landmarks[start] && landmarks[end]) {
          ctx.beginPath();
          ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
          ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
          ctx.stroke();
        }
      });

      // Draw landmark points
      landmarks.forEach((landmark, index) => {
        const x = landmark.x * width;
        const y = landmark.y * height;

        // Different colors for different parts
        if (index === 0) {
          ctx.fillStyle = '#EF4444'; // Red for wrist
        } else if ([4, 8, 12, 16, 20].includes(index)) {
          ctx.fillStyle = '#F59E0B'; // Orange for fingertips
        } else {
          ctx.fillStyle = '#10B981'; // Green for other points
        }

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }, [landmarks, boundingBox, isActive, showLandmarks, showBoundingBox, videoRef]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center space-x-2">
          {isActive ? (
            <>
              <Video className="w-5 h-5 text-green-500" />
              <span>Kamera Aktif</span>
            </>
          ) : (
            <>
              <VideoOff className="w-5 h-5 text-gray-400" />
              <span>Kamera Kapalı</span>
            </>
          )}
        </h3>
        
        {isActive && (
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-600 dark:text-gray-400">Canlı</span>
          </div>
        )}
      </div>

      {/* Video Container */}
      <div className="relative bg-gray-900 rounded-xl overflow-hidden aspect-video border-4 border-blue-600">
        {/* Hand Detected Badge */}
        {isActive && (
          <div className="absolute top-3 right-3 z-10">
            {handDetected ? (
              <span className="px-2 py-1 text-xs rounded-md bg-green-600/90 text-white">El algılandı</span>
            ) : (
              <span className="px-2 py-1 text-xs rounded-md bg-gray-700/80 text-gray-200">El algılanmadı</span>
            )}
          </div>
        )}
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />

        {/* Overlay Canvas for Landmarks */}
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: 'scaleX(-1)' }} // Mirror effect
        />



        {/* Hidden Canvas for Frame Capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* No Camera State */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center space-y-4">
              <VideoOff className="w-16 h-16 text-gray-600 mx-auto" />
              <p className="text-gray-400">Kamera açılmamış</p>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      {isActive && (
        <div className="mt-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span>El İskeleti</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>Sınır Kutusu</span>
            </div>
          </div>
          <span>Aynalı görünüm aktif</span>
        </div>
      )}
    </div>
  );
};