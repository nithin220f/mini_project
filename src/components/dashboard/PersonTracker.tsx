import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, UserX, HeartCrack, User, Siren } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { TrackedPerson, PersonCategory } from '@/hooks/usePersonTracker';

interface PersonTrackerProps {
  persons: TrackedPerson[];
  warnings: { id: string; message: string; timestamp: number; category: PersonCategory }[];
  onClearWarnings: () => void;
}

const CATEGORY_CONFIG: Record<PersonCategory, { icon: typeof User; label: string; color: string; bg: string; border: string; badge: string }> = {
  suspect: {
    icon: ShieldAlert,
    label: 'SUSPECT',
    color: 'text-destructive',
    bg: 'bg-destructive/10',
    border: 'border-destructive/30',
    badge: '🔴',
  },
  victim: {
    icon: HeartCrack,
    label: 'VICTIM',
    color: 'text-warning',
    bg: 'bg-warning/10',
    border: 'border-warning/30',
    badge: '🟡',
  },
  neutral: {
    icon: User,
    label: 'NEUTRAL',
    color: 'text-muted-foreground',
    bg: 'bg-secondary/50',
    border: 'border-border',
    badge: '⚪',
  },
};

function PersonCard({ person }: { person: TrackedPerson }) {
  const config = CATEGORY_CONFIG[person.category];
  const Icon = config.icon;
  const duration = Math.round((person.lastSeen - person.firstSeen) / 1000);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={cn(
        'flex items-center gap-3 p-3 rounded-md border',
        config.bg, config.border,
        person.category === 'suspect' && 'animate-pulse-glow',
      )}
    >
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center border', config.border, config.bg)}>
        <Icon className={cn('w-4 h-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-foreground">{person.id.toUpperCase()}</span>
          <span className={cn('font-mono text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-sm', config.bg, config.color)}>
            {config.badge} {config.label}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <span className="font-mono text-[10px] text-muted-foreground">
            Emotion: <span className="text-foreground">{person.dominantEmotion.toUpperCase()}</span>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            Score: <span className={config.color}>{person.threatScore}%</span>
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {duration}s
          </span>
        </div>
      </div>
      {person.warningsSent > 0 && (
        <span className="font-mono text-[10px] text-destructive flex items-center gap-1">
          <Siren className="w-3 h-3" /> {person.warningsSent}
        </span>
      )}
    </motion.div>
  );
}

export function PersonTracker({ persons, warnings, onClearWarnings }: PersonTrackerProps) {
  const suspects = persons.filter(p => p.category === 'suspect');
  const victims = persons.filter(p => p.category === 'victim');
  const all = persons.filter(p => p.category !== 'neutral');

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="w-full bg-secondary/50 border border-border">
        <TabsTrigger value="all" className="flex-1 font-mono text-[10px] tracking-wider data-[state=active]:bg-card">
          ALL ({all.length})
        </TabsTrigger>
        <TabsTrigger value="suspects" className="flex-1 font-mono text-[10px] tracking-wider data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
          🔴 SUSPECTS ({suspects.length})
        </TabsTrigger>
        <TabsTrigger value="victims" className="flex-1 font-mono text-[10px] tracking-wider data-[state=active]:bg-warning/20 data-[state=active]:text-warning">
          🟡 VICTIMS ({victims.length})
        </TabsTrigger>
        <TabsTrigger value="warnings" className="flex-1 font-mono text-[10px] tracking-wider data-[state=active]:bg-destructive/20 data-[state=active]:text-destructive">
          ⚠ ALERTS ({warnings.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all" className="mt-3">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <AnimatePresence>
            {all.length === 0 ? (
              <p className="text-center font-mono text-xs text-muted-foreground py-6">No flagged individuals</p>
            ) : (
              all.map(p => <PersonCard key={p.id} person={p} />)
            )}
          </AnimatePresence>
        </div>
      </TabsContent>

      <TabsContent value="suspects" className="mt-3">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <AnimatePresence>
            {suspects.length === 0 ? (
              <p className="text-center font-mono text-xs text-muted-foreground py-6">No suspects detected</p>
            ) : (
              suspects.map(p => <PersonCard key={p.id} person={p} />)
            )}
          </AnimatePresence>
        </div>
      </TabsContent>

      <TabsContent value="victims" className="mt-3">
        <div className="space-y-2 max-h-60 overflow-y-auto">
          <AnimatePresence>
            {victims.length === 0 ? (
              <p className="text-center font-mono text-xs text-muted-foreground py-6">No victims identified</p>
            ) : (
              victims.map(p => <PersonCard key={p.id} person={p} />)
            )}
          </AnimatePresence>
        </div>
      </TabsContent>

      <TabsContent value="warnings" className="mt-3">
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {warnings.length === 0 ? (
            <p className="text-center font-mono text-xs text-muted-foreground py-6">No warnings issued</p>
          ) : (
            <>
              <button onClick={onClearWarnings} className="font-mono text-[10px] text-destructive hover:underline mb-1">
                CLEAR ALL
              </button>
              {warnings.map(w => (
                <div
                  key={w.id}
                  className={cn(
                    'px-2 py-1.5 rounded-sm font-mono text-[11px] border',
                    w.category === 'suspect' ? 'bg-destructive/10 border-destructive/30 text-destructive' : 'bg-warning/10 border-warning/30 text-warning',
                  )}
                >
                  <span className="text-muted-foreground mr-2">{new Date(w.timestamp).toLocaleTimeString()}</span>
                  {w.message}
                </div>
              ))}
            </>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
