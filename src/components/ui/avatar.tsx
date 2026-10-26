'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const tones = ['bg-primary-soft text-primary', 'bg-info-soft text-info', 'bg-success-soft text-success', 'bg-warning-soft text-warning'];

export function Avatar({
  initials,
  className,
  seed,
  src,
  alt,
}: {
  initials: string;
  className?: string;
  seed?: string;
  src?: string;
  alt?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const tone = tones[[...(seed ?? initials)].reduce((a, c) => a + c.charCodeAt(0), 0) % tones.length];

  if (src && !failed) {
    return (
      <span className={cn('relative inline-flex size-10 shrink-0 select-none overflow-hidden rounded-full bg-muted', className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt ?? initials}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      </span>
    );
  }

  return (
    <span className={cn('inline-flex size-10 shrink-0 select-none items-center justify-center rounded-full text-[13px] font-bold', tone, className)}>
      {initials}
    </span>
  );
}
