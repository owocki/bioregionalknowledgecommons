'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGlobeStore } from '@/stores/globeStore';

/**
 * Global keyboard shortcuts for the application.
 *
 * - Escape → close any open panel (NodeCard, BioregionPanel, or search)
 * - ?      → toggle keyboard-shortcuts help overlay
 */
export function useKeyboardNav() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const selectedNodeId = useGlobeStore((s) => s.selectedNodeId);
  const selectedBioregion = useGlobeStore((s) => s.selectedBioregion);
  const searchQuery = useGlobeStore((s) => s.searchQuery);
  const setSelectedNode = useGlobeStore((s) => s.setSelectedNode);
  const setSelectedBioregion = useGlobeStore((s) => s.setSelectedBioregion);
  const setSearchQuery = useGlobeStore((s) => s.setSearchQuery);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't intercept when the user is typing in an input
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (e.key === 'Escape') {
        // Priority: close deepest panel first
        if (selectedNodeId) {
          setSelectedNode(null);
          return;
        }
        if (selectedBioregion) {
          setSelectedBioregion(null);
          return;
        }
        if (searchQuery) {
          setSearchQuery('');
          return;
        }
        // If shortcuts overlay is open, close it
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
      }

      // "?" to toggle shortcuts help — only when not typing
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    },
    [
      selectedNodeId,
      selectedBioregion,
      searchQuery,
      showShortcuts,
      setSelectedNode,
      setSelectedBioregion,
      setSearchQuery,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    showShortcuts,
    setShowShortcuts,
  };
}
