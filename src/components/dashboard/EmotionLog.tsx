import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { DetectedFace } from '@/hooks/useEmotionDetection';
import type { AudioEmotion } from '@/hooks/useAudioEmotion';

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'face' | 'audio' | 'alert';
  message: string;
}

interface EmotionLogProps {
  faces: DetectedFace[];
  audioEmotion: AudioEmotion;
  threatLevel: 'low' | 'medium' | 'high';
}

export function EmotionLog({ faces, audioEmotion, threatLevel }: EmotionLogProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevThreat = useRef(threatLevel);

  useEffect(() => {
    const time = new Date().toLocaleTimeString();
    const newLogs: LogEntry[] = [];

    if (faces.length > 0) {
      const emotions = faces.map(f => f.emotion).join(', ');
      newLogs.push({
        id: `f-${Date.now()}`,
        timestamp: time,
        type: 'face',
        message: `Detected ${faces.length} face(s): ${emotions}`,
      });
    }

    if (audioEmotion !== 'neutral' && audioEmotion !== 'calm') {
      newLogs.push({
        id: `a-${Date.now()}`,
        timestamp: time,
        type: 'audio',
        message: `Audio: ${audioEmotion.toUpperCase()} detected`,
      });
    }

    if (threatLevel !== prevThreat.current && threatLevel !== 'low') {
      newLogs.push({
        id: `t-${Date.now()}`,
        timestamp: time,
        type: 'alert',
        message: `⚠ Threat level changed to ${threatLevel.toUpperCase()}`,
      });
    }
    prevThreat.current = threatLevel;

    if (newLogs.length > 0) {
      setLogs(prev => [...newLogs, ...prev].slice(0, 50));
    }
  }, [faces, audioEmotion, threatLevel]);

  return (
    <div ref={scrollRef} className="h-40 overflow-y-auto space-y-1 text-[11px] font-mono">
      {logs.length === 0 && (
        <p className="text-muted-foreground text-center py-4">Waiting for input...</p>
      )}
      {logs.map(log => (
        <div key={log.id} className={cn(
          'flex gap-2 px-2 py-1 rounded-sm',
          log.type === 'alert' && 'bg-destructive/10 text-destructive',
          log.type === 'face' && 'text-foreground/70',
          log.type === 'audio' && 'text-accent',
        )}>
          <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
          <span className="truncate">{log.message}</span>
        </div>
      ))}
    </div>
  );
}
