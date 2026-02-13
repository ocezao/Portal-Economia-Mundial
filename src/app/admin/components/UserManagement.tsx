'use client';

import { Users, Plus, Search, Edit2, Trash2, Shield, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { UserManagementProps } from '../types';

export function UserManagement({
  users,
  currentUserId,
  userSearch,
  onSearchChange,
  onAddUser,
  onEditUser,
  onDeleteUser,
  onExportCSV,
}: UserManagementProps) {
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <section className="space-y-4">
      <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <section>
          <h2 className="text-lg font-bold text-[#111111]">Gerenciamento de Usuários</h2>
          <p className="text-sm text-[#6b6b6b]">{users.length} usuário(s) no sistema</p>
        </section>
        <section className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" onClick={onExportCSV} className="gap-2 flex-1 sm:flex-none">
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
          <Button onClick={onAddUser} className="bg-[#c40000] hover:bg-[#a00000] gap-2 flex-1 sm:flex-none">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Usuário</span>
          </Button>
        </section>
      </section>

      <section className="flex gap-3">
        <section className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b6b6b]" />
          <Input
            placeholder="Buscar usuários..."
            value={userSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </section>
      </section>

      {/* Desktop: Tabela / Mobile: Cards */}
      <section className="bg-white border rounded-xl overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead className="bg-[#f9fafb] border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Profissão</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <section className="flex items-center gap-3">
                      <section className="w-10 h-10 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                        <User className="w-5 h-5 text-[#6b6b6b]" />
                      </section>
                      <section>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-[#6b6b6b]">{user.email}</p>
                      </section>
                    </section>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      className={
                        user.role === 'admin'
                          ? 'bg-[#fef2f2] text-[#c40000]'
                          : 'bg-[#f0fdf4] text-[#166534]'
                      }
                    >
                      {user.role === 'admin' ? (
                        <>
                          <Shield className="w-3 h-3 mr-1" /> Admin
                        </>
                      ) : (
                        'Usuário'
                      )}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#6b6b6b]">{user.profession || '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? 'default' : 'secondary'}>
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <section className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onEditUser(user)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteUser(user)}
                        disabled={user.id === currentUserId}
                        className="text-[#ef4444]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </section>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile */}
        <div className="md:hidden">
          {filteredUsers.map((user) => (
            <article key={user.id} className="p-4 border-b last:border-b-0">
              <div className="flex items-start gap-3">
                <section className="w-10 h-10 rounded-full bg-[#e5e5e5] flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#6b6b6b]" />
                </section>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[#111111]">{user.name}</p>
                  <p className="text-xs text-[#6b6b6b]">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <Badge
                      className={
                        user.role === 'admin'
                          ? 'text-xs bg-[#fef2f2] text-[#c40000]'
                          : 'text-xs bg-[#f0fdf4] text-[#166534]'
                      }
                    >
                      {user.role === 'admin' ? 'Admin' : 'Usuário'}
                    </Badge>
                    <Badge variant={user.isActive ? 'default' : 'secondary'} className="text-xs">
                      {user.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  {user.profession && <p className="text-xs text-[#6b6b6b] mt-1">{user.profession}</p>}
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditUser(user)}>
                  <Edit2 className="w-4 h-4 mr-1" /> Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-[#ef4444]"
                  onClick={() => onDeleteUser(user)}
                  disabled={user.id === currentUserId}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <section className="p-12 text-center text-[#6b6b6b]">
            <Users className="w-12 h-12 mx-auto mb-3 text-[#e5e5e5]" />
            <p>Nenhum usuário encontrado</p>
          </section>
        )}
      </section>
    </section>
  );
}
