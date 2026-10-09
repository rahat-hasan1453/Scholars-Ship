/** "Jodi Forlizzi" → "JF" (academic titles skipped) */
export function initials(name: string): string {
  const words = name
    .replace(/\b(Dr|Prof|Professor|Mr|Ms|Mrs)\.?\s+/gi, '')
    .split(/\s+/)
    .filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words;
  return letters.map((w) => w[0]?.toUpperCase() ?? '').join('') || '?';
}

/** SVG data URL with the person's initials, for people we have no real photo of (never a stock photo of someone else). */
export function initialsAvatar(name: string): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">` +
    `<rect width="96" height="96" fill="#EDE9FE"/>` +
    `<text x="48" y="48" dy=".35em" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="36" font-weight="600" fill="#7150E7">${initials(name)}</text>` +
    `</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
