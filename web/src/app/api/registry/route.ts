import { NextResponse } from 'next/server';
import { seedRegistry } from '@/data/seed-registry';

export async function GET() {
  return NextResponse.json(seedRegistry, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
