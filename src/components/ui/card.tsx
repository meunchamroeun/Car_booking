import * as React from 'react';
import { cn } from '@/lib/utils';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }>(
  ({ className, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border bg-card text-card-foreground shadow-card',
        interactive && 'cursor-pointer transition-[transform,box-shadow] hover:shadow-float active:scale-[0.99]',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

export function SectionHeader({ title, action, className }: { title: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-2.5 mt-6 flex items-center justify-between px-1', className)}>
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function PageHeader({ title, subtitle, action, compact }: { title: string; subtitle?: string; action?: React.ReactNode; compact?: boolean }) {
  const Heading = compact ? 'h2' : 'h1';
  return (
    <div className={cn('flex items-end justify-between gap-3 px-1', compact ? 'pb-3' : 'pb-4 pt-2')}>
      <div className="min-w-0">
        <Heading className={cn('font-bold leading-tight tracking-tight', compact ? 'text-[19px]' : 'text-[24px]')}>{title}</Heading>
        {subtitle && <p className="mt-0.5 text-[13.5px] text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
