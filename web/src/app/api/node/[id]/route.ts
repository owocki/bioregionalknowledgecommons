import { NextRequest, NextResponse } from 'next/server';
import {
  seedNodes,
  seedFlows,
  seedBridges,
  getBioregionForCode,
} from '@/data/seed-registry';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const node = seedNodes.find((n) => n.node_id === id);

  if (!node) {
    return NextResponse.json(
      { error: `Node '${id}' not found` },
      { status: 404 }
    );
  }

  // Resolve bioregion details for all associated bioregion codes
  const bioregions = node.bioregion_codes
    .map((code) => getBioregionForCode(code))
    .filter(Boolean);

  // Find all flows connected to this node (as source or target)
  const flows = seedFlows.flows.filter(
    (f) => f.source_node_id === id || f.target_node_id === id
  );

  // Find all bridges connected to this node
  const bridges = seedBridges.filter(
    (b) => b.source_node_id === id || b.target_node_id === id
  );

  return NextResponse.json(
    {
      node,
      bioregions,
      flows,
      bridges,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      },
    }
  );
}
