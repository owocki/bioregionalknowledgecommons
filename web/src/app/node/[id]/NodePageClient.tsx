'use client';

import { useEffect } from 'react';
import { useGlobeStore } from '@/stores/globeStore';
import HomePage from '@/app/page';

interface NodePageClientProps {
  nodeId: string;
}

export default function NodePageClient({ nodeId }: NodePageClientProps) {
  const setSelectedNode = useGlobeStore((s) => s.setSelectedNode);

  // Pre-select the node when arriving via deep link
  useEffect(() => {
    setSelectedNode(nodeId);
  }, [nodeId, setSelectedNode]);

  // Render the same globe page — it will show the NodeCard
  // because selectedNodeId is now set in the store
  return <HomePage />;
}
