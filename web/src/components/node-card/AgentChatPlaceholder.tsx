'use client';

import { motion } from 'framer-motion';
import type { NodeEntry } from '@/types';
import { DOMAIN_COLORS } from '@/types';

interface AgentChatPlaceholderProps {
  node: NodeEntry;
}

export default function AgentChatPlaceholder({
  node,
}: AgentChatPlaceholderProps) {
  const domainColor = DOMAIN_COLORS[node.thematic_domain];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
      className="space-y-3"
    >
      {/* Section Title */}
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 flex items-center gap-2">
        AI Agent Chat
        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/20 font-medium normal-case tracking-normal">
          Phase 2
        </span>
      </h3>

      {/* Mockup Chat Interface */}
      <div
        className="relative rounded-xl overflow-hidden border border-gray-700/30"
        style={{ backgroundColor: `${domainColor}04` }}
      >
        {/* Disabled overlay */}
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[1px] z-10 flex items-center justify-center">
          <div className="text-center px-4">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: `${domainColor}20`,
                border: `1px solid ${domainColor}30`,
              }}
            >
              {/* Sparkle / AI icon */}
              <svg
                className="w-5 h-5"
                style={{ color: domainColor }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                />
              </svg>
            </motion.div>
            <p className="text-sm text-gray-300 font-medium">
              Coming in Phase 2
            </p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed max-w-[240px] mx-auto">
              Soon you&apos;ll be able to ask questions about this commons
              directly
            </p>
          </div>
        </div>

        {/* Background mockup chat messages */}
        <div className="p-3 space-y-3 opacity-30">
          {/* System message */}
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${domainColor}30` }}
            />
            <div className="space-y-1 flex-1">
              <div className="h-3 rounded bg-gray-700/60 w-3/4" />
              <div className="h-3 rounded bg-gray-700/40 w-1/2" />
            </div>
          </div>

          {/* User message */}
          <div className="flex gap-2 justify-end">
            <div className="space-y-1">
              <div className="h-3 rounded bg-gray-600/40 w-48 ml-auto" />
            </div>
            <div className="w-6 h-6 rounded-full bg-gray-600/40 flex-shrink-0" />
          </div>

          {/* Agent response */}
          <div className="flex gap-2">
            <div
              className="w-6 h-6 rounded-full flex-shrink-0"
              style={{ backgroundColor: `${domainColor}30` }}
            />
            <div className="space-y-1 flex-1">
              <div className="h-3 rounded bg-gray-700/60 w-full" />
              <div className="h-3 rounded bg-gray-700/50 w-5/6" />
              <div className="h-3 rounded bg-gray-700/40 w-2/3" />
            </div>
          </div>
        </div>

        {/* Mockup input bar */}
        <div className="p-3 border-t border-gray-700/20 opacity-30">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-8 rounded-lg bg-gray-800/60 border border-gray-700/30" />
            <div className="w-8 h-8 rounded-lg bg-gray-800/40" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
