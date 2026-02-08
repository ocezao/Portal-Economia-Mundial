/**
 * Admin - Gerenciamento de Usuários
 * Lista e ações em usuários
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Shield, 
  User, 
  Ban, 
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { storage } from '@/config/storage';
import { Input } from '@/components/ui/input';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  region: string;
  createdAt: string;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Mock users + registered users
  const registeredUsers = storage.get<{ email: string }[]>('pem_registered_users') || [];
  
  const mockUsers: MockUser[] = [
    {
      id: 'admin-001',
      name: 'Administrador PEM',
      email: 'admin@pem.com',
      role: 'admin',
      region: 'BR',
      createdAt: '2024-01-01T00:00:00Z',
      isActive: true,
    },
    {
      id: 'user-001',
      name: 'Usuário Demo',
      email: 'usuario@exemplo.com',
      role: 'user',
      region: 'BR',
      createdAt: '2024-01-15T00:00:00Z',
      isActive: true,
    },
    ...registeredUsers.map((u, i) => ({
      id: `user-reg-${i}`,
      name: u.email.split('@')[0],
      email: u.email,
      role: 'user' as const,
      region: 'BR',
      createdAt: new Date().toISOString(),
      isActive: true,
    })),
  ];
  
  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handlePromote = () => {
    if (confirm('Tem certeza que deseja promover este usuário para administrador?')) {
      alert('Em ambiente de demonstração, esta ação é simulada.');
    }
  };

  const handleDeactivate = () => {
    if (confirm('Tem certeza que deseja desativar este usuário?')) {
      alert('Em ambiente de demonstração, esta ação é simulada.');
    }
  };

  return (
    <>
      <main className="max-w-[1280px] mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <section>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#111111]">Gerenciar Usuários</h1>
            <p className="text-sm text-[#6b6b6b]">
              {filteredUsers.length} usuários encontrados
            </p>
          </section>
          <Link 
            href="/admin"
            className="text-[#c40000] hover:underline text-sm"
          >
            ← Voltar ao Dashboard
          </Link>
        </header>

        {/* Filtros */}
        <section className="bg-white border border-[#e5e5e5] rounded-lg p-4 mb-6">
          <section className="flex flex-col sm:flex-row gap-3">
            <section className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
              <Input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </section>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 border border-[#e5e5e5] rounded-md text-sm"
            >
              <option value="all">Todos os papéis</option>
              <option value="admin">Administradores</option>
              <option value="user">Usuários</option>
            </select>
          </section>
        </section>

        {/* Lista de Usuários */}
        <section className="bg-white border border-[#e5e5e5] rounded-lg overflow-hidden">
          <section className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#f9fafb] border-b border-[#e5e5e5]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Papel</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Região</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Cadastro</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[#6b6b6b] uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3">
                      <section className="flex items-center gap-3">
                        <figure className="w-10 h-10 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                          <User className="w-5 h-5 text-[#6b6b6b]" />
                        </figure>
                        <section>
                          <p className="font-medium text-[#111111] text-sm">{user.name}</p>
                          <p className="text-xs text-[#6b6b6b]">{user.email}</p>
                        </section>
                      </section>
                    </td>
                    <td className="px-4 py-3">
                      {user.role === 'admin' ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-[#fef2f2] text-[#c40000] text-xs rounded-full">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-[#f3f4f6] text-[#6b6b6b] text-xs rounded-full">
                          <User className="w-3 h-3" />
                          Usuário
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6b6b6b] uppercase">
                      {user.region}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#6b6b6b]">
                      {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 text-xs text-[#22c55e]">
                          <CheckCircle className="w-4 h-4" />
                          Ativo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-[#ef4444]">
                          <Ban className="w-4 h-4" />
                          Inativo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <nav className="flex items-center gap-1">
                        {user.role === 'user' && (
                          <button
                            onClick={() => handlePromote()}
                            className="p-1.5 text-[#6b6b6b] hover:text-[#22c55e] hover:bg-[#dcfce7] rounded"
                            title="Promover a Admin"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        )}
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDeactivate()}
                            className="p-1.5 text-[#6b6b6b] hover:text-[#ef4444] hover:bg-[#fef2f2] rounded"
                            title={user.isActive ? 'Desativar' : 'Reativar'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </nav>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          
          {filteredUsers.length === 0 && (
            <section className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-[#e5e5e5] mb-3" />
              <p className="text-[#6b6b6b]">Nenhum usuário encontrado</p>
            </section>
          )}
        </section>

        {/* Aviso */}
        <aside className="mt-6 p-4 bg-[#fefce8] border border-[#fcd34d] rounded-lg">
          <header className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-[#ca8a04] flex-shrink-0 mt-0.5" />
            <section>
              <h3 className="text-sm font-medium text-[#854d0e]">Ambiente de demonstração</h3>
              <p className="text-xs text-[#a16207] mt-1">
                As ações de promover/desativar usuários são simuladas. Em produção, 
                estas ações seriam persistidas no backend.
              </p>
            </section>
          </header>
        </aside>
      </main>
    </>
  );
}
