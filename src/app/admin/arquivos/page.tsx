'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, Search, FileImage, File, Copy, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabaseClient';
import { ImageUploader } from '@/components/upload/ImageUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type UploadedFile = {
  name: string;
  path: string;
  size: number;
  contentType: string | null;
  updatedAt: string | null;
  publicUrl: string;
  isVector: boolean;
};

type FilesResponse = {
  ok: boolean;
  bucket: string;
  files: UploadedFile[];
};

export default function AdminArquivosPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'webp' | 'vector' | 'other'>('all');
  const [bucket, setBucket] = useState<string>('uploads');

  const loadFiles = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        toast.error('Sessão inválida. Faça login novamente.');
        return;
      }

      const response = await fetch('/api/admin-files', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = (await response.json()) as FilesResponse & { error?: string };
      if (!response.ok) {
        throw new Error(json.error || 'Erro ao listar arquivos');
      }

      setFiles(json.files ?? []);
      setBucket(json.bucket ?? 'uploads');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao listar arquivos';
      toast.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return files.filter((file) => {
      const isWebp =
        (file.contentType ?? '').toLowerCase() === 'image/webp' ||
        file.name.toLowerCase().endsWith('.webp');
      const isVector = file.isVector;
      const matchesType =
        typeFilter === 'all' ||
        (typeFilter === 'webp' && isWebp) ||
        (typeFilter === 'vector' && isVector) ||
        (typeFilter === 'other' && !isWebp && !isVector);

      if (!matchesType) return false;
      if (!q) return true;
      return (
        file.name.toLowerCase().includes(q) ||
        file.path.toLowerCase().includes(q) ||
        (file.contentType ?? '').toLowerCase().includes(q)
      );
    });
  }, [files, query, typeFilter]);

  const copyUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('URL copiada');
    } catch {
      toast.error('Não foi possível copiar a URL');
    }
  }, []);

  const deleteFile = useCallback(
    async (path: string) => {
      if (!confirm(`Excluir arquivo?\n${path}`)) return;

      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          toast.error('Sessão inválida. Faça login novamente.');
          return;
        }

        const response = await fetch('/api/admin-files', {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ path }),
        });

        const json = (await response.json()) as { ok?: boolean; error?: string };
        if (!response.ok) {
          throw new Error(json.error || 'Erro ao excluir arquivo');
        }

        setFiles((prev) => prev.filter((f) => f.path !== path));
        toast.success('Arquivo excluído');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro ao excluir arquivo';
        toast.error(message);
      }
    },
    []
  );

  return (
    <main className="max-w-[1400px] mx-auto space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <section>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Arquivos Enviados</h1>
          <p className="text-sm text-[#6b6b6b]">
            Bucket: <span className="font-medium">{bucket}</span> • {files.length} arquivo(s)
          </p>
        </section>
        <Button variant="outline" onClick={() => void loadFiles(true)} disabled={refreshing} className="gap-2 w-full lg:w-auto">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </header>

      <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6 space-y-4">
        <h2 className="text-lg font-semibold text-[#111111]">Upload (WebP e Vetores)</h2>
        <ImageUploader onUploadComplete={() => void loadFiles(true)} />
      </section>

      <section className="bg-white border border-[#e5e5e5] rounded-xl p-4 sm:p-6 space-y-4">
        <section className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Search className="w-4 h-4 text-[#6b6b6b]" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nome, caminho ou tipo..."
            className="max-w-xl"
          />
          <section className="flex items-center gap-2">
            <Button
              variant={typeFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('all')}
            >
              Todos
            </Button>
            <Button
              variant={typeFilter === 'webp' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('webp')}
            >
              WebP
            </Button>
            <Button
              variant={typeFilter === 'vector' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('vector')}
            >
              Vetor
            </Button>
            <Button
              variant={typeFilter === 'other' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTypeFilter('other')}
            >
              Outros
            </Button>
          </section>
        </section>

        {loading ? (
          <p className="text-sm text-[#6b6b6b]">Carregando arquivos...</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-[#6b6b6b]">Nenhum arquivo encontrado.</p>
        ) : (
          <section className="space-y-3">
            {filtered.map((file) => {
              const updated = file.updatedAt ? new Date(file.updatedAt).toLocaleString('pt-BR') : '-';
              const sizeKb = (file.size / 1024).toFixed(2);
              const isImage = (file.contentType ?? '').startsWith('image/');

              return (
                <article key={file.path} className="border border-[#e5e5e5] rounded-lg p-3 sm:p-4">
                  <section className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <section className="shrink-0">
                      {isImage ? (
                        <FileImage className="w-5 h-5 text-[#c40000]" />
                      ) : (
                        <File className="w-5 h-5 text-[#6b6b6b]" />
                      )}
                    </section>
                    <section className="min-w-0 flex-1">
                      <p className="font-medium text-sm text-[#111111] truncate">{file.name}</p>
                      <p className="text-xs text-[#6b6b6b] break-all">{file.path}</p>
                      <p className="text-xs text-[#6b6b6b]">
                        {(file.contentType || 'desconhecido')} • {sizeKb} KB • Atualizado em {updated}
                        {file.isVector ? ' • Vetorial' : ''}
                      </p>
                    </section>
                    <section className="flex items-center gap-2 shrink-0">
                      {file.publicUrl ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => void copyUrl(file.publicUrl)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            URL
                          </Button>
                          <a
                            href={file.publicUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-[#c40000] hover:underline"
                          >
                            Abrir
                          </a>
                        </>
                      ) : null}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[#ef4444] border-[#ef4444] hover:text-[#ef4444]"
                        onClick={() => void deleteFile(file.path)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </section>
                  </section>
                </article>
              );
            })}
          </section>
        )}
      </section>
    </main>
  );
}
