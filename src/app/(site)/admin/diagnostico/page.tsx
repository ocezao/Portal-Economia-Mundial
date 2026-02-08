/**
 * Admin - Diagnóstico do Sistema
 * Verificação de integridade e relatório
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  RefreshCw,
  Database,
  FileText,
  Settings
} from 'lucide-react';
import { storage, STORAGE_KEYS } from '@/config/storage';
import { getAllArticles } from '@/services/newsManager';
import { Button } from '@/components/ui/button';

interface CheckResult {
  id: string;
  name: string;
  status: 'ok' | 'warning' | 'error';
  message: string;
  details?: string;
}

export default function AdminDiagnosticoPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const checks: CheckResult[] = [];

    // 1. Verificar integridade do storage
    try {
      const allKeys = Object.values(STORAGE_KEYS);
      let storageOk = true;
      
      for (const key of allKeys) {
        try {
          localStorage.getItem(key);
        } catch {
          storageOk = false;
          break;
        }
      }
      
      checks.push({
        id: 'storage',
        name: 'Integridade do Storage',
        status: storageOk ? 'ok' : 'error',
        message: storageOk ? 'Storage acessível' : 'Erro ao acessar storage',
      });
    } catch {
      checks.push({
        id: 'storage',
        name: 'Integridade do Storage',
        status: 'error',
        message: 'Erro crítico no storage',
      });
    }

    // 2. Verificar slugs duplicados
    const articles = await getAllArticles({ includeDrafts: true });
    const slugs = articles.map(a => a.slug);
    const duplicates = slugs.filter((item, index) => slugs.indexOf(item) !== index);
    
    checks.push({
      id: 'slugs',
      name: 'Duplicidade de Slugs',
      status: duplicates.length === 0 ? 'ok' : 'error',
      message: duplicates.length === 0 
        ? 'Nenhum slug duplicado encontrado' 
        : `${duplicates.length} slug(s) duplicado(s): ${duplicates.join(', ')}`,
    });

    // 3. Verificar artigos sem capa
    const withoutCover = articles.filter(a => !a.coverImage || a.coverImage.includes('placeholder'));
    
    checks.push({
      id: 'covers',
      name: 'Imagens de Capa',
      status: withoutCover.length === 0 ? 'ok' : 'warning',
      message: withoutCover.length === 0 
        ? 'Todos os artigos têm imagem de capa' 
        : `${withoutCover.length} artigo(s) sem imagem de capa`,
      details: withoutCover.map(a => a.title).join(', '),
    });

    // 4. Verificar artigos sem excerpt
    const withoutExcerpt = articles.filter(a => !a.excerpt || a.excerpt.length < 50);
    
    checks.push({
      id: 'excerpts',
      name: 'Resumos (Excerpts)',
      status: withoutExcerpt.length === 0 ? 'ok' : 'warning',
      message: withoutExcerpt.length === 0 
        ? 'Todos os artigos têm resumo adequado' 
        : `${withoutExcerpt.length} artigo(s) com resumo curto ou ausente`,
    });

    // 5. Verificar SEO
    const withoutSEO = articles.filter(a => !a.title || !a.excerpt || a.tags.length === 0);
    
    checks.push({
      id: 'seo',
      name: 'Campos SEO',
      status: withoutSEO.length === 0 ? 'ok' : 'warning',
      message: withoutSEO.length === 0 
        ? 'Todos os artigos têm SEO completo' 
        : `${withoutSEO.length} artigo(s) com SEO incompleto`,
    });

    // 6. Verificar usuários registrados
    const registeredUsers = storage.get<unknown[]>('pem_registered_users') || [];
    
    checks.push({
      id: 'users',
      name: 'Usuários Registrados',
      status: 'ok',
      message: `${registeredUsers.length} usuário(s) registrado(s) no sistema`,
    });

    // 7. Verificar comentários
    const comments = storage.get<unknown[]>('pem_comments') || [];
    
    checks.push({
      id: 'comments',
      name: 'Sistema de Comentários',
      status: 'ok',
      message: `${comments.length} comentário(s) no sistema`,
    });

    // 8. Verificar bookmarks
    const bookmarks = storage.getBookmarks();
    
    checks.push({
      id: 'bookmarks',
      name: 'Favoritos',
      status: 'ok',
      message: `${bookmarks.length} favorito(s) armazenado(s)`,
    });

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setResults(checks);
    setLastRun(new Date());
    setIsRunning(false);
  };

  const fixIssues = () => {
    if (confirm('Isso tentará corrigir problemas simples automaticamente. Deseja continuar?')) {
      alert('Correções aplicadas (simulado). Em produção, isso regeneraria índices e limparia duplicados.');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-[#22c55e]" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-[#f59e0b]" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-[#ef4444]" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-[#dcfce7] border-[#22c55e]';
      case 'warning':
        return 'bg-[#fef3c7] border-[#f59e0b]';
      case 'error':
        return 'bg-[#fef2f2] border-[#ef4444]';
      default:
        return 'bg-[#f5f5f5] border-[#e5e5e5]';
    }
  };

  const okCount = results.filter(r => r.status === 'ok').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <>
      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <section className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-[#c40000]" />
            <section>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Diagnóstico do Sistema</h1>
              <p className="text-sm text-[#6b6b6b]">
                Verificação de integridade e relatório
              </p>
            </section>
          </section>
          <section className="flex gap-2">
            <Link 
              href="/admin"
              className="inline-flex items-center px-4 py-2 border border-[#e5e5e5] rounded-md text-sm font-medium hover:bg-[#f5f5f5] transition-colors"
            >
              Voltar
            </Link>
            <Button 
              variant="outline"
              onClick={fixIssues}
              disabled={results.length === 0 || isRunning}
            >
              <Settings className="w-4 h-4 mr-2" />
              Corrigir Problemas
            </Button>
            <Button 
              onClick={runDiagnostics}
              disabled={isRunning}
              className="bg-[#c40000] hover:bg-[#a00000]"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Executar Verificação
                </>
              )}
            </Button>
          </section>
        </header>

        {/* Resumo */}
        {results.length > 0 && (
          <section className="grid grid-cols-3 gap-4 mb-6">
            <article className="p-4 bg-[#dcfce7] rounded-lg text-center">
              <CheckCircle className="w-8 h-8 text-[#22c55e] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#166534]">{okCount}</p>
              <p className="text-sm text-[#166534]">OK</p>
            </article>
            <article className="p-4 bg-[#fef3c7] rounded-lg text-center">
              <AlertTriangle className="w-8 h-8 text-[#f59e0b] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#92400e]">{warningCount}</p>
              <p className="text-sm text-[#92400e]">Alertas</p>
            </article>
            <article className="p-4 bg-[#fef2f2] rounded-lg text-center">
              <XCircle className="w-8 h-8 text-[#ef4444] mx-auto mb-2" />
              <p className="text-2xl font-bold text-[#dc2626]">{errorCount}</p>
              <p className="text-sm text-[#dc2626]">Erros</p>
            </article>
          </section>
        )}

        {/* Resultados */}
        {results.length > 0 ? (
          <section className="space-y-3">
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#111111]">Resultados da Verificação</h2>
              {lastRun && (
                <p className="text-sm text-[#6b6b6b]">
                  Última verificação: {lastRun.toLocaleTimeString('pt-BR')}
                </p>
              )}
            </header>
            
            <ul className="space-y-3">
              {results.map((result) => (
                <li key={result.id}>
                  <article className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}>
                    <header className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <section className="flex-1">
                        <h3 className="font-medium text-[#111111]">{result.name}</h3>
                        <p className="text-sm text-[#374151] mt-1">{result.message}</p>
                        {result.details && (
                          <p className="text-xs text-[#6b6b6b] mt-2">
                            Detalhes: {result.details}
                          </p>
                        )}
                      </section>
                    </header>
                  </article>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <section className="p-12 bg-[#f9fafb] rounded-lg text-center">
            <Database className="w-16 h-16 mx-auto text-[#e5e5e5] mb-4" />
            <h2 className="text-lg font-medium text-[#111111] mb-2">
              Nenhuma verificação executada
            </h2>
            <p className="text-sm text-[#6b6b6b] mb-4">
              Clique em &quot;Executar Verificação&quot; para verificar a integridade do sistema.
            </p>
            <Button 
              onClick={runDiagnostics}
              disabled={isRunning}
              className="bg-[#c40000] hover:bg-[#a00000]"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Executar Verificação
                </>
              )}
            </Button>
          </section>
        )}

        {/* Info */}
        <aside className="mt-8 p-4 bg-[#f8fafc] rounded-lg">
          <header className="flex items-start gap-2">
            <FileText className="w-5 h-5 text-[#6b6b6b] flex-shrink-0 mt-0.5" />
            <section>
              <h3 className="text-sm font-medium text-[#111111]">Sobre o Diagnóstico</h3>
              <p className="text-xs text-[#6b6b6b] mt-1">
                Esta ferramenta verifica a integridade dos dados armazenados localmente, 
                identifica problemas comuns e sugere correções. Em ambiente de produção, 
                estas verificações seriam mais abrangentes e incluiriam validação de servidor.
              </p>
            </section>
          </header>
        </aside>
      </main>
    </>
  );
}
