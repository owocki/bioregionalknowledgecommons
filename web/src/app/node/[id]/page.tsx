import type { Metadata } from 'next';
import { seedNodes, getBioregionForCode } from '@/data/seed-registry';
import NodePageClient from './NodePageClient';

interface NodePageProps {
  params: Promise<{ id: string }>;
}

/** Pre-generate pages for all seed nodes (required for static export) */
export function generateStaticParams() {
  return seedNodes.map((node) => ({ id: node.node_id }));
}

export async function generateMetadata({
  params,
}: NodePageProps): Promise<Metadata> {
  const { id } = await params;
  const node = seedNodes.find((n) => n.node_id === id);

  if (!node) {
    return {
      title: 'Node Not Found | Bioregional Knowledge Commons',
      description:
        'The requested knowledge commons node could not be found.',
      openGraph: {
        title: 'Node Not Found | Bioregional Knowledge Commons',
        description:
          'The requested knowledge commons node could not be found.',
        type: 'website',
        siteName: 'Bioregional Knowledge Commons',
      },
    };
  }

  const bioregion = getBioregionForCode(node.bioregion_codes[0]);
  const bioregionName = bioregion?.name ?? node.bioregion_codes[0];
  const domainLabel = node.thematic_domain.replace(/-/g, ' ');
  const tagList = node.topic_tags.join(', ');

  const description = `${node.display_name} — a ${domainLabel} knowledge commons in the ${bioregionName} bioregion. Topics: ${tagList}.`;

  return {
    title: `${node.display_name} | Bioregional Knowledge Commons`,
    description,
    openGraph: {
      title: `${node.display_name} | Bioregional Knowledge Commons`,
      description,
      type: 'website',
      siteName: 'Bioregional Knowledge Commons',
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${node.display_name} - Bioregional Knowledge Commons`,
        },
      ],
    },
  };
}

export default async function NodePage({ params }: NodePageProps) {
  const { id } = await params;
  return <NodePageClient nodeId={id} />;
}
