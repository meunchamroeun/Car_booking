import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-violet-600 text-white shadow-xs hover:bg-violet-700',
        secondary:
          'border-transparent bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 hover:bg-slate-200',
        destructive:
          'border-transparent bg-red-500 text-white shadow-xs hover:bg-red-600',
        outline: 'text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800',
        success:
          'border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400',
        warning:
          'border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400',
        info:
          'border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
