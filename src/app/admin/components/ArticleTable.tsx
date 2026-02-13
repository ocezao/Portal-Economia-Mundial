'use client';

import { Search, Plus, ChevronLeft, ChevronRight, Eye, Edit2, Copy, Trash2, MoreHorizontal, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CONTENT_CONFIG } from '@/config/content';
import type { ArticleTableProps } from '../types';

export function ArticleTable({
  articles,
  isLoading,
  searchTerm,
  categoryFilter,
  statusFilter,
  currentPage,
  perPage,
  totalPages,
  selectedArticles,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onPageChange,
  onPerPageChange,
  onToggleSelection,
  onSelectAll,
  onViewArticle,
  onEditArticle,
  onDuplicateArticle,
  onDeleteArticle,
  onNewArticle,
}: ArticleTableProps) {
  return (
    <section className="space-y-4">
      {/* Filtros - Responsivo */}
      <section className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <section className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
          <Input
            placeholder="Buscar artigos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </section>

        {/* Filtros em dropdown no mobile */}
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Todas categorias</option>
            {Object.values(CONTENT_CONFIG.categories).map((cat) => (
              <option key={cat.slug} value={cat.slug}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value as typeof statusFilter)}
            className="flex-1 sm:flex-none px-3 py-2 border rounded-md text-sm"
          >
            <option value="all">Todos status</option>
            <option value="published">Publicado</option>
            <option value="breaking">Urgente</option>
            <option value="featured">Destaque</option>
          </select>
          <Button className="bg-[#c40000] hover:bg-[#a00000] gap-2 whitespace-nowrap" onClick={onNewArticle}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>
      </section>

      {/* Lista de Artigos - Cards no mobile, tabela no desktop */}
      <section className="bg-white border rounded-xl overflow-hidden">
        {isLoading ? (
          <section className="p-12 text-center">
            <section className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#c40000] rounded-full animate-spin mx-auto" />
          </section>
        ) : (
          <>
            {/* Desktop: Tabela */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead className="bg-[#f9fafb] border-b">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selectedArticles.length === articles.length && articles.length > 0}
                        onChange={onSelectAll}
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Artigo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Categoria</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Views</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {articles.map((article) => (
                    <tr
                      key={article.slug}
                      className={`hover:bg-[#f9fafb] ${selectedArticles.includes(article.slug) ? 'bg-[#fef2f2]' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedArticles.includes(article.slug)}
                          onChange={() => onToggleSelection(article.slug)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <section className="flex items-center gap-3">
                          <img src={article.coverImage} alt="" className="w-12 h-12 rounded object-cover" />
                          <section>
                            <p className="font-medium text-sm">{article.title}</p>
                            <p className="text-xs text-[#6b6b6b]">por {article.author}</p>
                          </section>
                        </section>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {CONTENT_CONFIG.categories[article.category as keyof typeof CONTENT_CONFIG.categories]?.name}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {article.breaking ? (
                          <Badge className="bg-[#fef2f2] text-[#c40000]">
                            <Zap className="w-3 h-3 mr-1" />Urgente
                          </Badge>
                        ) : article.featured ? (
                          <Badge className="bg-[#fefce8] text-[#a16207]">
                            <Star className="w-3 h-3 mr-1" />Destaque
                          </Badge>
                        ) : (
                          <Badge className="bg-[#f0fdf4] text-[#166534]">Publicado</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#6b6b6b]">
                        {article.views.toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewArticle(article.slug)}>
                              <Eye className="w-4 h-4 mr-2" /> Visualizar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditArticle(article.slug)}>
                              <Edit2 className="w-4 h-4 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicateArticle(article)}>
                              <Copy className="w-4 h-4 mr-2" /> Duplicar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onDeleteArticle(article)} className="text-[#ef4444]">
                              <Trash2 className="w-4 h-4 mr-2" /> Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile: Cards */}
            <div className="md:hidden">
              {articles.map((article) => (
                <article key={article.slug} className="p-4 border-b last:border-b-0">
                  <div className="flex gap-3">
                    <input
                      type="checkbox"
                      checked={selectedArticles.includes(article.slug)}
                      onChange={() => onToggleSelection(article.slug)}
                      className="mt-1"
                    />
                    <img src={article.coverImage} alt="" className="w-20 h-20 rounded object-cover flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-[#111111] line-clamp-2">{article.title}</h3>
                      <p className="text-xs text-[#6b6b6b] mt-1">{article.author}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {article.breaking ? (
                          <Badge className="text-xs bg-[#fef2f2] text-[#c40000]">Urgente</Badge>
                        ) : article.featured ? (
                          <Badge className="text-xs bg-[#fefce8] text-[#a16207]">Destaque</Badge>
                        ) : (
                          <Badge className="text-xs bg-[#f0fdf4] text-[#166534]">Publicado</Badge>
                        )}
                        <span className="text-xs text-[#6b6b6b]">
                          {article.views.toLocaleString('pt-BR')} views
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onViewArticle(article.slug)}>
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditArticle(article.slug)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-[#ef4444]" onClick={() => onDeleteArticle(article)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </article>
              ))}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <section className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t gap-4">
                <section className="flex items-center gap-2">
                  <span className="text-sm text-[#6b6b6b]">Itens:</span>
                  <select
                    value={perPage}
                    onChange={(e) => onPerPageChange(Number(e.target.value))}
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </section>
                <section className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-[#6b6b6b]">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </section>
              </section>
            )}
          </>
        )}
      </section>
    </section>
  );
}
