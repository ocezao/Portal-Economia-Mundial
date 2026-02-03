/**
 * Portal Econômico Mundial - Aplicação Principal
 * Rotas e configurações globais
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, ProtectedRoute } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Home } from '@/pages/Home';
import { Category } from '@/pages/Category';
import { Article } from '@/pages/Article';
import { About } from '@/pages/About';
import { Privacy, Terms, Cookies } from '@/pages/Legal';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { UserDashboard } from '@/pages/UserDashboard';
import { UserProfile } from '@/pages/UserProfile';
import { UserPreferences } from '@/pages/UserPreferences';
import { UserSettings } from '@/pages/UserSettings';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { AdminNewsEdit } from '@/pages/AdminNewsEdit';
import { AdminUsers } from '@/pages/AdminUsers';
import { AdminDiagnostico } from '@/pages/AdminDiagnostico';
import { ROUTES } from '@/config/routes';
import './config/theme.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas com Layout */}
          <Route element={<Layout />}>
            <Route path={ROUTES.home} element={<Home />} />
            <Route path="/categoria/:slug" element={<Category />} />
            <Route path="/noticias/:slug" element={<Article />} />
            <Route path={ROUTES.sobre} element={<About />} />
            <Route path={ROUTES.privacidade} element={<Privacy />} />
            <Route path={ROUTES.termos} element={<Terms />} />
            <Route path={ROUTES.cookies} element={<Cookies />} />
          </Route>

          {/* Login e Cadastro (sem Layout) */}
          <Route path={ROUTES.login} element={<Login />} />
          <Route path="/cadastro" element={<Register />} />

          {/* Área do Usuário - Protegida */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path={ROUTES.app.root} element={<UserDashboard />} />
            <Route path={ROUTES.app.perfil} element={<UserProfile />} />
            <Route path={ROUTES.app.preferencias} element={<UserPreferences />} />
            <Route path={ROUTES.app.configuracoes} element={<UserSettings />} />
          </Route>

          {/* Admin - Protegida (apenas admin) */}
          <Route element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }>
            <Route path={ROUTES.admin.root} element={<AdminDashboard />} />
            <Route path={ROUTES.admin.novaNoticia} element={<AdminNewsEdit />} />
            <Route path="/admin/noticias/editar/:slug" element={<AdminNewsEdit />} />
            <Route path={ROUTES.admin.usuarios} element={<AdminUsers />} />
            <Route path="/admin/diagnostico" element={<AdminDiagnostico />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={
            <section className="min-h-screen flex items-center justify-center">
              <article className="text-center">
                <h1 className="text-6xl font-black text-[#111111] mb-4">404</h1>
                <p className="text-xl text-[#6b6b6b] mb-6">Página não encontrada</p>
                <a 
                  href={ROUTES.home}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#c40000] text-white font-medium rounded hover:bg-[#a00000] transition-colors"
                >
                  Voltar para home
                </a>
              </article>
            </section>
          } />
        </Routes>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
