import { NextResponse } from 'next/server';
import { seedFlows } from '@/data/seed-registry';

export async function GET() {
  return NextResponse.json(seedFlows, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  });
}
