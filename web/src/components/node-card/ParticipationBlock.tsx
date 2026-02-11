'use client';

import { motion } from 'framer-motion';
import type { NodeEntry } from '@/types';
import { DOMAIN_COLORS } from '@/types';

interface ParticipationBlockProps {
  node: NodeEntry;
}

interface ActionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  external?: boolean;
  disabled?: boolean;
  badge?: string;
  color: string;
  onClick?: () => void;
}

function ActionCard({
  icon,
  title,
  description,
  href,
  external,
  disabled,
  badge,
  color,
  onClick,
}: ActionCardProps) {
  const baseClasses =
    'group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 focus-ring';
  const enabledClasses =
    'bg-gray-800/40 border-gray-700/40 hover:bg-gray-800/70 hover:border-gray-600/50 cursor-pointer';
  const disabledClasses =
    'bg-gray-800/20 border-gray-700/20 cursor-not-allowed opacity-60';

  const content = (
    <>
      {/* Icon */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors duration-200"
        style={{
          backgroundColor: disabled ? '#374151' : `${color}15`,
          color: disabled ? '#6B7280' : color,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4
            className={`text-sm font-medium ${disabled ? 'text-gray-500' : 'text-gray-200'}`}
          >
            {title}
          </h4>
          {badge && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 font-medium uppercase tracking-wider">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>

      {/* External link indicator */}
      {external && !disabled && (
        <div className="flex-shrink-0 text-gray-600 group-hover:text-gray-400 transition-colors mt-1">
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
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </div>
      )}
    </>
  );

  if (disabled) {
    return (
      <div className={`${baseClasses} ${disabledClasses}`}>{content}</div>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        className={`${baseClasses} ${enabledClasses} no-underline`}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${enabledClasses} text-left w-full`}
    >
      {content}
    </button>
  );
}

export default function ParticipationBlock({ node }: ParticipationBlockProps) {
  const domainColor = DOMAIN_COLORS[node.thematic_domain];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 6 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  const hasChannels =
    node.interaction_channels.web_chat ||
    node.interaction_channels.telegram ||
    node.interaction_channels.api;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-3"
    >
      {/* Section Title */}
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Participate
      </h3>

      {/* Action Cards Stack */}
      <div className="space-y-2">
        {/* Read / Browse */}
        <motion.div variants={itemVariants}>
          <ActionCard
            icon={
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                />
              </svg>
            }
            title="Browse the Knowledge Base"
            description={
              node.quartz_url
                ? 'Explore the published knowledge garden'
                : 'Knowledge base not yet published'
            }
            href={node.quartz_url ?? undefined}
            external
            disabled={!node.quartz_url}
            color={domainColor}
          />
        </motion.div>

        {/* Ask Agent */}
        <motion.div variants={itemVariants}>
          <ActionCard
            icon={
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
            }
            title="Ask the Agent"
            description="Query this commons with natural language"
            disabled
            badge="Coming Soon"
            color={domainColor}
          />
        </motion.div>

        {/* Contribute */}
        <motion.div variants={itemVariants}>
          <ActionCard
            icon={
              <svg
                className="w-4.5 h-4.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
            }
            title="Contribute on GitHub"
            description="Submit knowledge, fix issues, or improve documentation"
            href={node.repo_url}
            external
            color={domainColor}
          />
        </motion.div>

        {/* Connect */}
        {hasChannels && (
          <motion.div variants={itemVariants}>
            <ActionCard
              icon={
                <svg
                  className="w-4.5 h-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.556a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757"
                  />
                </svg>
              }
              title="Connect"
              description={[
                node.interaction_channels.web_chat && 'Web Chat',
                node.interaction_channels.telegram && 'Telegram',
                node.interaction_channels.api && 'API',
              ]
                .filter(Boolean)
                .join(' · ')}
              color={domainColor}
              onClick={() => {
                /* Future: open channel selector */
              }}
            />
          </motion.div>
        )}

        {/* Fork */}
        <motion.div variants={itemVariants}>
          <div className="text-center pt-1">
            <a
              href={node.repo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-3 h-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              Fork this Commons
              <span className="text-gray-600">— for power users</span>
            </a>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
