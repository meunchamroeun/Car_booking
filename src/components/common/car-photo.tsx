'use client';

import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Camera, CarFront, Maximize2, Users, X } from 'lucide-react';
import { Car } from '@/types';
import { useApp } from '@/lib/store';
import { CarArt } from '@/components/common/car-art';
import { cn } from '@/lib/utils';

/**
 * Real vehicle photo, cropped to fill its box. Falls back to the drawn
 * illustration when the car has no photo or the image fails to load.
 * With `zoomable`, tapping it opens the full photo in a popup.
 */
export function CarPhoto({ car, className, zoomable }: { car?: Car; className?: string; zoomable?: boolean }) {
  const { t } = useApp();
  const [failed, setFailed] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const showPhoto = !!car?.imageUrl && !failed;
  const canZoom = zoomable && showPhoto && !!car;

  const content = (
    <>
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
          className={cn('absolute inset-0 size-full object-cover transition-[opacity,transform] duration-300', loaded ? 'opacity-100' : 'opacity-0', canZoom && 'group-hover:scale-105')}
        />
      ) : null}
      {(!showPhoto || !loaded) && car && (
        <div className={cn('flex size-full items-center justify-center px-1.5 text-foreground', showPhoto && 'animate-pulse')}>
          <CarArt type={car.type} color={car.color} />
        </div>
      )}
      {canZoom && loaded && (
        <span className="absolute bottom-1 right-1 flex size-5.5 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm shadow-xs transition-transform group-hover:scale-110">
          <Maximize2 className="size-3" />
        </span>
      )}
    </>
  );

  if (!canZoom) return <div className={cn('relative overflow-hidden bg-muted', className)}>{content}</div>;

  return (
    <>
      <button
        type="button"
        aria-label={t('a11y_view_photo', { car: car!.name })}
        // Don't let the tap also trigger the card's own action (e.g. booking)
        onClick={e => {
          e.stopPropagation();
          setOpen(true);
        }}
        onKeyDown={e => e.stopPropagation()}
        className={cn('group relative block overflow-hidden bg-muted', className)}
      >
        {content}
      </button>
      <PhotoViewer car={car!} open={open} onOpenChange={setOpen} />
    </>
  );
}

/** Full-size photo popup with the car's key details. */
function PhotoViewer({ car, open, onOpenChange }: { car: Car; open: boolean; onOpenChange: (o: boolean) => void }) {
  const { t } = useApp();
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay onClick={e => e.stopPropagation()} className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        {/* React events bubble out of portals, so stop them reaching the card underneath */}
        <Dialog.Content
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          className="fixed left-1/2 top-1/2 z-[70] w-[calc(100%-32px)] max-w-[480px] -translate-x-1/2 -translate-y-1/2 outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <div className="overflow-hidden rounded-3xl bg-card shadow-float">
            <div className="relative bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={car.imageUrl} alt={car.name} className="max-h-[60dvh] w-full object-contain" />
              <Dialog.Close
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur hover:bg-black/70"
                aria-label={t('close')}
              >
                <X className="size-[18px]" />
              </Dialog.Close>
            </div>
            <div className="p-4">
              <Dialog.Title className="text-[17px] font-bold">{car.name}</Dialog.Title>
              <Dialog.Description className="font-mono text-[12.5px] text-muted-foreground">{car.plate}</Dialog.Description>
              <div className="mt-2.5 flex flex-wrap gap-2 text-[12.5px] font-medium">
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                  <Users className="size-3.5" /> {t('seats', { n: car.seats })}
                </span>
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
                  <CarFront className="size-3.5" /> {t(`type_${car.type}`)}
                </span>
              </div>
              {car.imageCredit && (
                <p className="mt-3 flex items-start gap-1.5 text-[11px] text-muted-foreground">
                  <Camera className="mt-px size-3 shrink-0" /> {car.imageCredit}
                </p>
              )}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
