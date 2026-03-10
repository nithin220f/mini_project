import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PanelCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'alert';
}

export function PanelCard({ title, icon, children, className, variant = 'default' }: PanelCardProps) {
  return (
    <div className={cn(
      'rounded-md border bg-card overflow-hidden',
      variant === 'alert' && 'border-destructive/40',
      className,
    )}>
      <div className={cn(
        'flex items-center gap-2 px-4 py-2.5 border-b font-mono text-xs font-semibold tracking-wider uppercase',
        variant === 'default' && 'bg-secondary/50 text-muted-foreground border-border',
        variant === 'alert' && 'bg-destructive/10 text-destructive border-destructive/30',
      )}>
        {icon}
        {title}
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
