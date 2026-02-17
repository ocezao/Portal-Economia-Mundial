import PreferenciasClient from './PreferenciasClient';

// This route depends on client-only auth/preferences state and should not be statically prerendered.
export const dynamic = 'force-dynamic';

export default function PreferenciasPage() {
  return <PreferenciasClient />;
}

