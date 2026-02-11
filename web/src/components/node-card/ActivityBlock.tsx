'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { NodeEntry } from '@/types';
import { DOMAIN_COLORS } from '@/types';
import { seedNodes, seedFlows, seedBridges } from '@/data/seed-registry';

interface ActivityBlockProps {
  node: NodeEntry;
}

export default function ActivityBlock({ node }: ActivityBlockProps) {
  const domainColor = DOMAIN_COLORS[node.thematic_domain];

  // Find flow connections for this node
  const flowConnections = useMemo(() => {
    return seedFlows.flows
      .filter(
        (f) =>
          f.source_node_id === node.node_id ||
          f.target_node_id === node.node_id
      )
      .map((f) => {
        const partnerId =
          f.source_node_id === node.node_id
            ? f.target_node_id
            : f.source_node_id;
        const partner = seedNodes.find((n) => n.node_id === partnerId);
        return {
          ...f,
          partnerName: partner?.display_name ?? 'Unknown Node',
          partnerId,
        };
      });
  }, [node.node_id]);

  // Find bridges for this node
  const bridges = useMemo(() => {
    return seedBridges
      .filter(
        (b) =>
          b.source_node_id === node.node_id ||
          b.target_node_id === node.node_id
      )
      .map((b) => {
        const partnerId =
          b.source_node_id === node.node_id
            ? b.target_node_id
            : b.source_node_id;
        const partner = seedNodes.find((n) => n.node_id === partnerId);
        return {
          ...b,
          partnerName: partner?.display_name ?? 'Unknown Node',
        };
      });
  }, [node.node_id]);

  const createdDate = new Date(node.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.15 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* Section Title */}
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Activity
      </h3>

      {/* Stat Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-2">
        <StatCard
          label="Topics"
          value={node.topic_tags.length}
          color={domainColor}
        />
        <StatCard
          label="Bridges"
          value={bridges.length}
          color={domainColor}
        />
        <StatCard label="Created" value={createdDate} color={domainColor} small />
      </motion.div>

      {/* Flow Connections */}
      {flowConnections.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
            {/* Flow icon */}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
            Flow Connections ({flowConnections.length})
          </h4>
          <div className="space-y-1.5">
            {flowConnections.map((fc) => (
              <div
                key={`${fc.source_node_id}-${fc.target_node_id}`}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-800/50 border border-gray-700/30"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: domainColor }}
                  />
                  <span className="text-xs text-gray-300 truncate">
                    {fc.partnerName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[10px] text-gray-500 uppercase">
                    {fc.flow_type}
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {fc.direction === 'bidirectional' ? '⇄' : '→'} {fc.volume}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Bridges */}
      {bridges.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
            {/* Bridge icon */}
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            Active Bridges ({bridges.length})
          </h4>
          <div className="space-y-1.5">
            {bridges.map((bridge) => (
              <div
                key={bridge.bridge_id}
                className="p-2 rounded-lg bg-gray-800/50 border border-gray-700/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 truncate">
                    {bridge.partnerName}
                  </span>
                  <StatusBadge status={bridge.review_status} />
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-[10px] text-gray-500">
                    {bridge.vocabulary_count} terms
                  </span>
                  <ConfidenceBar
                    confidence={bridge.confidence_avg}
                    color={domainColor}
                  />
                  <span className="text-[10px] text-gray-400 font-mono">
                    {(bridge.confidence_avg * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty state if no connections */}
      {flowConnections.length === 0 && bridges.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="text-center py-4 text-sm text-gray-500"
        >
          No active connections yet
        </motion.div>
      )}
    </motion.div>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  small,
}: {
  label: string;
  value: string | number;
  color: string;
  small?: boolean;
}) {
  return (
    <div
      className="p-2.5 rounded-lg text-center border border-gray-700/30"
      style={{ backgroundColor: `${color}06` }}
    >
      <p
        className={`font-bold text-white ${small ? 'text-xs' : 'text-lg'} leading-tight`}
      >
        {value}
      </p>
      <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

function ConfidenceBar({
  confidence,
  color,
}: {
  confidence: number;
  color: string;
}) {
  return (
    <div className="flex-1 h-1.5 rounded-full bg-gray-700/50 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{
          width: `${confidence * 100}%`,
          backgroundColor: color,
          opacity: 0.7,
        }}
      />
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: 'recent' | 'approaching' | 'stale';
}) {
  const config = {
    recent: {
      label: 'Recent',
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    approaching: {
      label: 'Approaching',
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    stale: {
      label: 'Stale',
      bg: 'bg-red-500/10',
      text: 'text-red-400',
      border: 'border-red-500/20',
    },
  };
  const c = config[status];
  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}
    >
      {c.label}
    </span>
  );
}
