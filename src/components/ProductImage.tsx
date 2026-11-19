import { useState } from 'react';
import { Headphones, Smartphone } from 'lucide-react';
import type { ProductKind } from '../types/crm';

interface ProductImageProps {
  src: string;
  alt: string;
  kind?: ProductKind;
  className?: string;
}

export function ProductImage({ src, alt, kind = 'PHONE', className = 'h-12 w-12' }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400 ${className}`}
        aria-label={alt}
      >
        {kind === 'PHONE' ? (
          <Smartphone className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Headphones className="h-5 w-5" aria-hidden="true" />
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg border border-slate-200 bg-slate-50 object-cover ${className}`}
    />
  );
}
