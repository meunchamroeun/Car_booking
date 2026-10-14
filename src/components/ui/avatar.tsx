import { cn } from '@/lib/utils';

const tones = ['bg-primary-soft text-primary', 'bg-info-soft text-info', 'bg-success-soft text-success', 'bg-warning-soft text-warning'];

export function Avatar({ initials, className, seed }: { initials: string; className?: string; seed?: string }) {
  const tone = tones[[...(seed ?? initials)].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length];
  return (
    <span className={cn('inline-flex size-10 shrink-0 select-none items-center justify-center rounded-full text-[13px] font-bold', tone, className)}>
      {initials}
    </span>
  );
}
