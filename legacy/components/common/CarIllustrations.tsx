import React from 'react';
import { CarType } from '@/types';

interface CarIllustrationProps {
  type: CarType;
  className?: string;
}

export function CarIllustration({ type, className = 'w-full h-full' }: CarIllustrationProps) {
  switch (type) {
    case 'SUV':
      return (
        <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="suvGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
            <linearGradient id="suvGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M36 78H264C270 78 275 73 276 67L280 50C281 45 277 41 272 41H246L214 14C210 11 205 10 200 10H86C81 10 76 13 73 17L44 41H25C20 41 17 45 18 50L23 68C24 74 30 78 36 78Z"
            fill="url(#suvGrad)"
          />
          <path d="M78 16L53 41H138V16H78Z" fill="url(#suvGlass)" />
          <path d="M148 16V41H210L194 16H148Z" fill="url(#suvGlass)" />
          <circle cx="74" cy="80" r="20" fill="#0f172a" />
          <circle cx="74" cy="80" r="10" fill="#cbd5e1" />
          <circle cx="226" cy="80" r="20" fill="#0f172a" />
          <circle cx="226" cy="80" r="10" fill="#cbd5e1" />
          <rect x="90" y="6" width="110" height="4" rx="2" fill="#64748b" />
          <path d="M272 46H278" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 46H26" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'Van':
      return (
        <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="vanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#4338ca" />
            </linearGradient>
            <linearGradient id="vanGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#e0e7ff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <path
            d="M30 78H270C276 78 280 73 280 67V36C280 29 275 24 268 24H94C88 24 82 27 78 32L54 52H28C22 52 18 57 19 63L22 70C23 75 26 78 30 78Z"
            fill="url(#vanGrad)"
          />
          <path d="M82 28L62 50H112V28H82Z" fill="url(#vanGlass)" />
          <rect x="122" y="28" width="60" height="22" rx="3" fill="url(#vanGlass)" />
          <rect x="192" y="28" width="64" height="22" rx="3" fill="url(#vanGlass)" />
          <circle cx="72" cy="80" r="18" fill="#1e1b4b" />
          <circle cx="72" cy="80" r="9" fill="#94a3b8" />
          <circle cx="228" cy="80" r="18" fill="#1e1b4b" />
          <circle cx="228" cy="80" r="9" fill="#94a3b8" />
          <path d="M275 56H279" stroke="#fef08a" strokeWidth="5" strokeLinecap="round" />
          <path d="M20 56H25" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" />
        </svg>
      );

    case 'Pickup':
      return (
        <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="pickupGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
            <linearGradient id="pickupGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffedd5" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <path
            d="M34 78H264C270 78 275 73 276 67L277 52C278 46 273 42 267 42H184V20C184 14 179 10 173 10H88C83 10 78 13 74 18L44 42H25C20 42 17 46 18 51L22 68C23 74 28 78 34 78Z"
            fill="url(#pickupGrad)"
          />
          <path d="M78 16L54 40H116V16H78Z" fill="url(#pickupGlass)" />
          <path d="M124 16V40H174V16H124Z" fill="url(#pickupGlass)" />
          <circle cx="76" cy="80" r="20" fill="#292524" />
          <circle cx="76" cy="80" r="10" fill="#a8a29e" />
          <circle cx="224" cy="80" r="20" fill="#292524" />
          <circle cx="224" cy="80" r="10" fill="#a8a29e" />
          <path d="M184 22V78" stroke="#b45309" strokeWidth="3" />
          <path d="M272 48H277" stroke="#fef08a" strokeWidth="4" strokeLinecap="round" />
          <path d="M20 48H25" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );

    case 'Sedan':
    default:
      return (
        <svg viewBox="0 0 300 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
          <defs>
            <linearGradient id="sedanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#6d28d9" />
            </linearGradient>
            <linearGradient id="sedanGlass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f3e8ff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#ddd6fe" stopOpacity="0.75" />
            </linearGradient>
          </defs>
          <path
            d="M40 78H260C266 78 272 73 273 66L278 52C279 48 276 44 272 44H240L208 22C204 19 198 18 193 18H106C100 18 95 21 91 26L68 44H28C23 44 20 48 21 52L26 67C27 73 33 78 40 78Z"
            fill="url(#sedanGrad)"
          />
          <path d="M96 24L74 44H140V24H96Z" fill="url(#sedanGlass)" />
          <path d="M150 24V44H204L188 24H150Z" fill="url(#sedanGlass)" />
          <circle cx="76" cy="80" r="18" fill="#1e293b" />
          <circle cx="76" cy="80" r="9" fill="#94a3b8" />
          <circle cx="224" cy="80" r="18" fill="#1e293b" />
          <circle cx="224" cy="80" r="9" fill="#94a3b8" />
          <path d="M268 48H275" stroke="#fde047" strokeWidth="4" strokeLinecap="round" />
          <path d="M23 48H28" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
  }
}
