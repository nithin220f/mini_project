import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AudioEmotion } from '@/hooks/useAudioEmotion';

const EMOTION_DISPLAY: Record<AudioEmotion, { label: string; color: string }> = {
  neutral: { label: 'NEUTRAL', color: 'text-muted-foreground' },
  calm: { label: 'CALM', color: 'text-primary' },
  stress: { label: 'STRESS', color: 'text-warning' },
  aggression: { label: 'AGGRESSION', color: 'text-destructive' },
  fear: { label: 'FEAR', color: 'text-warning' },
};

interface AudioPanelProps {
  emotion: AudioEmotion;
  volume: number;
  isListening: boolean;
}

export function AudioPanel({ emotion, volume, isListening }: AudioPanelProps) {
  const display = EMOTION_DISPLAY[emotion];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isListening ? (
            <Mic className="w-4 h-4 text-primary animate-pulse" />
          ) : (
            <MicOff className="w-4 h-4 text-muted-foreground" />
          )}
          <span className="font-mono text-xs text-muted-foreground">
            {isListening ? 'LISTENING' : 'INACTIVE'}
          </span>
        </div>
        <span className={cn('font-mono text-sm font-bold tracking-widest', display.color)}>
          {display.label}
        </span>
      </div>

      {/* Volume meter */}
      <div className="space-y-1">
        <span className="font-mono text-[10px] text-muted-foreground">VOLUME LEVEL</span>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className={cn(
              'h-full rounded-full',
              volume > 70 ? 'bg-destructive' : volume > 40 ? 'bg-warning' : 'bg-primary',
            )}
            animate={{ width: `${volume}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
      </div>

      {/* Waveform visualization */}
      <div className="flex items-end justify-center gap-[2px] h-12">
        {Array.from({ length: 32 }).map((_, i) => {
          const h = isListening ? Math.random() * volume * 0.8 + 5 : 3;
          return (
            <motion.div
              key={i}
              className={cn(
                'w-1 rounded-full',
                emotion === 'aggression' ? 'bg-destructive/70' :
                emotion === 'stress' ? 'bg-warning/70' : 'bg-primary/50',
              )}
              animate={{ height: h }}
              transition={{ duration: 0.15 }}
            />
          );
        })}
      </div>
    </div>
  );
}