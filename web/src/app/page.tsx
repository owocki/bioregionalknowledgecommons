'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion } from 'framer-motion';
import { useKeyboardNav } from '@/hooks/useKeyboardNav';
import { useGlobeStore } from '@/stores/globeStore';

// Dynamic imports for Three.js globe - must disable SSR
const GlobeScene = dynamic(
  () => import('@/components/globe/GlobeScene').then((mod) => mod.default),
  { ssr: false }
);

// Overlay components
const SearchOverlay = dynamic(
  () => import('@/components/layout/SearchOverlay').then((mod) => mod.default),
  { ssr: false }
);
const ControlPanel = dynamic(
  () => import('@/components/layout/ControlPanel').then((mod) => mod.default),
  { ssr: false }
);
const BioregionTooltip = dynamic(
  () => import('@/components/layout/BioregionTooltip').then((mod) => mod.default),
  { ssr: false }
);
const FindMyBioregion = dynamic(
  () => import('@/components/layout/FindMyBioregion').then((mod) => mod.FindMyBioregion),
  { ssr: false }
);
const StartCommonsButton = dynamic(
  () => import('@/components/layout/StartCommonsButton').then((mod) => mod.StartCommonsButton),
  { ssr: false }
);

// Node card for selected node detail
const NodeCard = dynamic(
  () => import('@/components/node-card/NodeCard').then((mod) => mod.default),
  { ssr: false }
);

// Bioregion panel - shows when clicking a bioregion
const BioregionPanel = dynamic(
  () => import('@/components/layout/BioregionPanel').then((mod) => mod.default),
  { ssr: false }
);

// Flow tooltip - follows hover on flow arcs
const FlowTooltip = dynamic(
  () => import('@/components/layout/FlowTooltip').then((mod) => mod.default),
  { ssr: false }
);

// List view - alternative to globe
const ListView = dynamic(
  () => import('@/components/layout/ListView').then((mod) => mod.default),
  { ssr: false }
);

function GlobeLoadingFallback() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-950" role="status">
      <div className="flex flex-col items-center gap-4">
        {/* Concentric pulsing rings */}
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border border-blue-400/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full border border-blue-400/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
          <div className="absolute inset-4 rounded-full border border-blue-400/40 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
          <div className="absolute inset-[26px] rounded-full bg-blue-400/60" />
        </div>
        <p className="text-sm text-gray-400 font-mono tracking-wider">
          Loading the Knowledge Commons&hellip;
        </p>
      </div>
    </div>
  );
}

/* ─── Keyboard Shortcuts Help Overlay ──────────────────────────────── */
function KeyboardShortcutsOverlay({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: ['/', '⌘K'], description: 'Focus search' },
    { keys: ['Esc'], description: 'Close panel / clear search' },
    { keys: ['?'], description: 'Toggle this help' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-label="Keyboard shortcuts"
      aria-modal="true"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-gray-900/95 backdrop-blur-xl rounded-2xl border border-gray-700/40 shadow-2xl shadow-black/40 p-6 w-[320px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-wider">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-md bg-gray-800/80 border border-gray-700/40 flex items-center justify-center text-gray-400 hover:text-white transition-colors focus-ring"
            aria-label="Close shortcuts help"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-3">
          {shortcuts.map((s) => (
            <div key={s.description} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{s.description}</span>
              <div className="flex items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={k}>
                    {i > 0 && <span className="text-gray-600 text-xs mx-1">or</span>}
                    <kbd className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono text-gray-400 bg-gray-800/80 border border-gray-700/50">
                      {k}
                    </kbd>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function HomePage() {
  const { showShortcuts, setShowShortcuts } = useKeyboardNav();
  const viewMode = useGlobeStore((s) => s.viewMode);

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-gray-950 touch-none"
      role="application"
      aria-label="Bioregional Knowledge Commons Visualizer"
    >
      {/* View mode: Globe (default) or List */}
      {viewMode === 'list' ? (
        <div className="absolute inset-0 overflow-y-auto">
          <ListView />
        </div>
      ) : (
        <Suspense fallback={<GlobeLoadingFallback />}>
          <div className="absolute inset-0">
            <GlobeScene />
          </div>
        </Suspense>
      )}

      {/* OpenCivics branding - top left */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2" role="banner">
        <div
          className="h-8 w-8 rounded-full bg-blue-500/20 border border-blue-400/30 flex items-center justify-center flex-shrink-0"
          aria-hidden="true"
        >
          <span className="text-blue-400 text-xs font-bold">OC</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-white/90 tracking-wide">
            Bioregional Knowledge Commons
          </h1>
          <p className="text-[10px] text-gray-500 font-mono">
            by OpenCivics
          </p>
        </div>
      </div>

      {/* Search overlay - top center */}
      <SearchOverlay />

      {/* Control panel - bottom left */}
      <ControlPanel />

      {/* Bioregion tooltip - follows hover */}
      <BioregionTooltip />

      {/* Flow tooltip - follows hover on arcs */}
      <FlowTooltip />

      {/* Find My Bioregion prompt - bottom center */}
      <FindMyBioregion />

      {/* Bioregion detail panel - slides in from left (desktop) or bottom (mobile) */}
      <BioregionPanel />

      {/* Node detail card - slides in from right (desktop) or bottom (mobile) */}
      <NodeCard />

      {/* Start a Commons CTA - bottom right */}
      <StartCommonsButton />

      {/* Keyboard shortcuts overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <KeyboardShortcutsOverlay onClose={() => setShowShortcuts(false)} />
        )}
      </AnimatePresence>
    </main>
  );
}
