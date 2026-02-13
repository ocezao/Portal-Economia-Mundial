import ConfiguracoesClient from './ConfiguracoesClient';

// This route depends on client-only auth/preferences state and should not be statically prerendered.
export const dynamic = 'force-dynamic';

export default function ConfiguracoesPage() {
  return <ConfiguracoesClient />;
}

