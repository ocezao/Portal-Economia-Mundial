/**
 * Admin - Gerenciamento de Notícias
 * Lista, filtros e ações em artigos
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Copy, 
  Eye,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { mockArticles } from '@/services/newsService';
import type { NewsArticle } from '@/types';
import { CONTENT_CONFIG } from '@/config/content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminNews() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Filtrar artigos
  const filteredArticles = mockArticles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'published' ? !article.breaking : article.breaking);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleDelete = (_slug: string) => {
    if (confirm('Tem certeza que deseja excluir este artigo?')) {
      // Em mock: apenas alerta
      alert('Em ambiente de demonstração, artigos não podem ser excluídos permanentemente.');
    }
  };

  const handleDuplicate = (article: NewsArticle) => {
    alert(`Artigo "${article.title}" seria duplicado.`);
  };

  return (
    <>
      <title>Gerenciar Notícias - Admin PEM</title>

      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Gerenciar Notícias</h1>
            <p className="text-sm text-[#6b6b6b]">
              {filteredArticles.length} artigos encontrados
            </p>
          </section>
          <Link to={ROUTES.admin.novaNoticia}>
            <Button className="bg-[#c40000] hover:bg-[#a00000]">
              <Plus className="w-4 h-4 mr-2" />
              Nova Notícia
            </Button>
          </Link>
        </header>

        {/* Filtros */}
        <section className="bg-white border border-[#e5e5e5] rounded-lg p-4 mb-6">
          <section className="flex flex-col sm:flex-row gap-3">
            <section className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
              <Input
                type="text"
                placeholder="Buscar por título ou slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </section>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-[#e5e5e5] rounded-md text-sm"
            >
              <option value="all">Todas as categorias</option>
              {Object.values(CONTENT_CONFIG.categories).map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-[#e5e5e5] rounded-md text-sm"
            >
              <option value="all">Todos os status</option>
              <option value="published">Publicado</option>
              <option value="breaking">Urgente</option>
            </select>
          </section>
        </section>

        {/* Lista de Artigos */}
        <section className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
          <section className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb] border-b border-[#e5e5e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Artigo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Views</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {filteredArticles.map((article) => (
                  <tr key={article.slug} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3">
                      <section className="flex items-center gap-3">
                        <img 
                          src={article.coverImage} 
                          alt="" 
                          className="w-12 h-12 rounded object-cover"
                        />
                        <section className="min-w-0">
                          <p className="font-medium text-[#111111] text-sm truncate max-w-[200px]">
                            {article.title}
                          </p>
                          <p className="text-xs text-[#6b6b6b]">/{article.slug}</p>
                        </section>
                      </section>
                    </td>
                    <td className="px-4 py-3">
                      <span 
                        className="px-2 py-1 rounded text-xs font-medium text-white"
                        style={{ backgroundColor: CONTENT_CONFIG.categories[article.category]?.color || '#6b6b6b' }}
                      >
                        {CONTENT_CONFIG.categories[article.category]?.name || article.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6b6b6b]">
                      {new Date(article.publishedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      {article.breaking ? (
                        <span className="flex items-center gap-1 text-xs text-[#c40000]">
                          <XCircle className="w-4 h-4" />
                          Urgente
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[#22c55e]">
                          <CheckCircle className="w-4 h-4" />
                          Publicado
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6b6b6b]">
                      {article.views.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <nav className="flex items-center gap-1">
                        <Link 
                          to={`/noticias/${article.slug}`}
                          className="p-1.5 text-[#6b6b6b] hover:text-[#111111] hover:bg-[#f5f5f5] rounded"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link 
                          to={`/admin/noticias/editar/${article.slug}`}
                          className="p-1.5 text-[#6b6b6b] hover:text-[#3b82f6] hover:bg-[#dbeafe] rounded"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDuplicate(article)}
                          className="p-1.5 text-[#6b6b6b] hover:text-[#8b5cf6] hover:bg-[#ede9fe] rounded"
                          title="Duplicar"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(article.slug)}
                          className="p-1.5 text-[#6b6b6b] hover:text-[#ef4444] hover:bg-[#fef2f2] rounded"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </nav>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          
          {filteredArticles.length === 0 && (
            <section className="p-8 text-center">
              <FileText className="w-12 h-12 mx-auto text-[#e5e5e5] mb-3" />
              <p className="text-[#6b6b6b]">Nenhum artigo encontrado</p>
            </section>
          )}
        </section>
      </main>
    </>
  );
}
