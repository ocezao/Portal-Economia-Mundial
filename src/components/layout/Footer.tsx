/**
 * Footer Principal
 * Semântico: footer, nav, address
 */

import { Link } from 'react-router-dom';
import { APP_CONFIG } from '@/config/app';
import { ROUTES, CATEGORIES } from '@/config/routes';
import { Twitter, Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#111111] text-white mt-auto">
      {/* Main Footer */}
      <section className="max-w-[1280px] mx-auto px-4 py-12">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <article>
            <h2 className="text-2xl font-black tracking-tight mb-4">
              {APP_CONFIG.brand.short}
            </h2>
            <p className="text-sm text-[#9ca3af] mb-4">
              {APP_CONFIG.brand.tagline}. Cobertura em tempo real de geopolítica, economia e tecnologia.
            </p>
            <address className="not-italic space-y-2 text-sm text-[#9ca3af]">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {APP_CONFIG.contact.address}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a 
                  href={`mailto:${APP_CONFIG.contact.email}`}
                  className="hover:text-white transition-colors"
                >
                  {APP_CONFIG.contact.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a 
                  href={`tel:${APP_CONFIG.contact.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {APP_CONFIG.contact.phone}
                </a>
              </p>
            </address>
          </article>

          {/* Categorias */}
          <nav aria-label="Categorias">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Categorias
            </h3>
            <ul className="space-y-2">
              {CATEGORIES.map(cat => (
                <li key={cat.slug}>
                  <Link
                    to={ROUTES.categoria(cat.slug)}
                    className="text-sm text-[#9ca3af] hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Links Úteis */}
          <nav aria-label="Links úteis">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Links Úteis
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to={ROUTES.sobre} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link to={ROUTES.login} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Área do Assinante
                </Link>
              </li>
              <li>
                <a
                  href={`mailto:${APP_CONFIG.contact.email}?subject=Fale%20Conosco`}
                  className="text-sm text-[#9ca3af] hover:text-white transition-colors"
                >
                  Fale Conosco
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${APP_CONFIG.contact.email}?subject=Trabalhe%20Conosco`}
                  className="text-sm text-[#9ca3af] hover:text-white transition-colors"
                >
                  Trabalhe Conosco
                </a>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Informações legais">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to={ROUTES.termos} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to={ROUTES.privacidade} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link to={ROUTES.cookies} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </nav>
        </section>
      </section>

      {/* Social & Copyright */}
      <section className="border-t border-[#333333]">
        <section className="max-w-[1280px] mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Social Links */}
          <nav aria-label="Redes sociais">
            <ul className="flex items-center gap-4">
              <li>
                <a 
                  href={`https://twitter.com/${APP_CONFIG.contact.social.twitter.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9ca3af] hover:text-white transition-colors"
                  aria-label="Twitter"
                >
                  <Twitter className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a 
                  href={`https://facebook.com/${APP_CONFIG.contact.social.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9ca3af] hover:text-white transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a 
                  href={`https://instagram.com/${APP_CONFIG.contact.social.instagram.replace('@', '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9ca3af] hover:text-white transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a 
                  href={`https://linkedin.com/company/${APP_CONFIG.contact.social.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9ca3af] hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
              </li>
              <li>
                <a 
                  href={`https://youtube.com/${APP_CONFIG.contact.social.youtube}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9ca3af] hover:text-white transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </li>
            </ul>
          </nav>

          {/* Copyright */}
          <p className="text-xs text-[#6b6b6b] text-center sm:text-right">
            © {currentYear} {APP_CONFIG.brand.name}. Todos os direitos reservados.
          </p>
        </section>
      </section>
    </footer>
  );
}
