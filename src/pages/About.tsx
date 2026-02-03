/**
 * Página Sobre
 * Informações sobre o portal
 */

import { APP_CONFIG } from '@/config/app';
import { Award, Users, Globe, TrendingUp } from 'lucide-react';

export function About() {
  return (
    <>
      <title>Sobre - {APP_CONFIG.brand.name}</title>
      <meta name="description" content={`Conheça o ${APP_CONFIG.brand.name}, portal de notícias especializado em geopolítica, economia e tecnologia.`} />

      {/* Hero */}
      <header className="bg-[#111111] text-white py-20">
        <section className="max-w-[1280px] mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            {APP_CONFIG.brand.name}
          </h1>
          <p className="text-xl md:text-2xl text-[#9ca3af] max-w-2xl mx-auto">
            {APP_CONFIG.brand.tagline}
          </p>
        </section>
      </header>

      {/* Mission */}
      <section className="py-16">
        <section className="max-w-[768px] mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111111] mb-6">Nossa Missão</h2>
          <p className="text-lg text-[#6b6b6b] leading-relaxed mb-6">
            O {APP_CONFIG.brand.name} nasceu da necessidade de oferecer análises aprofundadas 
            e contextualizadas sobre os eventos que moldam o mundo. Em um cenário de 
            sobrecarga informacional, buscamos clareza, precisão e relevância.
          </p>
          <p className="text-lg text-[#6b6b6b] leading-relaxed">
            Nossa equipe de jornalistas e analistas trabalha para trazer não apenas 
            os fatos, mas também as interpretações que ajudam nossos leitores a 
            compreender as complexas interações entre geopolítica, economia global 
            e tecnologia.
          </p>
        </section>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#f5f5f5]">
        <section className="max-w-[1280px] mx-auto px-4">
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <li className="text-center">
              <Award className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">10+</p>
              <p className="text-sm text-[#6b6b6b]">Anos de experiência</p>
            </li>
            <li className="text-center">
              <Users className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">50+</p>
              <p className="text-sm text-[#6b6b6b]">Jornalistas</p>
            </li>
            <li className="text-center">
              <Globe className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">30+</p>
              <p className="text-sm text-[#6b6b6b]">Países cobertos</p>
            </li>
            <li className="text-center">
              <TrendingUp className="w-10 h-10 mx-auto mb-4 text-[#c40000]" />
              <p className="text-3xl font-black text-[#111111]">2M+</p>
              <p className="text-sm text-[#6b6b6b]">Leitores mensais</p>
            </li>
          </ul>
        </section>
      </section>

      {/* Team */}
      <section className="py-16">
        <section className="max-w-[1280px] mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#111111] mb-8 text-center">Nossa Equipe</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Object.values(APP_CONFIG.contact).length > 0 && (
              <>
                <li className="text-center">
                  <figure className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#6b6b6b]">AS</span>
                  </figure>
                  <h3 className="text-lg font-bold text-[#111111]">Ana Silva</h3>
                  <p className="text-sm text-[#c40000]">Editora Chefe</p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    Jornalista com 15 anos de experiência em cobertura econômica internacional.
                  </p>
                </li>
                <li className="text-center">
                  <figure className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#6b6b6b]">CM</span>
                  </figure>
                  <h3 className="text-lg font-bold text-[#111111]">Carlos Mendes</h3>
                  <p className="text-sm text-[#c40000]">Analista de Mercados</p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    Economista e especialista em mercados emergentes.
                  </p>
                </li>
                <li className="text-center">
                  <figure className="w-24 h-24 mx-auto mb-4 rounded-full bg-[#e5e5e5] flex items-center justify-center">
                    <span className="text-2xl font-bold text-[#6b6b6b]">MO</span>
                  </figure>
                  <h3 className="text-lg font-bold text-[#111111]">Maria Oliveira</h3>
                  <p className="text-sm text-[#c40000]">Correspondente Internacional</p>
                  <p className="text-sm text-[#6b6b6b] mt-2">
                    Baseada em Bruxelas, cobre União Europeia e relações transatlânticas.
                  </p>
                </li>
              </>
            )}
          </ul>
        </section>
      </section>

      {/* Contact */}
      <section className="py-16 bg-[#f5f5f5]">
        <section className="max-w-[768px] mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-[#111111] mb-6">Entre em Contato</h2>
          <p className="text-lg text-[#6b6b6b] mb-8">
            Tem uma sugestão, denúncia ou quer falar com nossa equipe? 
            Estamos sempre abertos a ouvir nossos leitores.
          </p>
          <address className="not-italic space-y-2 text-[#111111]">
            <p>{APP_CONFIG.contact.email}</p>
            <p>{APP_CONFIG.contact.phone}</p>
            <p>{APP_CONFIG.contact.address}</p>
          </address>
        </section>
      </section>
    </>
  );
}
