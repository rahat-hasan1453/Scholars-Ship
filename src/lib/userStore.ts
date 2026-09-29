import fs from 'fs';
import path from 'path';
import { AuthSessionUser } from './auth';

export interface StoredUser {
  id: string;
  email: string;
  name: string;
  password?: string;
  avatar?: string;
  googleId?: string;
  onboardingCompleted: boolean;
  profileData?: any;
  createdAt: string;
}

export interface StoredOtp {
  code: string;
  email: string;
  expiresAt: number;
}

// In-memory caches backed by filesystem fallback for local development resilience
const globalStore = global as unknown as {
  __highscholar_users?: Map<string, StoredUser>;
  __highscholar_otps?: Map<string, StoredOtp>;
};

if (!globalStore.__highscholar_users) {
  globalStore.__highscholar_users = new Map();
  // Seed demo returning user
  globalStore.__highscholar_users.set('alex.mercer@scholar.io', {
    id: 'usr_default_01',
    email: 'alex.mercer@scholar.io',
    name: 'Alex Mercer',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
    onboardingCompleted: true,
    createdAt: new Date().toISOString(),
  });
}

if (!globalStore.__highscholar_otps) {
  globalStore.__highscholar_otps = new Map();
}

const usersMap = globalStore.__highscholar_users;
const otpsMap = globalStore.__highscholar_otps;

const STORAGE_FILE = path.join(process.cwd(), '.next', 'highscholar_users.json');

function tryPersistToDisk() {
  try {
    const list = Array.from(usersMap.values());
    const dir = path.dirname(STORAGE_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list, null, 2), 'utf-8');
  } catch {
    // Non-fatal if disk write fails in restricted environments
  }
}

function tryHydrateFromDisk() {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const raw = fs.readFileSync(STORAGE_FILE, 'utf-8');
      const list: StoredUser[] = JSON.parse(raw);
      list.forEach((u) => {
        if (u.email) {
          usersMap.set(u.email.toLowerCase(), u);
        }
      });
    }
  } catch {
    // Non-fatal
  }
}

// Attempt initial hydrate
tryHydrateFromDisk();

export function getUserByEmail(email: string): StoredUser | null {
  const normalized = email.trim().toLowerCase();
  return usersMap.get(normalized) || null;
}

export function saveUser(user: StoredUser): StoredUser {
  const normalized = user.email.trim().toLowerCase();
  usersMap.set(normalized, { ...user, email: normalized });
  tryPersistToDisk();
  return usersMap.get(normalized)!;
}

export function updateUser(email: string, updates: Partial<StoredUser>): StoredUser | null {
  const existing = getUserByEmail(email);
  if (!existing) return null;
  const updated = {
    ...existing,
    ...updates,
  };
  return saveUser(updated);
}

export function setOtp(email: string, code: string, ttlSeconds = 600) {
  const normalized = email.trim().toLowerCase();
  otpsMap.set(normalized, {
    code,
    email: normalized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function verifyOtp(email: string, inputCode: string): { valid: boolean; reason?: string } {
  const normalized = email.trim().toLowerCase();
  const record = otpsMap.get(normalized);
  if (!record) {
    return { valid: false, reason: 'No verification code found. Please request a new code.' };
  }
  if (Date.now() > record.expiresAt) {
    otpsMap.delete(normalized);
    return { valid: false, reason: 'Verification code has expired. Please request a new code.' };
  }
  if (record.code !== inputCode.trim()) {
    return { valid: false, reason: 'Invalid verification code. Please check your email and try again.' };
  }
  // OTP is valid - consume it
  otpsMap.delete(normalized);
  return { valid: true };
}

export function toSessionUser(user: StoredUser): AuthSessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    googleId: user.googleId,
    onboardingCompleted: user.onboardingCompleted,
  };
}
