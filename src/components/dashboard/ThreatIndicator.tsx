import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ThreatIndicatorProps {
  level: 'low' | 'medium' | 'high';
  faceCount: number;
}

const config = {
  low: { icon: Shield, label: 'LOW THREAT', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/30' },
  medium: { icon: AlertTriangle, label: 'ELEVATED', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/30' },
  high: { icon: ShieldAlert, label: 'HIGH ALERT', color: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/30' },
};

export function ThreatIndicator({ level, faceCount }: ThreatIndicatorProps) {
  const { icon: Icon, label, color, bg, border } = config[level];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={level}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={cn(
          'flex flex-col items-center justify-center gap-3 p-6 rounded-md border',
          bg, border,
          level === 'high' && 'animate-pulse-glow',
        )}
      >
        <Icon className={cn('w-10 h-10', color)} />
        <span className={cn('font-mono text-lg font-bold tracking-widest', color)}>{label}</span>
        <span className="font-mono text-xs text-muted-foreground">
          {faceCount} face{faceCount !== 1 ? 's' : ''} detected
        </span>
      </motion.div>
    </AnimatePresence>
  );
}
