'use client';

import * as React from 'react';
import { Car } from '@/types';
import { CarArt } from '@/components/common/car-art';
import { cn } from '@/lib/utils';

/**
 * Real vehicle photo, cropped to fill its box. Falls back to the drawn
 * illustration when the car has no photo or the image fails to load.
 */
export function CarPhoto({ car, className }: { car?: Car; className?: string }) {
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const showPhoto = !!car?.imageUrl && !failed;

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {showPhoto ? (
        // Plain <img>: photos come from any host the backend stores, no next/image domain config needed
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={car!.imageUrl}
          alt={car!.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn('absolute inset-0 size-full object-cover transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0')}
        />
      ) : null}
      {(!showPhoto || !loaded) && car && (
        <div className={cn('flex size-full items-center justify-center px-1.5 text-foreground', showPhoto && 'animate-pulse')}>
          <CarArt type={car.type} color={car.color} />
        </div>
      )}
    </div>
  );
}
