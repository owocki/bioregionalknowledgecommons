import type { Metadata } from 'next';
import { bioregionLookup, seedNodes } from '@/data/seed-registry';
import BioregionPageClient from './BioregionPageClient';

interface BioregionPageProps {
  params: Promise<{ code: string }>;
}

export async function generateMetadata({
  params,
}: BioregionPageProps): Promise<Metadata> {
  const { code } = await params;
  const bioregion = bioregionLookup[code];

  if (!bioregion) {
    return {
      title: 'Bioregion Not Found | Bioregional Knowledge Commons',
      description:
        'The requested bioregion could not be found in the knowledge commons.',
      openGraph: {
        title: 'Bioregion Not Found | Bioregional Knowledge Commons',
        description:
          'The requested bioregion could not be found in the knowledge commons.',
        type: 'website',
        siteName: 'Bioregional Knowledge Commons',
      },
    };
  }

  const nodeCount = seedNodes.filter((n) =>
    n.bioregion_codes.includes(code)
  ).length;
  const nodeLabel =
    nodeCount === 1 ? '1 knowledge commons node' : `${nodeCount} knowledge commons nodes`;

  const description = `${bioregion.name} (${bioregion.code}) — a bioregion in the ${bioregion.realm} realm (${bioregion.subrealm}). Home to ${nodeLabel}.`;

  return {
    title: `${bioregion.name} | Bioregional Knowledge Commons`,
    description,
    openGraph: {
      title: `${bioregion.name} | Bioregional Knowledge Commons`,
      description,
      type: 'website',
      siteName: 'Bioregional Knowledge Commons',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${bioregion.name} - Bioregional Knowledge Commons`,
        },
      ],
    },
  };
}

export default async function BioregionPage({ params }: BioregionPageProps) {
  const { code } = await params;
  return <BioregionPageClient code={code} />;
}
