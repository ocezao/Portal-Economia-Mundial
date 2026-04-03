'use client';

import { RefreshCw, User, Download, Check, Database, FolderOpen, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SettingsPanelProps } from '../types';

const LOCAL_PLATFORM_LIMITS = [
  { label: 'Banco local', value: 'DATABASE_URL', icon: Database },
  { label: 'Uploads locais', value: 'UPLOADS_DIR', icon: FolderOpen },
  { label: 'Sessao admin', value: 'portal_session', icon: Shield },
];

export function SettingsPanel({
  onReset,
  onAssignPosts,
  onExport,
  onCheckScheduled,
}: SettingsPanelProps) {
  return (
    <section className="space-y-4">
      <section className="bg-white border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg font-bold text-[#111111] mb-4">Configuracoes do Sistema</h2>
        <section className="space-y-3">
          <section className="p-4 bg-[#f8fafc] rounded-lg">
            <h3 className="font-medium text-sm mb-3">Infraestrutura Local Ativa</h3>
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {LOCAL_PLATFORM_LIMITS.map((item) => (
                <section key={item.label} className="p-3 bg-white border rounded-md">
                  <div className="mb-1 flex items-center gap-2 text-[#6b6b6b]">
                    <item.icon className="h-4 w-4" />
                    <p>{item.label}</p>
                  </div>
                  <p className="font-medium">{item.value}</p>
                </section>
              ))}
            </section>
            <p className="mt-3 text-xs text-[#6b6b6b]">
              O projeto opera com banco PostgreSQL local, uploads em disco e autenticacao por sessao HTTP-only.
            </p>
          </section>

          <section className="flex flex-col justify-between gap-4 rounded-lg bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
            <section>
              <p className="text-sm font-medium">Resetar Dados</p>
              <p className="text-xs text-[#6b6b6b]">Restaura artigos para estado inicial</p>
            </section>
            <Button variant="outline" onClick={onReset} className="w-full text-[#ef4444] sm:w-auto">
              <RefreshCw className="mr-2 h-4 w-4" /> Resetar
            </Button>
          </section>

          <section className="flex flex-col justify-between gap-4 rounded-lg bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
            <section>
              <p className="text-sm font-medium">Atribuir posts a perfil profissional</p>
              <p className="text-xs text-[#6b6b6b]">Vincula todos os posts a um autor ativo cadastrado</p>
            </section>
            <Button variant="outline" onClick={onAssignPosts} className="w-full sm:w-auto">
              <User className="mr-2 h-4 w-4" /> Atribuir
            </Button>
          </section>

          <section className="flex flex-col justify-between gap-4 rounded-lg bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
            <section>
              <p className="text-sm font-medium">Exportar Backup</p>
              <p className="text-xs text-[#6b6b6b]">Download de todos os dados</p>
            </section>
            <Button variant="outline" onClick={onExport} className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Exportar
            </Button>
          </section>

          <section className="flex flex-col justify-between gap-4 rounded-lg bg-[#f8fafc] p-4 sm:flex-row sm:items-center">
            <section>
              <p className="text-sm font-medium">Verificar Agendamentos</p>
              <p className="text-xs text-[#6b6b6b]">Forca verificacao manual</p>
            </section>
            <Button variant="outline" onClick={onCheckScheduled} className="w-full sm:w-auto">
              <Check className="mr-2 h-4 w-4" /> Verificar
            </Button>
          </section>
        </section>
      </section>
    </section>
  );
}
