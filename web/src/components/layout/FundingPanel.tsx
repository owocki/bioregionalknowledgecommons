'use client';

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGlobeStore } from '@/stores/globeStore';
import { assetPath } from '@/lib/constants';
import { REALM_COLORS, type BioregionInfo, type BioregionLookup } from '@/types';

// ─── Mock funding data ───────────────────────────────────────────────
interface FundingProject {
  id: string;
  name: string;
  description: string;
  goal: number;
  raised: number;
  contributors: number;
  icon: string;
}

const MOCK_PROJECTS: FundingProject[] = [
  {
    id: 'watershed-restoration',
    name: 'Watershed Restoration',
    description: 'Restore riparian buffers and native vegetation along 12 km of degraded waterways.',
    goal: 50000,
    raised: 32500,
    contributors: 84,
    icon: 'water',
  },
  {
    id: 'seed-library',
    name: 'Community Seed Library',
    description: 'Establish a bioregional seed library preserving 200+ heritage and native plant varieties.',
    goal: 15000,
    raised: 11200,
    contributors: 156,
    icon: 'seed',
  },
  {
    id: 'tek-archive',
    name: 'TEK Digital Archive',
    description: 'Digitize and preserve Traditional Ecological Knowledge with indigenous community consent.',
    goal: 75000,
    raised: 28000,
    contributors: 42,
    icon: 'archive',
  },
];

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 639px)');
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isMobile;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${amount.toLocaleString()}`;
}

// ─── Main Panel ──────────────────────────────────────────────────────
export default function FundingPanel() {
  const selectedBioregion = useGlobeStore((s) => s.selectedBioregion);
  const setSelectedBioregion = useGlobeStore((s) => s.setSelectedBioregion);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [fullLookup, setFullLookup] = useState<BioregionLookup>({});

  useEffect(() => {
    fetch(assetPath('/data/bioregion-lookup.json'))
      .then((res) => res.json())
      .then((data: BioregionLookup) => setFullLookup(data))
      .catch(() => {});
  }, []);

  const bioregion = useMemo((): BioregionInfo | null => {
    if (!selectedBioregion) return null;
    return fullLookup[selectedBioregion] ?? null;
  }, [selectedBioregion, fullLookup]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedBioregion) {
        setSelectedBioregion(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBioregion, setSelectedBioregion]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelectedBioregion(null);
      }
    },
    [setSelectedBioregion]
  );

  const realmColor = bioregion ? REALM_COLORS[bioregion.realm] : '#7F8C8D';

  const totalRaised = MOCK_PROJECTS.reduce((sum, p) => sum + p.raised, 0);
  const totalGoal = MOCK_PROJECTS.reduce((sum, p) => sum + p.goal, 0);
  const totalContributors = MOCK_PROJECTS.reduce((sum, p) => sum + p.contributors, 0);

  const panelVariants = isMobile
    ? {
        initial: { y: '100%', opacity: 0.6 },
        animate: { y: 0, opacity: 1 },
        exit: { y: '100%', opacity: 0 },
      }
    : {
        initial: { x: '-100%', opacity: 0.6 },
        animate: { x: 0, opacity: 1 },
        exit: { x: '-100%', opacity: 0 },
      };

  return (
    <AnimatePresence mode="wait">
      {bioregion && (
        <>
          <motion.div
            key="funding-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent sm:pointer-events-none"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          <motion.div
            key={`funding-panel-${bioregion.code}`}
            ref={panelRef}
            {...panelVariants}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={[
              'fixed z-50 overflow-y-auto overscroll-contain touch-pan-y',
              'sm:left-0 sm:top-0 sm:h-full sm:w-[380px]',
              'max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[85vh] max-sm:rounded-t-2xl',
              'bg-gray-900/95 backdrop-blur-xl',
              'sm:border-r border-gray-700/30',
              'max-sm:border-t max-sm:border-gray-700/30',
              'shadow-2xl shadow-black/30',
            ].join(' ')}
            style={{ borderRightColor: isMobile ? undefined : `${realmColor}30` }}
            role="dialog"
            aria-label={`Fund ${bioregion.name}`}
            aria-modal="true"
          >
            {/* Mobile drag handle */}
            <div className="sm:hidden flex justify-center pt-3 pb-1 cursor-grab" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-gray-600" />
            </div>

            {/* Close button */}
            <button
              onClick={() => setSelectedBioregion(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-lg bg-gray-800/80 border border-gray-700/40 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/80 transition-colors cursor-pointer focus-ring"
              aria-label="Close panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header */}
            <div className="p-6 pb-4 max-sm:p-4 max-sm:pb-3">
              {/* Realm badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-3"
                style={{
                  backgroundColor: `${realmColor}15`,
                  border: `1px solid ${realmColor}30`,
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: realmColor }} aria-hidden="true" />
                <span className="text-xs font-medium" style={{ color: realmColor }}>
                  {bioregion.realm}
                </span>
              </div>

              <h2 className="text-xl max-sm:text-lg font-bold text-white leading-tight pr-8">
                Fund {bioregion.name}
              </h2>

              <p className="text-xs text-gray-400 mt-2">
                Support bioregional projects and ecological stewardship
              </p>
            </div>

            {/* Summary stats */}
            <div className="px-6 max-sm:px-4 pb-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 p-3 text-center">
                  <div className="text-lg font-bold text-emerald-400">{formatCurrency(totalRaised)}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Raised</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <div className="text-lg font-bold text-white">{formatCurrency(totalGoal)}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Goal</div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <div className="text-lg font-bold text-white">{totalContributors}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Funders</div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-px mx-6 max-sm:mx-4"
              style={{
                background: `linear-gradient(to right, transparent, ${realmColor}25, transparent)`,
              }}
              aria-hidden="true"
            />

            {/* Projects */}
            <div className="p-6 pt-4 max-sm:p-4 max-sm:pt-3">
              <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4">
                Active Projects
              </h3>
              <div className="space-y-3">
                {MOCK_PROJECTS.map((project) => (
                  <ProjectCard key={project.id} project={project} accentColor={realmColor} />
                ))}
              </div>
            </div>

            {/* Contribute CTA */}
            <div className="p-6 pt-2 max-sm:p-4 max-sm:pt-1 pb-8">
              <button
                className="w-full rounded-xl py-3 px-4 font-semibold text-sm transition-all duration-200 cursor-pointer focus-ring bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30"
              >
                Contribute to {bioregion.name}
              </button>
            </div>

            {/* Bottom gradient */}
            <div className="sticky bottom-0 h-8 bg-gradient-to-t from-gray-900/95 to-transparent pointer-events-none" aria-hidden="true" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Project Card ────────────────────────────────────────────────────
function ProjectCard({ project, accentColor }: { project: FundingProject; accentColor: string }) {
  const percent = Math.round((project.raised / project.goal) * 100);

  return (
    <div className="rounded-xl p-4 max-sm:p-3 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-colors">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <ProjectIcon type={project.icon} />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{project.name}</h4>
          <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{project.description}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[10px] mb-1.5">
          <span className="text-emerald-400 font-semibold">{formatCurrency(project.raised)} raised</span>
          <span className="text-gray-500">{percent}% of {formatCurrency(project.goal)}</span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-800/80 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
      </div>

      {/* Contributors */}
      <div className="flex items-center gap-1.5 mt-2 text-[10px] text-gray-500">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
        <span>{project.contributors} contributors</span>
      </div>
    </div>
  );
}

// ─── Project Icons ───────────────────────────────────────────────────
function ProjectIcon({ type }: { type: string }) {
  switch (type) {
    case 'water':
      return (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c-1.5 2.5-5 6.5-5 10a5 5 0 0010 0c0-3.5-3.5-7.5-5-10z" />
        </svg>
      );
    case 'seed':
      return (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.97zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.97z" />
        </svg>
      );
    case 'archive':
      return (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
      );
    default:
      return (
        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
        </svg>
      );
  }
}
