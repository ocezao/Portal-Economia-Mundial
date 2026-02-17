'use client';

import { RefreshCw, User, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SUPABASE_FREE_LIMITS } from '@/config/supabaseLimits';
import type { SettingsPanelProps } from '../types';

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
            <h3 className="font-medium text-sm mb-3">Limites do Plano Free (Supabase)</h3>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Banco de dados</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.databaseSizeMb} MB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Storage</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.fileStorageGb} GB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Egress</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.egressGb} GB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Egress cache</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.cachedEgressGb} GB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Funcoes (mes)</p>
                <p className="font-medium">
                  {SUPABASE_FREE_LIMITS.edgeFunctionInvocations.toLocaleString('pt-BR')}
                </p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Tempo max. funcao</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.edgeFunctionMaxDurationSeconds}s</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">CPU max. funcao</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.edgeFunctionMaxCpuSeconds}s</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Memoria funcao</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.edgeFunctionMemoryMb} MB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Arquivo max.</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.maxFileSizeMb} MB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Funcoes/projeto</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.maxFunctionsPerProject}</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Projetos ativos</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.maxActiveProjects}</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Auto-pause</p>
                <p className="font-medium">{SUPABASE_FREE_LIMITS.freeProjectAutoPauseDays} dias</p>
              </section>
            </section>
            <p className="text-xs text-[#6b6b6b] mt-3">
              Valores de referencia do plano Free. Verifique no painel do Supabase, pois podem mudar.
            </p>
          </section>

          <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
            <section>
              <p className="font-medium text-sm">Resetar Dados</p>
              <p className="text-xs text-[#6b6b6b]">Restaura artigos para estado inicial</p>
            </section>
            <Button variant="outline" onClick={onReset} className="text-[#ef4444] w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" /> Resetar
            </Button>
          </section>

          <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
            <section>
              <p className="font-medium text-sm">Atribuir posts a perfil profissional</p>
              <p className="text-xs text-[#6b6b6b]">Vincula todos os posts a um autor ativo cadastrado</p>
            </section>
            <Button variant="outline" onClick={onAssignPosts} className="w-full sm:w-auto">
              <User className="w-4 h-4 mr-2" /> Atribuir
            </Button>
          </section>

          <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
            <section>
              <p className="font-medium text-sm">Exportar Backup</p>
              <p className="text-xs text-[#6b6b6b]">Download de todos os dados</p>
            </section>
            <Button variant="outline" onClick={onExport} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </section>

          <section className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#f8fafc] rounded-lg gap-4">
            <section>
              <p className="font-medium text-sm">Verificar Agendamentos</p>
              <p className="text-xs text-[#6b6b6b]">Forca verificacao manual</p>
            </section>
            <Button variant="outline" onClick={onCheckScheduled} className="w-full sm:w-auto">
              <Check className="w-4 h-4 mr-2" /> Verificar
            </Button>
          </section>
        </section>
      </section>
    </section>
  );
}
