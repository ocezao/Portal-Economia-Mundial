'use client';

import { Users, Plus, Search, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AuthorManagementProps } from '../types';

export function AuthorManagement({
  authors,
  authorSearch,
  onSearchChange,
  onAddAuthor,
  onEditAuthor,
  onDeleteAuthor,
  onRestoreAuthor,
}: AuthorManagementProps) {
  const filteredAuthors = authors.filter((a) => {
    const q = authorSearch.toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.slug.toLowerCase().includes(q) ||
      a.title.toLowerCase().includes(q)
    );
  });

  return (
    <section className="space-y-4">
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <section>
          <h2 className="text-lg font-bold text-[#111111]">Gerenciamento de Autores</h2>
          <p className="text-sm text-[#6b6b6b]">{authors.length} autor(es) cadastrados</p>
        </section>
        <section className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            onClick={onAddAuthor}
            className="bg-[#c40000] hover:bg-[#a00000] gap-2 flex-1 sm:flex-none"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Autor</span>
          </Button>
        </section>
      </section>

      <section className="flex gap-3">
        <section className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
          <Input
            placeholder="Buscar autores..."
            value={authorSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </section>
      </section>

      <section className="bg-white border rounded-xl overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-[#f9fafb] border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Autor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Papéis</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredAuthors.map((author) => (
                <tr key={author.slug} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <section>
                      <p className="font-medium text-sm">{author.name}</p>
                      <p className="text-xs text-[#6b6b6b]">{author.title}</p>
                    </section>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b6b6b]">{author.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {author.editor && (
                        <Badge className="bg-[#fef2f2] text-[#c40000] text-xs">Editor</Badge>
                      )}
                      {author.factChecker && (
                        <Badge className="bg-[#f0fdf4] text-[#166534] text-xs">Fact-check</Badge>
                      )}
                      {!author.editor && !author.factChecker && (
                        <span className="text-xs text-[#6b6b6b]">Autor</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={author.isActive ? 'default' : 'secondary'}>
                      {author.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <section className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEditAuthor(author)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      {author.isActive ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeleteAuthor(author)}
                          className="text-[#ef4444]"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRestoreAuthor(author)}
                          className="text-blue-600"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </Button>
                      )}
                    </section>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          {filteredAuthors.map((author) => (
            <article key={author.slug} className="p-4 border-b last:border-b-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-[#111111] truncate">{author.name}</p>
                  <p className="text-xs text-[#6b6b6b] truncate">{author.title}</p>
                  <p className="text-xs text-[#6b6b6b] mt-1">{author.slug}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge variant={author.isActive ? 'default' : 'secondary'} className="text-xs">
                      {author.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                    {author.editor && (
                      <Badge className="text-xs bg-[#fef2f2] text-[#c40000]">Editor</Badge>
                    )}
                    {author.factChecker && (
                      <Badge className="text-xs bg-[#f0fdf4] text-[#166534]">Fact-check</Badge>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => onEditAuthor(author)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {author.isActive ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[#ef4444]"
                      onClick={() => onDeleteAuthor(author)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-blue-600"
                      onClick={() => onRestoreAuthor(author)}
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredAuthors.length === 0 && (
          <section className="p-12 text-center text-[#6b6b6b]">
            <Users className="w-12 h-12 mx-auto mb-3 text-[#e5e5e5]" />
            <p>Nenhum autor encontrado</p>
          </section>
        )}
      </section>
    </section>
  );
}
