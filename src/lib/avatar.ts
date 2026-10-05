import { createHash } from 'crypto';

/* Gravatar for accounts without a Google photo; d=404 makes the image fail so the UI falls back to initials. */
export function gravatarUrl(email: string, size = 160): string {
  const hash = createHash('md5').update(email.trim().toLowerCase()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=404`;
}
