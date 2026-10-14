import * as React from 'react';
import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, desc, action, className }: { icon: React.ReactNode; title: string; desc?: string; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center rounded-xl border border-dashed bg-card/60 px-6 py-10 text-center', className)}>
      <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary [&_svg]:size-6">{icon}</div>
      <p className="text-[15px] font-semibold">{title}</p>
      {desc && <p className="mt-1 max-w-[260px] text-[13px] text-muted-foreground">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
