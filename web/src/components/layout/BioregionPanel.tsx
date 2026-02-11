'use client';

import { useEffect, useCallback, useRef, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGlobeStore } from '@/stores/globeStore';
import { seedNodes } from '@/data/seed-registry';
import { REALM_COLORS, DOMAIN_COLORS, type BioregionInfo, type BioregionLookup, type NodeEntry } from '@/types';

/** Detect if current viewport is mobile (< 640px) */
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

export default function BioregionPanel() {
  const selectedBioregion = useGlobeStore((s) => s.selectedBioregion);
  const setSelectedBioregion = useGlobeStore((s) => s.setSelectedBioregion);
  const setSelectedNode = useGlobeStore((s) => s.setSelectedNode);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const [fullLookup, setFullLookup] = useState<BioregionLookup>({});

  // Load full bioregion lookup
  useEffect(() => {
    fetch('/data/bioregion-lookup.json')
      .then((res) => res.json())
      .then((data: BioregionLookup) => setFullLookup(data))
      .catch(() => {});
  }, []);

  const bioregion = useMemo((): BioregionInfo | null => {
    if (!selectedBioregion) return null;
    return fullLookup[selectedBioregion] ?? null;
  }, [selectedBioregion, fullLookup]);

  // Find all nodes in this bioregion
  const nodes = useMemo(() => {
    if (!selectedBioregion) return [];
    return seedNodes.filter((n) =>
      n.bioregion_codes.includes(selectedBioregion)
    );
  }, [selectedBioregion]);

  // Close on Escape (handled by useKeyboardNav too, but keep for local isolation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedBioregion) {
        setSelectedBioregion(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedBioregion, setSelectedBioregion]);

  // Close on click outside
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setSelectedBioregion(null);
      }
    },
    [setSelectedBioregion]
  );

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedBioregion(null);
      // Small delay so the panel closes before the node card opens
      setTimeout(() => setSelectedNode(nodeId), 150);
    },
    [setSelectedBioregion, setSelectedNode]
  );

  const realmColor = bioregion ? REALM_COLORS[bioregion.realm] : '#7F8C8D';

  // Different animation variants for mobile (slide up) vs desktop (slide left)
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
          {/* Backdrop */}
          <motion.div
            key="bioregion-panel-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={handleBackdropClick}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key={`bioregion-panel-${bioregion.code}`}
            ref={panelRef}
            {...panelVariants}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className={[
              'fixed z-50 overflow-y-auto overscroll-contain touch-pan-y',
              // Desktop: left panel, full height
              'sm:left-0 sm:top-0 sm:h-full sm:w-[380px]',
              // Mobile: bottom sheet
              'max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:max-h-[85vh] max-sm:rounded-t-2xl',
              // Styling
              'bg-gray-900/95 backdrop-blur-xl',
              'sm:border-r border-gray-700/30',
              'max-sm:border-t max-sm:border-gray-700/30',
              'shadow-2xl shadow-black/30',
            ].join(' ')}
            style={{ borderRightColor: isMobile ? undefined : `${realmColor}30` }}
            role="dialog"
            aria-label={`Bioregion: ${bioregion.name}`}
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
              aria-label="Close bioregion panel"
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

              {/* Bioregion name */}
              <h2 className="text-xl max-sm:text-lg font-bold text-white leading-tight pr-8">
                {bioregion.name}
              </h2>

              {/* Meta info */}
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-mono">
                <span>{bioregion.code}</span>
                <span className="text-gray-600" aria-hidden="true">·</span>
                <span>{bioregion.subrealm}</span>
              </div>

              {/* Coordinates */}
              <div className="mt-2 text-xs text-gray-500">
                Centroid: {bioregion.centroid[1].toFixed(2)}°N, {bioregion.centroid[0].toFixed(2)}°E
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

            {/* Knowledge Commons list */}
            <div className="p-6 pt-4 max-sm:p-4 max-sm:pt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">
                  Knowledge Commons
                </h3>
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: nodes.length > 0 ? `${realmColor}15` : 'rgba(255,255,255,0.05)',
                    color: nodes.length > 0 ? realmColor : 'rgba(255,255,255,0.3)',
                  }}
                  aria-label={`${nodes.length} commons`}
                >
                  {nodes.length}
                </span>
              </div>

              {nodes.length === 0 ? (
                <EmptyState realmColor={realmColor} bioregionName={bioregion.name} />
              ) : (
                <div className="space-y-3 max-sm:space-y-2">
                  {nodes.map((node) => (
                    <NodeListItem
                      key={node.node_id}
                      node={node}
                      onClick={() => handleNodeClick(node.node_id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom gradient */}
            <div className="sticky bottom-0 h-8 bg-gradient-to-t from-gray-900/95 to-transparent pointer-events-none" aria-hidden="true" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Node List Item ──────────────────────────────────────────────────────
interface NodeListItemProps {
  node: NodeEntry;
  onClick: () => void;
}

function NodeListItem({ node, onClick }: NodeListItemProps) {
  const domainColor = DOMAIN_COLORS[node.thematic_domain];
  const domainLabel = node.thematic_domain
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <button
      onClick={onClick}
      className="
        w-full text-left rounded-xl p-4 max-sm:p-3
        bg-white/[0.03] hover:bg-white/[0.07]
        border border-white/[0.06] hover:border-white/[0.12]
        transition-all duration-200 group cursor-pointer focus-ring
      "
      aria-label={`View ${node.display_name} details`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm max-sm:text-[13px] font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">
            {node.display_name}
          </h4>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: `${domainColor}15`,
                color: domainColor,
                border: `1px solid ${domainColor}25`,
              }}
            >
              {domainLabel}
            </span>
            {node.topic_tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-[10px] text-gray-500 bg-gray-800/50 px-1.5 py-0.5 rounded">
                {tag}
              </span>
            ))}
          </div>
          {/* Maintainers */}
          {node.maintainers.length > 0 && (
            <p className="text-[11px] text-gray-500 mt-2 truncate">
              {node.maintainers.join(', ')}
            </p>
          )}
        </div>

        {/* Arrow */}
        <svg
          className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────
function EmptyState({ realmColor, bioregionName }: { realmColor: string; bioregionName: string }) {
  return (
    <div className="text-center py-8 max-sm:py-6">
      {/* Globe outline icon */}
      <div className="mx-auto h-12 w-12 rounded-full bg-white/5 flex items-center justify-center mb-4" aria-hidden="true">
        <svg
          className="w-6 h-6 text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"
          />
        </svg>
      </div>
      <p className="text-sm text-gray-400 mb-1">
        No knowledge commons yet
      </p>
      <p className="text-xs text-gray-500 mb-4 max-w-[240px] mx-auto">
        Be the first to start a knowledge commons in {bioregionName}
      </p>
      <button
        className="
          inline-flex items-center gap-2
          rounded-lg px-4 py-2.5 text-sm font-medium
          transition-colors cursor-pointer focus-ring
        "
        style={{
          backgroundColor: `${realmColor}15`,
          color: realmColor,
          border: `1px solid ${realmColor}30`,
        }}
        aria-label={`Start a knowledge commons in ${bioregionName}`}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        Start a Commons
      </button>
    </div>
  );
}
