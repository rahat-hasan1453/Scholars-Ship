import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Scholarship, UserProfile } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface CountdownInfo {
  days: number;
  hours: number;
  minutes: number;
  isExpired: boolean;
  urgency: 'urgent' | 'warning' | 'normal';
  formatted: string;
}

export function calculateCountdown(deadlineStr: string): CountdownInfo {
  const target = new Date(deadlineStr).getTime();
  const now = new Date().getTime();
  const diff = target - now;

  if (diff <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isExpired: true,
      urgency: 'urgent',
      formatted: 'Deadline Passed',
    };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  let urgency: 'urgent' | 'warning' | 'normal' = 'normal';
  if (days <= 7) {
    urgency = 'urgent'; // Red/Crimson
  } else if (days <= 30) {
    urgency = 'warning'; // Muted Gold
  }

  let formatted = `${days}d ${hours}h left`;
  if (days === 0) {
    formatted = `${hours}h ${minutes}m left!`;
  }

  return { days, hours, minutes, isExpired: false, urgency, formatted };
}

export function calculateMatchScore(scholarship: Scholarship, profile: UserProfile): number {
  let score = 50; // base score

  // Degree check (+25%)
  if (scholarship.degreeLevels.includes(profile.degreeLevel)) {
    score += 25;
  }

  // Country check (+15%)
  const countryMatch = scholarship.countries.some((c) =>
    profile.targetCountries.some((tc) => tc.toLowerCase() === c.toLowerCase())
  );
  if (countryMatch) {
    score += 15;
  }

  // Specialization check (+10%)
  const specMatch = scholarship.specializations.some((s) =>
    profile.specializations.some((ps) => ps.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ps.toLowerCase()))
  );
  if (specMatch) {
    score += 10;
  }

  // Cap at 99%
  return Math.min(score, 99);
}

export function formatFunding(type: string): string {
  switch (type) {
    case 'FULL':
      return 'Fully Funded';
    case 'PARTIAL':
      return 'Partial Funding';
    case 'TUITION_WAIVER':
      return 'Tuition Waiver';
    default:
      return 'Grant / Stipend';
  }
}
