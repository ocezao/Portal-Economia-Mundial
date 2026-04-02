'use client';

import { RefreshCw, User, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LOCAL_INFRA_REFERENCE_LIMITS } from '@/config/localInfraLimits';
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
            <h3 className="font-medium text-sm mb-3">Referencias da Infra Local</h3>
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Banco de dados</p>
                <p className="font-medium">{LOCAL_INFRA_REFERENCE_LIMITS.databaseSizeMb} MB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Storage</p>
                <p className="font-medium">{LOCAL_INFRA_REFERENCE_LIMITS.fileStorageGb} GB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Egress mensal</p>
                <p className="font-medium">{LOCAL_INFRA_REFERENCE_LIMITS.monthlyEgressGb} GB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Arquivo max.</p>
                <p className="font-medium">{LOCAL_INFRA_REFERENCE_LIMITS.maxUploadFileSizeMb} MB</p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Jobs/hora</p>
                <p className="font-medium">
                  {LOCAL_INFRA_REFERENCE_LIMITS.scheduledJobsPerHour.toLocaleString('pt-BR')}
                </p>
              </section>
              <section className="p-3 bg-white border rounded-md">
                <p className="text-[#6b6b6b]">Retencao de backup</p>
                <p className="font-medium">{LOCAL_INFRA_REFERENCE_LIMITS.recommendedBackupRetentionDays} dias</p>
              </section>
            </section>
            <p className="text-xs text-[#6b6b6b] mt-3">
              Valores de referencia para a VPS local. Ajuste conforme disco, RAM e politica de backup do ambiente.
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
