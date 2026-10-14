import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold', {
  variants: {
    tone: {
      neutral: 'bg-muted text-muted-foreground',
      primary: 'bg-primary-soft text-primary',
      success: 'bg-success-soft text-success',
      warning: 'bg-warning-soft text-warning',
      danger: 'bg-destructive-soft text-destructive',
      info: 'bg-info-soft text-info',
      glass: 'bg-white/15 text-white ring-1 ring-inset ring-white/20',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export function Badge({ className, tone, dot, children, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants> & { dot?: boolean }) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
