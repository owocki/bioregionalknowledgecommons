'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { NodeEntry, BioregionInfo } from '@/types';
import { DOMAIN_COLORS, REALM_COLORS } from '@/types';
import { getBioregionForCode } from '@/data/seed-registry';

interface IdentityBlockProps {
  node: NodeEntry;
}

const domainLabels: Record<string, string> = {
  'watershed-governance': 'Watershed Governance',
  'food-systems': 'Food Systems',
  'cultural-heritage': 'Cultural Heritage',
  'ecological-restoration': 'Ecological Restoration',
  'community-governance': 'Community Governance',
  'traditional-knowledge': 'Traditional Knowledge',
  'climate-resilience': 'Climate Resilience',
  other: 'Other',
};

export default function IdentityBlock({ node }: IdentityBlockProps) {
  const domainColor = DOMAIN_COLORS[node.thematic_domain];

  const bioregions = useMemo(() => {
    return node.bioregion_codes
      .map((code) => getBioregionForCode(code))
      .filter((b): b is BioregionInfo => b !== null);
  }, [node.bioregion_codes]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="space-y-4"
    >
      {/* Display Name */}
      <h2 className="text-2xl font-bold text-white leading-tight tracking-tight">
        {node.display_name}
      </h2>

      {/* Thematic Domain Badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider"
          style={{
            backgroundColor: `${domainColor}20`,
            color: domainColor,
            border: `1px solid ${domainColor}40`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: domainColor }}
          />
          {domainLabels[node.thematic_domain] ?? node.thematic_domain}
        </span>
      </div>

      {/* Bioregion(s) */}
      <div className="space-y-1.5">
        {bioregions.map((bio) => {
          const realmColor = REALM_COLORS[bio.realm];
          return (
            <div key={bio.code} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: realmColor }}
              />
              <span className="text-sm text-gray-300">{bio.name}</span>
              <span className="text-xs text-gray-500">({bio.code})</span>
              <span
                className="text-xs px-1.5 py-0.5 rounded text-gray-400"
                style={{
                  backgroundColor: `${realmColor}15`,
                  border: `1px solid ${realmColor}30`,
                }}
              >
                {bio.realm}
              </span>
            </div>
          );
        })}
      </div>

      {/* Topic Tags */}
      {node.topic_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {node.topic_tags.map((tag) => (
            <span
              key={tag}
              className="inline-block px-2 py-0.5 rounded-md text-xs text-gray-300 bg-gray-800/80 border border-gray-700/50"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Maintainers */}
      {node.maintainers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">
            Maintainers
          </span>
          {node.maintainers.map((username) => (
            <a
              key={username}
              href={`https://github.com/${username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-colors focus-ring"
            >
              {/* GitHub icon */}
              <svg className="w-3 h-3" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              @{username}
            </a>
          ))}
        </div>
      )}

      {/* Decorative bioregion element */}
      {bioregions[0] && (
        <div
          className="relative mt-3 p-3 rounded-lg overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${domainColor}08, ${REALM_COLORS[bioregions[0].realm]}08)`,
            border: `1px solid ${domainColor}15`,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                Primary Bioregion
              </p>
              <p className="text-sm text-gray-300 mt-0.5">
                {bioregions[0].subrealm}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-mono font-bold text-gray-400/60">
                {bioregions[0].code}
              </p>
            </div>
          </div>
          {/* Subtle decorative circles */}
          <div
            className="absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-5"
            style={{ backgroundColor: REALM_COLORS[bioregions[0].realm] }}
          />
          <div
            className="absolute -right-2 -bottom-2 w-12 h-12 rounded-full opacity-5"
            style={{ backgroundColor: domainColor }}
          />
        </div>
      )}
    </motion.div>
  );
}
