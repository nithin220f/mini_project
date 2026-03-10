import { RefObject } from 'react';
import { cn } from '@/lib/utils';
import type { DetectedFace, EmotionLabel } from '@/hooks/useEmotionDetection';

const EMOTION_COLORS: Record<EmotionLabel, string> = {
  angry: '#ef4444',
  disgusted: '#a855f7',
  fearful: '#f59e0b',
  happy: '#22c55e',
  neutral: '#64748b',
  sad: '#3b82f6',
  surprised: '#06b6d4',
};

interface WebcamFeedProps {
  videoRef: RefObject<HTMLVideoElement>;
  faces: DetectedFace[];
  isActive: boolean;
}

export function WebcamFeed({ videoRef, faces, isActive }: WebcamFeedProps) {
  const videoWidth = videoRef.current?.videoWidth || 640;
  const videoHeight = videoRef.current?.videoHeight || 480;

  return (
    <div className="relative w-full aspect-[4/3] bg-secondary/30 rounded overflow-hidden border border-border">
      {/* Scanline overlay */}
      <div className="absolute inset-0 scanline pointer-events-none z-10" />
      
      {/* Corner marks */}
      <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/60 z-10" />
      <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/60 z-10" />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/60 z-10" />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/60 z-10" />

      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        muted
        playsInline
      />

      {/* Face bounding boxes */}
      {isActive && faces.map((face) => {
        const color = EMOTION_COLORS[face.emotion];
        const scaleX = 100 / videoWidth;
        const scaleY = 100 / videoHeight;
        return (
          <div
            key={face.id}
            className="absolute z-20"
            style={{
              left: `${face.x * scaleX}%`,
              top: `${face.y * scaleY}%`,
              width: `${face.width * scaleX}%`,
              height: `${face.height * scaleY}%`,
              border: `2px solid ${color}`,
              boxShadow: `0 0 10px ${color}40`,
            }}
          >
            <span
              className="absolute -top-5 left-0 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider uppercase"
              style={{ backgroundColor: color, color: '#0a0f1a' }}
            >
              {face.emotion} {Math.round(face.confidence * 100)}%
            </span>
          </div>
        );
      })}

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 border-2 border-muted-foreground/30 rounded-full mx-auto flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
            </div>
            <p className="font-mono text-xs text-muted-foreground">NO FEED</p>
          </div>
        </div>
      )}

      {/* Status overlay */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
        <span className={cn(
          'font-mono text-[10px] px-2 py-0.5 rounded-sm',
          isActive ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground',
        )}>
          {isActive ? `● REC ${new Date().toLocaleTimeString()}` : 'STANDBY'}
        </span>
      </div>
    </div>
  );
}
