import { NextRequest, NextResponse } from 'next/server';
import { bioregionLookup, seedNodes } from '@/data/seed-registry';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const bioregion = bioregionLookup[code.toUpperCase()];

  if (!bioregion) {
    return NextResponse.json(
      { error: `Bioregion '${code}' not found` },
      { status: 404 }
    );
  }

  const nodes = seedNodes.filter((node) =>
    node.bioregion_codes.includes(code.toUpperCase())
  );

  return NextResponse.json(
    { bioregion, nodes },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
      },
    }
  );
}
