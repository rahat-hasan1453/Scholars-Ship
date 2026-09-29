'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function LoginPage() {
  const router = useRouter();
  const { updateProfile } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'google_config_missing') {
        setError('Google OAuth credentials not configured in .env.local yet. See .env.example for quick setup.');
      } else if (err) {
        setError(`Authentication error: ${err.replace(/_/g, ' ')}`);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

      const user = data.user;
      const isUserOnboarded = user.onboardingCompleted === true;

      // Update client context
      updateProfile({
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        onboardingCompleted: isUserOnboarded,
        ...(data.profileData || {}),
      });

      if (typeof window !== 'undefined') {
        if (isUserOnboarded) {
          localStorage.setItem(`highscholar_onboarded_${user.email}`, 'true');
        } else {
          localStorage.removeItem(`highscholar_onboarded_${user.email}`);
        }
      }

      setIsLoading(false);

      if (isUserOnboarded) {
        router.push('/');
      } else {
        router.push('/onboarding');
      }
    } catch (err) {
      console.error(err);
      setError('Network error during login. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setIsGoogleLoading(true);
    setError('');
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen w-full bg-white flex flex-col lg:flex-row relative overflow-hidden font-sans">
      
      {/* ========================================================================= */}
      {/* LEFT COLUMN: Full Bleed Graduation Hero Banner (Node 31:368 / 31:370)     */}
      {/* ========================================================================= */}
      <div className="w-full lg:w-[47%] xl:w-[46.88%] h-[320px] sm:h-[400px] lg:h-screen relative overflow-hidden select-none shrink-0">
        <img
          src="/login-figma-banner.jpg"
          alt="HighScholar Graduate Celebration"
          className="w-full h-full object-cover object-center"
        />
      </div>

      {/* ========================================================================= */}
      {/* RIGHT COLUMN: Canvas with Faint Chevron Watermark + Floating Login Card  */}
      {/* ========================================================================= */}
      <div className="flex-1 relative min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-12 overflow-y-auto bg-white">
        
        {/* Faint Background Watermark Vectors (Figma Nodes 31:545 & 31:546) */}
        <div 
          className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0"
          aria-hidden="true"
        >
          <img
            src="/login-chevron-top.svg"
            alt=""
            className="absolute -right-10 top-0 w-[820px] max-w-none opacity-[0.035] pointer-events-none"
          />
          <img
            src="/login-chevron-bottom.svg"
            alt=""
            className="absolute -right-10 bottom-0 w-[820px] max-w-none opacity-[0.035] pointer-events-none"
          />
        </div>

        {/* Central Container: Card + Bottom Signup Link */}
        <div className="relative z-10 w-full max-w-[472px] flex flex-col items-center my-auto py-6 sm:py-10">
          
          {/* ===================================================================== */}
          {/* Main Floating White Login Card (Figma Frame 31:343 / 122:10160)       */}
          {/* Specs: Width 472px, Padding 36px 24px, Radius 24px, Fill #FFF        */}
          {/* ===================================================================== */}
          <div className="w-full bg-white rounded-[24px] p-6 sm:px-9 sm:py-9 shadow-[0_10px_40px_rgba(112,80,230,0.06)] border border-[#F2F4F7]">
            
            {/* 1. Official HighScholar Brand Logo Header (Node 122:10193) */}
            <div className="mb-6">
              <img
                src="/highscholar-logo-purple.png"
                alt="HighScholar"
                className="h-[28px] sm:h-[30px] w-auto object-contain"
              />
            </div>

            {/* 2. Title and Subtitle (Nodes 122:10165 & 122:10166) */}
            <div className="mb-7">
              <h1 className="text-[24px] font-semibold text-[#212B36] tracking-tight leading-[32px]">
                Welcome back!
              </h1>
              <p className="text-[20px] font-semibold text-[#637381] leading-[24px] mt-1">
                Sign in to continue
              </p>
            </div>

            {/* Error Message Alert */}
            {error && (
              <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            {/* Quick Demo Helper Chip */}
            <div className="mb-4 px-3 py-2 rounded-[16px] bg-[#F9F5FF] border border-[#E9D7FE] flex items-center justify-between text-xs text-[#6941C6]">
              <span className="truncate">Demo: <strong>alex.mercer@scholar.io</strong></span>
              <button
                type="button"
                onClick={() => {
                  setEmail('alex.mercer@scholar.io');
                  setPassword('password123');
                }}
                className="text-[11px] underline font-semibold cursor-pointer hover:text-[#5925DC] shrink-0 ml-2"
              >
                Autofill
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email Input (Node 122:10169: 401×52px, Radius 20px, Border #E1E8F0) */}
              <div>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="w-full h-[52px] px-4 rounded-[20px] border border-[#E1E8F0] bg-white text-sm text-[#212B36] placeholder:text-[#919EAB] placeholder:text-xs focus:outline-hidden focus:border-[#704FE6] focus:ring-1 focus:ring-[#704FE6] transition-all shadow-2xs"
                />
              </div>

              {/* Password Input & Eye Toggle (Node 122:10174: 401×52px, Radius 20px) */}
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full h-[52px] pl-4 pr-11 rounded-[20px] border border-[#E1E8F0] bg-white text-sm text-[#212B36] placeholder:text-[#919EAB] placeholder:text-xs focus:outline-hidden focus:border-[#704FE6] focus:ring-1 focus:ring-[#704FE6] transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#919EAB] hover:text-[#637381] transition-colors cursor-pointer p-1"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Left-Aligned "Forgot password?" Link (Node 122:10189) */}
                <div className="pt-2 pl-1">
                  <a
                    href="#forgot-password"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('A password reset link will be sent if an account matches.');
                    }}
                    className="text-[12px] text-[#919EAB] hover:text-[#704FE6] font-normal transition-colors cursor-pointer inline-block"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              {/* Login Button (Node 122:10182: 401×40px, Radius 20px, Solid #704FE6) */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="w-full h-[40px] bg-[#704FE6] hover:bg-[#603ddb] active:scale-[0.99] text-white font-bold text-[12px] rounded-[20px] transition-all shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Login</span>
                  )}
                </button>
              </div>

            </form>

            {/* Divider: "OR SIGN IN WITH EMAIL" (Node 122:10228) */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#EAECF0]" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-[#98A2B3] font-medium uppercase tracking-[0.62px] text-[10px]">
                  Or sign in with email
                </span>
              </div>
            </div>

            {/* Google OAuth Button (Node 122:10219: 401×44px, Radius 20px, Border #7150E7) */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={isGoogleLoading || isLoading}
              className="w-full h-[44px] bg-white hover:bg-[#F9F8FE] active:scale-[0.99] border border-[#7150E7] text-[#344054] text-sm font-semibold rounded-[20px] transition-all shadow-2xs flex items-center justify-center gap-3 cursor-pointer disabled:opacity-75"
            >
              {isGoogleLoading ? (
                <div className="w-4 h-4 border-2 border-slate-300 border-t-[#7150E7] rounded-full animate-spin" />
              ) : (
                <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>{isGoogleLoading ? 'Connecting with Google...' : 'Continue with Google'}</span>
            </button>

          </div>

          {/* ===================================================================== */}
          {/* Bottom Footer Section (Node 151:10275: "Don’t have an account? Sign up now!") */}
          {/* ===================================================================== */}
          <div className="pt-6 text-center">
            <p className="text-[12px] text-[#637381]">
              Don&apos;t have an account?{' '}
              <Link 
                href="/signup" 
                className="text-[#101828] hover:text-[#704FE6] font-semibold text-[14px] transition-colors ml-1"
              >
                Sign up now!
              </Link>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
