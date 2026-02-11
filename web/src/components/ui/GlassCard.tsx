'use client';

import React from 'react';

type GlassCardElement = 'div' | 'section' | 'article' | 'aside' | 'nav';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  as?: GlassCardElement;
}

export function GlassCard({
  children,
  className = '',
  as: Element = 'div',
}: GlassCardProps) {
  return (
    <Element
      className={`
        bg-gray-900/80 backdrop-blur-xl
        border border-white/10
        rounded-2xl
        ${className}
      `.trim()}
    >
      {children}
    </Element>
  );
}
