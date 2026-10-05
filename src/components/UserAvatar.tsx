'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

export function initialsOf(name?: string, email?: string): string {
  const words = (name || '').trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (email || '?').slice(0, 1).toUpperCase();
}

/* Signed-in user's photo (Google or Gravatar); shows initials when there is none or it fails to load. */
export function UserAvatar({
  src,
  name,
  email,
  alt = '',
  className,
}: {
  src?: string;
  name?: string;
  email?: string;
  alt?: string;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = !!src && failedSrc !== src;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={cn('shrink-0 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <span
      role={alt ? 'img' : undefined}
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      className={cn(
        'flex shrink-0 select-none items-center justify-center rounded-full bg-brand-soft font-[590] text-brand-primary [container-type:size]',
        className
      )}
    >
      <span className="text-[40cqw] leading-none">{initialsOf(name, email)}</span>
    </span>
  );
}
