'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGlobeStore } from '@/stores/globeStore';
import { seedNodes, bioregionLookup as seedBioregionLookup } from '@/data/seed-registry';
import {
  DOMAIN_COLORS,
  REALM_COLORS,
  type ThematicDomain,
  type BioregionInfo,
  type BioregionLookup,
  type Realm,
} from '@/types';
import { assetPath } from '@/lib/constants';

// ─── Constants ────────────────────────────────────────────────────────

const TOTAL_STEPS = 6;

const THEMATIC_DOMAINS: ThematicDomain[] = [
  'watershed-governance',
  'food-systems',
  'cultural-heritage',
  'ecological-restoration',
  'community-governance',
  'traditional-knowledge',
  'climate-resilience',
];

const DOMAIN_LABELS: Record<string, string> = {
  'watershed-governance': 'Watershed Governance',
  'food-systems': 'Food Systems',
  'cultural-heritage': 'Cultural Heritage',
  'ecological-restoration': 'Ecological Restoration',
  'community-governance': 'Community Governance',
  'traditional-knowledge': 'Traditional Knowledge',
  'climate-resilience': 'Climate Resilience',
  other: 'Other',
};

const LAUNCH_MESSAGES = [
  'Creating GitHub repository...',
  'Scaffolding knowledge vault...',
  'Configuring Quartz publishing...',
  'Registering with the commons network...',
  'Summoning your AI steward agent...',
];

// ─── Slide animation variants ─────────────────────────────────────────

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 180 : -180,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -180 : 180,
    opacity: 0,
  }),
};

// ─── Shared styles ────────────────────────────────────────────────────

const inputClass =
  'w-full bg-gray-800/60 border border-gray-700/40 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-colors';

const primaryBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 px-6 py-3 text-sm font-semibold text-gray-950 shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-shadow cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none';

const secondaryBtnClass =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-gray-800/60 border border-gray-700/40 px-5 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-700/60 transition-colors cursor-pointer';

// ─── Helper ───────────────────────────────────────────────────────────

function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 6371;
}

// ═════════════════════════════════════════════════════════════════════
// OnboardingWizard
// ═════════════════════════════════════════════════════════════════════

export default function OnboardingWizard() {
  const showOnboarding = useGlobeStore((s) => s.showOnboarding);
  const setShowOnboarding = useGlobeStore((s) => s.setShowOnboarding);
  const flyTo = useGlobeStore((s) => s.flyTo);

  // ─── Wizard state ─────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  // Step 2
  const [commonsName, setCommonsName] = useState('');
  const [description, setDescription] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [thematicDomain, setThematicDomain] = useState<ThematicDomain>('watershed-governance');

  // Step 3
  const [allBioregions, setAllBioregions] = useState<BioregionInfo[]>([]);
  const [bioregionSearch, setBioregionSearch] = useState('');
  const [selectedBioregion, setSelectedBioregion] = useState<BioregionInfo | null>(null);
  const [locating, setLocating] = useState(false);

  // Step 4
  const [connectedNodes, setConnectedNodes] = useState<Set<string>>(new Set());

  // Step 6
  const [launchSteps, setLaunchSteps] = useState<boolean[]>(new Array(5).fill(false));
  const [launchComplete, setLaunchComplete] = useState(false);

  // ─── Fetch bioregions ─────────────────────────────────────────────
  useEffect(() => {
    fetch(assetPath('/data/bioregion-lookup.json'))
      .then((r) => r.json())
      .then((data: BioregionLookup) => {
        const list = Object.values(data).sort((a, b) => a.name.localeCompare(b.name));
        setAllBioregions(list);
      })
      .catch(console.error);
  }, []);

  // ─── Launch sequence ──────────────────────────────────────────────
  useEffect(() => {
    if (step !== 6) return;
    setLaunchSteps(new Array(5).fill(false));
    setLaunchComplete(false);

    const delays = [1000, 1500, 2000, 2500, 3000];
    const timers = delays.map((delay, i) =>
      setTimeout(() => {
        setLaunchSteps((prev) => {
          const next = [...prev];
          next[i] = true;
          return next;
        });
      }, delay),
    );
    const completeTimer = setTimeout(() => setLaunchComplete(true), 4000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(completeTimer);
    };
  }, [step]);

  // ─── Navigation ───────────────────────────────────────────────────
  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  }, []);

  const close = useCallback(() => {
    setShowOnboarding(false);
    setTimeout(() => {
      setStep(1);
      setDirection(1);
      setCommonsName('');
      setDescription('');
      setGithubUsername('');
      setThematicDomain('watershed-governance');
      setBioregionSearch('');
      setSelectedBioregion(null);
      setLocating(false);
      setConnectedNodes(new Set());
      setLaunchSteps(new Array(5).fill(false));
      setLaunchComplete(false);
    }, 400);
  }, [setShowOnboarding]);

  // ─── Bioregion helpers ────────────────────────────────────────────
  const filteredBioregions = useMemo(() => {
    if (!bioregionSearch.trim()) return allBioregions;
    const q = bioregionSearch.toLowerCase();
    return allBioregions.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.realm.toLowerCase().includes(q),
    );
  }, [allBioregions, bioregionSearch]);

  const handleSelectBioregion = useCallback(
    (bio: BioregionInfo) => {
      setSelectedBioregion(bio);
      // centroid is [lng, lat]
      flyTo(bio.centroid[1], bio.centroid[0], 2.8);
    },
    [flyTo],
  );

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        let closest: BioregionInfo | null = null;
        let minDist = Infinity;
        for (const bio of allBioregions) {
          const d = haversineDistance(latitude, longitude, bio.centroid[1], bio.centroid[0]);
          if (d < minDist) {
            minDist = d;
            closest = bio;
          }
        }
        if (closest) handleSelectBioregion(closest);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }, [allBioregions, handleSelectBioregion]);

  // ─── Step 4: matching nodes ───────────────────────────────────────
  const matchingNodes = useMemo(() => {
    if (!selectedBioregion) return [];
    return seedNodes.filter((node) => {
      const nodeCode = node.bioregion_codes[0];
      const nodeBio = seedBioregionLookup[nodeCode];
      const realmMatch = nodeBio?.realm === selectedBioregion.realm;
      const domainMatch = node.thematic_domain === thematicDomain;
      return realmMatch || domainMatch;
    });
  }, [selectedBioregion, thematicDomain]);

  const toggleConnection = useCallback((nodeId: string) => {
    setConnectedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // ─── Don't render if hidden ───────────────────────────────────────
  if (!showOnboarding) return null;

  // ═══════════════════════════════════════════════════════════════════
  // Step renderers
  // ═══════════════════════════════════════════════════════════════════

  const renderStep1 = () => (
    <div className="flex flex-col items-center text-center px-2">
      {/* Illustration */}
      <div className="relative mb-8 mt-2">
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-cyan-500/20 via-teal-400/10 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500/30 to-teal-400/20 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-cyan-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5a17.92 17.92 0 01-8.716-2.247m0 0A9.015 9.015 0 003 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
          </div>
        </div>
        {/* Animated ring */}
        <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">Start Your Knowledge Commons</h2>
      <p className="text-sm text-gray-400 leading-relaxed max-w-sm mb-8">
        In a few steps, we&apos;ll help you set up a community knowledge garden rooted in your bioregion.
      </p>
      <button className={primaryBtnClass} onClick={goNext}>
        Let&apos;s Begin
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="flex flex-col gap-5 px-1">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Name Your Commons</h2>
        <p className="text-sm text-gray-400">Give your knowledge commons an identity.</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Commons Name *</label>
        <input
          type="text"
          className={inputClass}
          placeholder="e.g. Sonoran Desert Water Keepers"
          value={commonsName}
          onChange={(e) => setCommonsName(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
        <textarea
          className={`${inputClass} min-h-[80px] resize-none`}
          placeholder="What knowledge will your commons steward? What community does it serve?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Your GitHub Username</label>
        <input
          type="text"
          className={inputClass}
          placeholder="@your-handle"
          value={githubUsername}
          onChange={(e) => setGithubUsername(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1.5">Thematic Domain</label>
        <div className="relative">
          <select
            className={`${inputClass} appearance-none pr-10 cursor-pointer`}
            value={thematicDomain}
            onChange={(e) => setThematicDomain(e.target.value as ThematicDomain)}
          >
            {THEMATIC_DOMAINS.map((d) => (
              <option key={d} value={d}>
                {DOMAIN_LABELS[d]}
              </option>
            ))}
          </select>
          <svg
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button className={secondaryBtnClass} onClick={goBack}>
          ← Back
        </button>
        <button className={primaryBtnClass} onClick={goNext} disabled={!commonsName.trim()}>
          Continue →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="flex flex-col gap-4 px-1">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Where in the World?</h2>
        <p className="text-sm text-gray-400">Select the bioregion your commons will call home.</p>
      </div>

      {/* Selected bioregion badge */}
      {selectedBioregion && (
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium border border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: REALM_COLORS[selectedBioregion.realm] }}
            />
            {selectedBioregion.name}
            <span className="text-cyan-500/60">{selectedBioregion.code}</span>
          </span>
          <button
            onClick={() => setSelectedBioregion(null)}
            className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
            aria-label="Clear selection"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search + Use Location */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className={`${inputClass} pl-10`}
            placeholder="Search bioregions..."
            value={bioregionSearch}
            onChange={(e) => setBioregionSearch(e.target.value)}
          />
        </div>
        <button
          className={`${secondaryBtnClass} text-xs shrink-0 ${locating ? 'animate-pulse' : ''}`}
          onClick={handleUseMyLocation}
          disabled={locating || allBioregions.length === 0}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {locating ? 'Finding...' : 'My Location'}
        </button>
      </div>

      {/* Bioregion list */}
      <div className="overflow-y-auto max-h-[32vh] rounded-xl border border-gray-700/30 bg-gray-800/30 divide-y divide-gray-700/20 scrollbar-thin">
        {filteredBioregions.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            {allBioregions.length === 0 ? 'Loading bioregions...' : 'No bioregions match your search.'}
          </div>
        ) : (
          filteredBioregions.map((bio) => {
            const isSelected = selectedBioregion?.code === bio.code;
            return (
              <button
                key={bio.code}
                className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors hover:bg-gray-700/30 cursor-pointer ${
                  isSelected ? 'bg-cyan-500/10 border-l-2 border-l-cyan-400' : 'border-l-2 border-l-transparent'
                }`}
                onClick={() => handleSelectBioregion(bio)}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: REALM_COLORS[bio.realm] }}
                />
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm truncate ${isSelected ? 'text-cyan-300 font-medium' : 'text-gray-300'}`}>
                    {bio.name}
                  </span>
                  <span className="block text-[10px] text-gray-500">{bio.realm}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-500 shrink-0">{bio.code}</span>
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button className={secondaryBtnClass} onClick={goBack}>
          ← Back
        </button>
        <button className={primaryBtnClass} onClick={goNext} disabled={!selectedBioregion}>
          Continue →
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="flex flex-col gap-4 px-1">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Connect with Related Commons</h2>
        <p className="text-sm text-gray-400">
          These existing commons share your bioregion or related topics.
        </p>
      </div>

      {matchingNodes.length === 0 ? (
        <div className="rounded-xl border border-gray-700/30 bg-gray-800/30 px-6 py-10 text-center">
          <div className="text-2xl mb-3">🌱</div>
          <p className="text-sm text-gray-400 leading-relaxed">
            No nearby commons yet — you&apos;ll be the first in your region!
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1 scrollbar-thin">
          {matchingNodes.map((node) => {
            const isConnected = connectedNodes.has(node.node_id);
            const nodeCode = node.bioregion_codes[0];
            const nodeBio = seedBioregionLookup[nodeCode];
            return (
              <div
                key={node.node_id}
                className={`rounded-xl border px-4 py-3 transition-all ${
                  isConnected
                    ? 'border-cyan-500/40 bg-cyan-500/5'
                    : 'border-gray-700/30 bg-gray-800/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-200 truncate">{node.display_name}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${DOMAIN_COLORS[node.thematic_domain]}20`,
                          color: DOMAIN_COLORS[node.thematic_domain],
                        }}
                      >
                        {DOMAIN_LABELS[node.thematic_domain]}
                      </span>
                      {nodeBio && (
                        <span className="text-[10px] text-gray-500">
                          {nodeBio.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleConnection(node.node_id)}
                    className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                      isConnected
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : 'bg-gray-700/40 text-gray-400 border border-gray-600/30 hover:text-gray-200'
                    }`}
                  >
                    {isConnected ? '✓ Connected' : 'Connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-between pt-1">
        <button className={secondaryBtnClass} onClick={goBack}>
          ← Back
        </button>
        <button className={primaryBtnClass} onClick={goNext}>
          Continue →
        </button>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="flex flex-col gap-5 px-1">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Review Your Commons</h2>
        <p className="text-sm text-gray-400">Everything look right? Let&apos;s launch it.</p>
      </div>

      <div className="rounded-xl border border-gray-700/30 bg-gray-800/30 p-5 space-y-4">
        {/* Name */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Name</span>
          <p className="text-base font-semibold text-white">{commonsName}</p>
        </div>

        {/* Description */}
        {description && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Description</span>
            <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">{description}</p>
          </div>
        )}

        {/* Domain */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Thematic Domain</span>
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              backgroundColor: `${DOMAIN_COLORS[thematicDomain]}20`,
              color: DOMAIN_COLORS[thematicDomain],
            }}
          >
            {DOMAIN_LABELS[thematicDomain]}
          </span>
        </div>

        {/* Bioregion */}
        {selectedBioregion && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Bioregion</span>
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: REALM_COLORS[selectedBioregion.realm] }}
              />
              <span className="text-sm text-gray-200">{selectedBioregion.name}</span>
              <span className="text-xs font-mono text-gray-500">{selectedBioregion.code}</span>
            </div>
          </div>
        )}

        {/* GitHub */}
        {githubUsername && (
          <div>
            <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">GitHub</span>
            <p className="text-sm text-gray-300 font-mono">
              {githubUsername.startsWith('@') ? githubUsername : `@${githubUsername}`}
            </p>
          </div>
        )}

        {/* Connections */}
        <div>
          <span className="text-[10px] uppercase tracking-wider text-gray-500 block mb-1">Proposed Connections</span>
          <p className="text-sm text-gray-300">
            {connectedNodes.size > 0
              ? `${connectedNodes.size} commons bridge${connectedNodes.size > 1 ? 's' : ''}`
              : 'None yet'}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <button className={secondaryBtnClass} onClick={goBack}>
          ← Back to Edit
        </button>
        <button className={primaryBtnClass} onClick={goNext}>
          Launch My Commons →
        </button>
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="flex flex-col items-center text-center px-2">
      <h2 className="text-xl font-bold text-white mb-6">
        {launchComplete ? 'Your commons is being prepared!' : 'Launching Your Commons...'}
      </h2>

      <div className="w-full max-w-xs space-y-3 mb-8">
        {LAUNCH_MESSAGES.map((msg, i) => {
          const done = launchSteps[i];
          const isLast = i === LAUNCH_MESSAGES.length - 1;
          return (
            <motion.div
              key={msg}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: done ? 1 : 0.3, x: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="flex items-center gap-3 text-left"
            >
              {done ? (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isLast
                      ? 'bg-gradient-to-r from-cyan-400 to-teal-300 text-gray-950 shadow-lg shadow-cyan-400/40'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  ✓
                </motion.span>
              ) : (
                <span className="shrink-0 w-5 h-5 rounded-full border border-gray-700/60 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600 animate-pulse" />
                </span>
              )}
              <span className={`text-sm ${done ? 'text-gray-200' : 'text-gray-600'} transition-colors`}>
                {msg}
              </span>
              {/* Glow on last item */}
              {isLast && done && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-xs"
                >
                  ✨
                </motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      <AnimatePresence>
        {launchComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-5 py-4 space-y-2 max-w-sm">
              <p className="text-sm text-gray-300">
                We&apos;ll notify you at{' '}
                <span className="font-mono text-cyan-400">
                  {githubUsername.startsWith('@') ? githubUsername : `@${githubUsername || 'you'}`}
                </span>{' '}
                when everything is ready.
              </p>
              <p className="text-xs text-gray-500">
                In the meantime, explore the existing commons on the globe.
              </p>
            </div>
            <button className={primaryBtnClass} onClick={close}>
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient glow */}
      {!launchComplete && (
        <motion.div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(6,182,212,0.15), transparent 70%)',
          }}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );

  const stepRenderers = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  // ═══════════════════════════════════════════════════════════════════
  // Main render
  // ═══════════════════════════════════════════════════════════════════

  return (
    <AnimatePresence>
      {showOnboarding && (
        <motion.div
          key="onboarding-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={close}
          role="dialog"
          aria-label="Start a Commons wizard"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/40 shadow-2xl shadow-black/50 w-[520px] max-w-[92vw] max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ─── Progress bar ──────────────────────────────────── */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-700/20 shrink-0">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                  Step {step} of {TOTAL_STEPS}
                </span>
                {step < 6 && (
                  <button
                    onClick={close}
                    className="w-6 h-6 rounded-md bg-gray-800/80 border border-gray-700/40 flex items-center justify-center text-gray-500 hover:text-white transition-colors cursor-pointer"
                    aria-label="Close wizard"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-colors duration-500"
                    style={{
                      backgroundColor: i < step ? '#06b6d4' : 'rgba(75,85,99,0.3)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* ─── Step content ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-6 py-5 relative">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {stepRenderers[step - 1]()}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
