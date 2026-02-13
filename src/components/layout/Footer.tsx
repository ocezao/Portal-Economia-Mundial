/**
 * Footer Principal
 * Semântico: footer, nav, address
 */

'use client';

import { memo, useMemo } from 'react';
import Link from 'next/link';
import { APP_CONFIG } from '@/config/app';
import { ROUTES, CATEGORIES } from '@/config/routes';
import { Twitter, Facebook, Instagram, Linkedin, Youtube, Mail, Phone, MapPin } from 'lucide-react';

// Componente de link de categoria memoizado
interface CategoryLinkProps {
  slug: string;
  name: string;
}

const CategoryLink = memo(function CategoryLink({ slug, name }: CategoryLinkProps) {
  return (
    <li>
      <Link
        href={ROUTES.categoria(slug)}
        className="text-sm text-[#9ca3af] hover:text-white transition-colors"
      >
        {name}
      </Link>
    </li>
  );
});
CategoryLink.displayName = 'CategoryLink';

export const Footer = memo(function Footer() {
  // useMemo para ano atual (evita recálculo a cada render)
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  
  // useMemo para dados do app config (evita recriação a cada render)
  const { brand, contact } = useMemo(() => APP_CONFIG, []);
  

  // useMemo para lista de categorias (evita recriação do array)
  const categoryLinks = useMemo(() => 
    CATEGORIES.map(cat => (
      <CategoryLink key={cat.slug} slug={cat.slug} name={cat.name} />
    )),
  []);

  return (
    <footer className="bg-[#111111] text-white mt-auto">
      {/* Main Footer */}
      <section className="max-w-[1280px] mx-auto px-4 py-12">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <article>
            <h2 className="text-2xl font-black tracking-tight mb-4 font-headline">
              {brand.short}
            </h2>
            <p className="text-sm text-[#9ca3af] mb-4">
              {brand.tagline}. Cobertura nacional e internacional.
            </p>
            <address className="not-italic space-y-2 text-sm text-[#9ca3af]">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {contact.address}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a 
                  href={`mailto:${contact.email}`}
                  className="hover:text-white transition-colors"
                >
                  {contact.email}
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a 
                  href={`tel:${contact.phone}`}
                  className="hover:text-white transition-colors"
                >
                  {contact.phone}
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
              {categoryLinks}
            </ul>
          </nav>

          {/* Links Úteis */}
          <nav aria-label="Links uteis">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Links uteis
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href={ROUTES.sobre} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Sobre nos
                </Link>
              </li>
              <li>
                <Link href="/editorial/" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Editorial
                </Link>
              </li>
              <li>
                <Link href="/editorial/#equipe" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Nossa equipe
                </Link>
              </li>
              <li>
                <Link href={ROUTES.login} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Area do assinante
                </Link>
              </li>
              <li>
                <Link href={ROUTES.termometroRisco} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Termometro de risco
                </Link>
              </li>
              <li>
                <Link href={ROUTES.mapaTensoes} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Mapa de tensoes
                </Link>
              </li>
              <li>
                <Link href={ROUTES.faleConosco} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Fale conosco
                </Link>
              </li>
              <li>
                <Link href={ROUTES.trabalheConosco} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Trabalhe conosco
                </Link>
              </li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">
              Legal
            </h3>
            <ul className="space-y-2">
              <li>
                <Link href={ROUTES.termos} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href={ROUTES.privacidade} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Politica de privacidade
                </Link>
              </li>
              <li>
                <Link href={ROUTES.cookies} className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                  Politica de cookies
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
          <nav aria-label="Social">
            <ul className="flex items-center gap-4">
              <li>
                <a 
                  href={`https://twitter.com/${contact.social.twitter.replace('@', '')}`}
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
                  href={`https://facebook.com/${contact.social.facebook}`}
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
                  href={`https://instagram.com/${contact.social.instagram.replace('@', '')}`}
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
                  href={`https://linkedin.com/company/${contact.social.linkedin}`}
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
                  href={`https://youtube.com/${contact.social.youtube}`}
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

          {/* Copyright e Idioma */}
          <section className="flex flex-col sm:flex-row items-center gap-4 text-xs text-[#6b6b6b]">
            <span>© {currentYear} {brand.name}. Todos os direitos reservados.</span>
          </section>
        </section>
      </section>
    </footer>
  );
});
Footer.displayName = 'Footer';
