'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Scholarship, Professor } from '@/types';
import { 
  X, 
  Puzzle, 
  Send, 
  CheckCircle2, 
  Code2, 
  Globe, 
  Sparkles,
  Key
} from 'lucide-react';

interface ChromeExtensionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChromeExtensionDrawer: React.FC<ChromeExtensionDrawerProps> = ({ isOpen, onClose }) => {
  const { addScholarship, addProfessor } = useApp();
  const [activeTab, setActiveTab] = useState<'scholarship' | 'professor'>('scholarship');
  const [apiKey, setApiKey] = useState('highscholar_live_ext_sec_9941');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('MIT Presidential Fellowship 2026');
  const [provider, setProvider] = useState('Massachusetts Institute of Technology');
  const [deadline, setDeadline] = useState('2026-11-20T23:59:59Z');
  const [fundingAmount, setFundingAmount] = useState('Full Tuition + $4,100/mo stipend + Health Insurance');
  const [countries, setCountries] = useState('USA');
  const [specializations, setSpecializations] = useState('Computer Science, Artificial Intelligence, Robotics');
  const [officialUrl, setOfficialUrl] = useState('https://gradadmissions.mit.edu/costs-funding/fellowships');
  const [description, setDescription] = useState('Premier graduate fellowship awarded to incoming PhD students exhibiting extraordinary research capability.');

  // Professor Form states
  const [profName, setProfName] = useState('Dr. Pieter Abbeel');
  const [profTitle, setProfTitle] = useState('Professor of EECS & Director of Robot Learning Lab');
  const [university, setUniversity] = useState('UC Berkeley');
  const [department, setDepartment] = useState('Department of Electrical Engineering and Computer Sciences');
  const [profCountry, setProfCountry] = useState('USA');
  const [researchTags, setResearchTags] = useState('Deep Reinforcement Learning, Robotics, Foundation Models');
  const [grants, setGrants] = useState('$3.2M DARPA & NSF Collaborative Autonomy Grant');
  const [profEmail, setProfEmail] = useState('pabbeel@cs.berkeley.edu');

  if (!isOpen) return null;

  const handlePushScholarship = async () => {
    const newSch: Scholarship = {
      id: `sch_ext_${Date.now()}`,
      title,
      provider,
      deadline,
      fundingAmount,
      fundingType: 'FULL',
      degreeLevels: ['Masters', 'PhD'],
      countries: countries.split(',').map((s) => s.trim()),
      specializations: specializations.split(',').map((s) => s.trim()),
      requirements: {
        minCgpa: 3.8,
        minIelts: 7.5,
        notes: 'Captured via HighScholar Chrome Extension v1.2',
      },
      officialUrl,
      description,
      featured: true,
      tags: ['Chrome Extension', 'Scraped', 'Direct Push'],
    };

    // Try posting to API route first
    try {
      await fetch('/api/scholarships', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(newSch),
      });
    } catch (e) {
      console.warn('API route call fallback to client context', e);
    }

    // Add to state
    addScholarship(newSch);
    setSuccessMessage(`Successfully ingested "${title}" into your Live Scholarship Feed!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handlePushProfessor = async () => {
    const newProf: Professor = {
      id: `prof_ext_${Date.now()}`,
      name: profName,
      title: profTitle,
      university,
      department,
      country: profCountry,
      labName: 'Robot Learning Lab (RLL)',
      researchTags: researchTags.split(',').map((s) => s.trim()),
      openPositions: true,
      recentGrants: grants,
      email: profEmail,
      linkedInUrl: 'https://linkedin.com/in/pieterabbeel',
      googleScholar: 'https://scholar.google.com/citations?user=pieterabbeel',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
      acceptingTerms: ['Fall 2026', 'Spring 2027'],
      bio: 'Leading pioneer in deep reinforcement learning for physical robotic manipulation.',
    };

    try {
      await fetch('/api/professors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify(newProf),
      });
    } catch (e) {
      console.warn(e);
    }

    addProfessor(newProf);
    setSuccessMessage(`Successfully ingested Professor "${profName}" into your Directory!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-900 text-white flex items-center justify-center shadow-2xs">
              <Puzzle className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Chrome Extension Simulator & API</h3>
              <p className="text-xs text-slate-500">Phase 6: Ingest Opportunities via External Scraper</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* API Authentication Pill */}
        <div className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-indigo-950 font-semibold">
            <Key className="w-3.5 h-3.5 text-indigo-600" />
            <span>Endpoint:</span>
            <code className="text-[11px] bg-white px-2 py-0.5 rounded border border-indigo-200 font-mono text-indigo-800">
              POST /api/{activeTab}s
            </code>
          </div>
          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Key Authenticated
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex border-b border-slate-200 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('scholarship')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'scholarship'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ingest Scholarship
          </button>
          <button
            onClick={() => setActiveTab('professor')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'professor'
                ? 'border-indigo-600 text-indigo-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ingest Professor / Lab
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {activeTab === 'scholarship' ? (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Scholarship Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Provider / University</label>
                  <input
                    type="text"
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Countries (comma separated)</label>
                  <input
                    type="text"
                    value={countries}
                    onChange={(e) => setCountries(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Funding Amount & Perks</label>
                <input
                  type="text"
                  value={fundingAmount}
                  onChange={(e) => setFundingAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Eligible Specializations</label>
                <input
                  type="text"
                  value={specializations}
                  onChange={(e) => setSpecializations(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Official Application URL</label>
                <input
                  type="text"
                  value={officialUrl}
                  onChange={(e) => setOfficialUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Program Summary</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <button
                onClick={handlePushScholarship}
                className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold rounded-xl shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Scrape & Push via API</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Professor Name</label>
                <input
                  type="text"
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">University</label>
                  <input
                    type="text"
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Country</label>
                  <input
                    type="text"
                    value={profCountry}
                    onChange={(e) => setProfCountry(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Academic Title & Lab Role</label>
                <input
                  type="text"
                  value={profTitle}
                  onChange={(e) => setProfTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Research Publication Topics</label>
                <input
                  type="text"
                  value={researchTags}
                  onChange={(e) => setResearchTags(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Active Grant / Funding Notice</label>
                <input
                  type="text"
                  value={grants}
                  onChange={(e) => setGrants(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contact Email</label>
                <input
                  type="email"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 outline-none"
                />
              </div>

              <button
                onClick={handlePushProfessor}
                className="w-full py-2.5 bg-indigo-900 hover:bg-indigo-800 text-white font-semibold rounded-xl shadow-md shadow-indigo-950/20 flex items-center justify-center gap-2 text-xs transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Push Professor to Portal</span>
              </button>
            </div>
          )}

          {/* cURL Code Snippet */}
          <div className="pt-4 border-t border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chrome Extension cURL Integration</span>
            </span>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-[10px] overflow-x-auto font-mono leading-relaxed">
{`curl -X POST https://portal.highscholar.io/api/${activeTab}s \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -d '{"title": "${title}", "provider": "${provider}"}'`}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
