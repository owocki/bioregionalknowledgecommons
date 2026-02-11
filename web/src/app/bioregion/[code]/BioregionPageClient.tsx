'use client';

import { useEffect } from 'react';
import { useGlobeStore } from '@/stores/globeStore';
import { getBioregionForCode } from '@/data/seed-registry';
import HomePage from '@/app/page';

interface BioregionPageClientProps {
  code: string;
}

export default function BioregionPageClient({ code }: BioregionPageClientProps) {
  const setSelectedBioregion = useGlobeStore((s) => s.setSelectedBioregion);
  const flyTo = useGlobeStore((s) => s.flyTo);

  // Pre-select the bioregion and fly to its centroid when arriving via deep link
  useEffect(() => {
    setSelectedBioregion(code);

    const bioregion = getBioregionForCode(code);
    if (bioregion) {
      const [lng, lat] = bioregion.centroid;
      flyTo(lat, lng);
    }
  }, [code, setSelectedBioregion, flyTo]);

  // Render the same globe page — it will show the BioregionPanel
  // because selectedBioregion is now set in the store
  return <HomePage />;
}
