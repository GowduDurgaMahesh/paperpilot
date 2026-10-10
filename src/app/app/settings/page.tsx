'use client';

import React, { useState } from 'react';
import {
  Settings,
  User,
  Bell,
  Sliders,
  Shield,
  Save,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('Biswaranjan P.');
  const [institution, setInstitution] = useState('Department of Computer Science & AI Research');
  const [defaultStyle, setDefaultStyle] = useState('IEEE');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black tracking-tight">Researcher & Workspace Settings</h1>
        <p className="text-sm text-brand-gray mt-1">
          Manage your author credentials, institutional affiliations, and pre-submission audit parameters.
        </p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-brand-light-gray shadow-sm space-y-5">
        <h2 className="text-sm font-bold text-brand-black flex items-center gap-2">
          <User className="w-4 h-4 text-brand-blue" />
          Author Profile
        </h2>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-brand-dark mb-1">Full Name & Degree</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Institutional Affiliation</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-light-gray focus:outline-none focus:border-brand-blue"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">Default Citation Style</label>
            <select
              value={defaultStyle}
              onChange={(e) => setDefaultStyle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-brand-light-gray bg-white"
            >
              <option value="IEEE">IEEE (Institute of Electrical and Electronics Engineers)</option>
              <option value="APA">APA 7th Edition</option>
              <option value="Nature">Nature Reference Style</option>
              <option value="ACM">ACM Conference / Journal</option>
              <option value="Chicago">Chicago Manual of Style</option>
            </select>
          </div>
        </div>

        <div className="pt-3 border-t border-brand-light-gray flex items-center justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white rounded-xl text-xs font-semibold shadow-sm flex items-center gap-2 transition-all"
          >
            {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Settings Saved' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
}
