'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, ChevronDown, Check } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState({ code: 'en', name: 'English', flag: '🇬🇧' });
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'jp', name: '日本語', flag: '🇯🇵' },
  ];

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      setIsLoading(false);
      router.push('/');
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row relative overflow-hidden font-sans">
      
      {/* LEFT COLUMN: Hero Banner Card (Real React/HTML Component with live typography) */}
      <div className="w-full lg:w-[48%] xl:w-[46%] p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="relative rounded-[28px] sm:rounded-[32px] overflow-hidden w-full h-full min-h-[540px] lg:min-h-[calc(100vh-64px)] shadow-xl select-none flex flex-col justify-between p-7 sm:p-10 lg:p-12 text-white">
          
          {/* Background Graduation Photo */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: `url('/login-bg-clean.png')` }}
          />

          {/* Dark Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/20" />

          {/* Top: Live Official HighScholar Brand Logo & Text */}
          <div className="relative z-10 flex items-center gap-2.5">
            <img 
              src="/highscholar-logo-white.png" 
              alt="HighScholar Logo" 
              className="w-7 h-7 object-contain shrink-0" 
            />
            <span className="font-extrabold text-white text-xl tracking-tight">
              HighScholar
            </span>
          </div>

          {/* Bottom: Live Headline & Description Typography */}
          <div className="relative z-10 max-w-md">
            <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-bold text-white leading-tight tracking-tight drop-shadow-sm">
              Manage your workflow digitally
            </h2>
            <p className="text-xs sm:text-sm text-white/90 leading-relaxed mt-3 font-normal drop-shadow-xs">
              Manage your workflows digitally from one centralized platform. Plan, organize, and control daily operations efficiently.
            </p>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: Full Height Canvas with Background Shapes & Login Section (Figma Node 31-337) */}
      <div className="flex-1 relative flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-hidden bg-white">
        
        {/* Two Chevron Background Vectors (Figma Nodes 31-546 & 31-545: 814.94px x 454.39px) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <svg 
            className="absolute inset-0 w-full h-full object-cover" 
            viewBox="0 0 815 835" 
            preserveAspectRatio="none"
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Upper Chevron Vector (Node 31-546) */}
            <path 
              d="M0 60 L407 260 L815 60 L815 220 L407 420 L0 220 Z" 
              fill="#F4F1FD" 
              opacity="0.85"
            />
            {/* Lower Chevron Vector (Node 31-545) */}
            <path 
              d="M0 450 L407 650 L815 450 L815 610 L407 810 L0 610 Z" 
              fill="#F4F1FD" 
              opacity="0.85"
            />
          </svg>
        </div>

        {/* Floating White Login Card (Figma Node 31-342: 449px x 479px) */}
        <div className="relative z-10 w-full max-w-[449px] bg-white rounded-[24px] sm:rounded-[28px] p-8 sm:p-10 shadow-[0_20px_50px_rgba(113,80,231,0.06)] border border-[#EAECF0]/80">
          
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-[28px] font-bold text-[#101828] tracking-tight">
              Welcome back!
            </h1>
            <p className="text-xs sm:text-sm text-[#475467] mt-1.5 font-normal">
              Sign in to continue
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                required
                className="w-full h-11 px-4 rounded-xl border border-[#D0D5DD] bg-white text-xs sm:text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7] focus:border-transparent transition-all shadow-2xs"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full h-11 pl-4 pr-11 rounded-xl border border-[#D0D5DD] bg-white text-xs sm:text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-hidden focus:ring-2 focus:ring-[#7150E7] focus:border-transparent transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#98A2B3] hover:text-[#475467] transition-colors cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-start pt-1">
                <a
                  href="#forgot"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('Password reset link sent to your email.');
                  }}
                  className="text-xs text-[#475467] hover:text-[#7150E7] font-normal transition-colors cursor-pointer"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 bg-[#6941C6] hover:bg-[#5925DC] active:scale-[0.99] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Login</span>
                )}
              </button>
            </div>
          </form>

          {/* Bottom Language Selector (Exact Figma: only English dropdown) */}
          <div className="pt-6 border-t border-[#EAECF0] mt-6 flex items-center justify-start relative">
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="h-8 px-2.5 rounded-lg hover:bg-slate-100/80 text-xs font-medium text-[#344054] inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <span className="text-sm leading-none">{selectedLanguage.flag}</span>
                <span>{selectedLanguage.name}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-[#667085] transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute left-0 bottom-full mb-2 w-44 bg-white rounded-2xl border border-[#E4E7EC] shadow-xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setSelectedLanguage(lang);
                        setIsLangOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer text-left ${
                        selectedLanguage.code === lang.code
                          ? 'bg-[#F4F3FE] text-[#7150E7] font-semibold'
                          : 'text-[#344054] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </span>
                      {selectedLanguage.code === lang.code && (
                        <Check className="w-3.5 h-3.5 text-[#7150E7]" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
