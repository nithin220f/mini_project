import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'warning' | 'danger';
  label: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm font-mono text-xs font-medium tracking-wider uppercase',
      status === 'active' && 'bg-primary/10 text-primary border border-primary/30',
      status === 'inactive' && 'bg-muted text-muted-foreground border border-border',
      status === 'warning' && 'bg-warning/10 text-warning border border-warning/30',
      status === 'danger' && 'bg-destructive/10 text-destructive border border-destructive/30',
    )}>
      <span className={cn(
        'w-1.5 h-1.5 rounded-full',
        status === 'active' && 'bg-primary animate-pulse',
        status === 'inactive' && 'bg-muted-foreground',
        status === 'warning' && 'bg-warning animate-pulse',
        status === 'danger' && 'bg-destructive animate-pulse',
      )} />
      {label}
    </span>
  );
}
