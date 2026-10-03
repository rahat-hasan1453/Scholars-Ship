'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

const FALLBACK_AVATAR = '/profile/avatar-fallback.png';

/** Lets the header menu's "Settings" open My Profile straight into Edit Profile */
export const PROFILE_SETTINGS_EVENT = 'open-profile-settings';
let pendingSettingsRequest = false;

export function consumeProfileSettingsRequest() {
  const pending = pendingSettingsRequest;
  pendingSettingsRequest = false;
  return pending;
}

function requestProfileSettings() {
  pendingSettingsRequest = true;
  window.dispatchEvent(new CustomEvent(PROFILE_SETTINGS_EVENT));
}

async function logout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch {}
  localStorage.removeItem('highscholar_profile_v2');
  window.location.href = '/login';
}

const MenuItem: React.FC<{ icon: string; label: string; onClick: () => void; danger?: boolean }> = ({
  icon,
  label,
  onClick,
  danger,
}) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={
      danger
        ? 'flex w-full items-center gap-[6px] rounded-[6px] bg-[#ffe4e7] px-[6px] py-[4px] text-left transition-colors hover:bg-[#ffd5da]'
        : 'flex w-full items-center gap-[6px] rounded-[6px] px-[6px] py-[4px] text-left transition-colors hover:bg-[#f4f6f8]'
    }
  >
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={icon} alt="" width={16} height={16} className="shrink-0" />
    <span
      className={`min-w-0 flex-1 truncate font-[family-name:var(--font-inter)] text-[14px] leading-[20px] ${
        danger ? 'text-[#e7000b]' : 'text-[#627181]'
      }`}
    >
      {label}
    </span>
  </button>
);

// Figma: "Dropdown Menu" (node 282:5856)
export const ProfileMenuDropdown: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { profile, setActiveNavTab } = useApp();

  const go = (settings: boolean) => {
    if (settings) requestProfileSettings();
    setActiveNavTab('profile');
    onClose();
  };

  return (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 flex w-max min-w-[197px] max-w-[280px] flex-col items-start rounded-[10px] border border-[#e1e8f0] bg-white shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex w-full items-center gap-[8px] border-b border-[#e1e8f0] px-[10px] py-[4px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatar || FALLBACK_AVATAR}
          alt=""
          width={36}
          height={36}
          className="size-[36px] shrink-0 rounded-full border border-[#f4f6f8] object-cover"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="-mb-[2px] truncate text-[16px] leading-[24px] font-[590] text-[#101828]">
            {profile.name || 'Your name'}
          </p>
          <p className="h-[20px] truncate text-[12px] leading-[16px] text-[#627181]">{profile.email}</p>
        </div>
      </div>
      <div className="flex w-full flex-col px-[4px] py-[4px]">
        <MenuItem icon="/profile/menu-user.svg" label="Profile" onClick={() => go(false)} />
        <MenuItem icon="/profile/menu-settings.svg" label="Settings" onClick={() => go(true)} />
      </div>
      <hr className="w-full border-0 border-t border-[#e1e8f0]" />
      <div className="flex w-full flex-col p-[4px]">
        <MenuItem
          icon="/profile/menu-logout.svg"
          label="Log out"
          danger
          onClick={() => {
            onClose();
            logout();
          }}
        />
      </div>
    </div>
  );
};
