import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, HeartCrack, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CroppedPerson } from '@/hooks/useFaceCropper';
import type { PersonCategory } from '@/hooks/usePersonTracker';

interface MonitoringGridProps {
  croppedPersons: CroppedPerson[];
}

const GRID_SLOTS = 20; // 5x4

const CATEGORY_STYLES: Record<PersonCategory, { borderClass: string; iconBg: string; icon: typeof User; label: string }> = {
  suspect: {
    borderClass: 'border-destructive shadow-[0_0_12px_hsl(var(--destructive)/0.4)]',
    iconBg: 'bg-destructive/20 text-destructive',
    icon: ShieldAlert,
    label: 'SUSPECT',
  },
  victim: {
    borderClass: 'border-warning shadow-[0_0_12px_hsl(var(--warning)/0.4)]',
    iconBg: 'bg-warning/20 text-warning',
    icon: HeartCrack,
    label: 'VICTIM',
  },
  neutral: {
    borderClass: 'border-primary/50',
    iconBg: 'bg-primary/20 text-primary',
    icon: User,
    label: 'NORMAL',
  },
};

function PersonPanel({ person }: { person: CroppedPerson }) {
  const style = CATEGORY_STYLES[person.person.category];
  const Icon = style.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        'relative rounded-md border-2 overflow-hidden bg-card',
        style.borderClass,
        person.person.category === 'suspect' && 'animate-pulse',
      )}
    >
      <img
        src={person.imageDataUrl}
        alt={`Person ${person.id}`}
        className="w-full h-24 object-cover"
      />
      <div className="p-1.5 space-y-0.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[9px] font-bold text-foreground truncate">
            {person.id.toUpperCase()}
          </span>
          <Icon className={cn('w-3 h-3', style.iconBg.split(' ')[1])} />
        </div>
        <div className="flex items-center justify-between">
          <span className={cn('font-mono text-[8px] font-bold tracking-wider px-1 py-px rounded-sm', style.iconBg)}>
            {style.label}
          </span>
          <span className="font-mono text-[8px] text-muted-foreground">
            {person.person.threatScore}%
          </span>
        </div>
        <p className="font-mono text-[8px] text-muted-foreground truncate">
          {person.person.dominantEmotion.toUpperCase()}
        </p>
      </div>
    </motion.div>
  );
}

function EmptySlot() {
  return (
    <div className="rounded-md border border-dashed border-border bg-secondary/20 flex items-center justify-center min-h-[140px]">
      <div className="text-center">
        <div className="w-6 h-6 rounded-full border border-muted-foreground/20 mx-auto flex items-center justify-center">
          <User className="w-3 h-3 text-muted-foreground/30" />
        </div>
        <p className="font-mono text-[8px] text-muted-foreground/40 mt-1">EMPTY</p>
      </div>
    </div>
  );
}

export function MonitoringGrid({ croppedPersons }: MonitoringGridProps) {
  // Sort: suspects first, then victims, then neutral
  const sorted = [...croppedPersons].sort((a, b) => {
    const order: Record<PersonCategory, number> = { suspect: 0, victim: 1, neutral: 2 };
    return order[a.person.category] - order[b.person.category];
  });

  const slots = Array.from({ length: GRID_SLOTS }, (_, i) => sorted[i] || null);

  const suspectCount = sorted.filter(p => p.person.category === 'suspect').length;
  const victimCount = sorted.filter(p => p.person.category === 'victim').length;

  return (
    <div className="space-y-3">
      {/* Grid header stats */}
      <div className="flex items-center gap-4 font-mono text-[10px]">
        <span className="text-muted-foreground">
          TRACKING: <span className="text-foreground font-bold">{croppedPersons.length}</span>/{GRID_SLOTS}
        </span>
        {suspectCount > 0 && (
          <span className="text-destructive font-bold">
            🔴 {suspectCount} SUSPECT{suspectCount > 1 ? 'S' : ''}
          </span>
        )}
        {victimCount > 0 && (
          <span className="text-warning font-bold">
            🟡 {victimCount} VICTIM{victimCount > 1 ? 'S' : ''}
          </span>
        )}
      </div>

      {/* 5x4 grid */}
      <div className="grid grid-cols-5 gap-2">
        <AnimatePresence mode="popLayout">
          {slots.map((person, i) =>
            person ? (
              <PersonPanel key={person.id} person={person} />
            ) : (
              <EmptySlot key={`empty-${i}`} />
            )
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 font-mono text-[9px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Suspect</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Victim</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" /> Normal</span>
      </div>
    </div>
  );
}
