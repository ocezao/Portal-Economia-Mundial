/**
 * Mapa de Tensões - Pagina explicativa
 */

import { APP_CONFIG } from '@/config/app';

export function MapaTensoesInfo() {
  return (
    <>
      <title>Mapa de Tensoes - {APP_CONFIG.brand.name}</title>
      <meta
        name="description"
        content="Entenda o que é o mapa de tensões e como interpretamos os niveis."
      />

      <header className="bg-[#111111] text-white py-16">
        <section className="max-w-[960px] mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-black mb-4">Mapa de Tensoes</h1>
          <p className="text-lg text-[#cbd5f5] max-w-2xl">
            Um retrato diário dos principais pontos de instabilidade no mundo.
          </p>
        </section>
      </header>

      <section className="max-w-[960px] mx-auto px-4 py-12 space-y-10">
        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">O que é</h2>
          <p className="text-base text-[#6b6b6b] leading-relaxed">
            O mapa de tensoes organiza sinais de instabilidade por região e destaca
            focos que podem afetar cadeias globais, energia, comércio e preços.
          </p>
          <p className="text-base text-[#6b6b6b] leading-relaxed mt-4">
            A proposta é oferecer um panorama rápido, com o contexto essencial para
            entender por que cada ponto entrou no radar.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Como interpretamos</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>Eventos com impacto direto em rotas e cadeias ganham maior peso.</li>
            <li>Níveis mais altos indicam risco potencial para mercados e comércio.</li>
            <li>Atualizações refletem a noticia mais recente validada.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Origem das informações</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>Agencias de noticias e comunicados oficiais.</li>
            <li>Dados publicos sobre comercio, energia, transporte e sanções.</li>
            <li>Monitoramento de eventos por regiao com validação cruzada.</li>
          </ul>
          <p className="text-sm text-[#6b6b6b] mt-3">
            Cada ponto no mapa inclui regiao, descricao sintética e data/hora da última atualização.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Frequência e cobertura</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>Eventos criticos podem atualizar intradiário quando há novas ocorrências.</li>
            <li>Regioes com menor fluxo de noticias podem ter atualizações mais espaçadas.</li>
            <li>O mapa prioriza impactos potenciais em rotas, cadeias e precos globais.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Fidelidade e limites</h2>
          <ul className="list-disc pl-5 text-[#6b6b6b] space-y-2">
            <li>O nivel reflete a intensidade do sinal, não uma previsão determinística.</li>
            <li>Eventos complexos podem exigir atualizações retroativas apos confirmações.</li>
            <li>Use o mapa como contexto, não como único critério de decisao.</li>
            <li>Em ambientes de demonstracao, parte dos dados pode ser simulada.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Escala de risco</h2>
          <ul className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <li className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#22c55e]">Baixa</p>
              <p className="text-sm text-[#6b6b6b]">Risco limitado.</p>
            </li>
            <li className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#f59e0b]">Media</p>
              <p className="text-sm text-[#6b6b6b]">Atenção elevada.</p>
            </li>
            <li className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#f97316]">Alta</p>
              <p className="text-sm text-[#6b6b6b]">Impacto relevante.</p>
            </li>
            <li className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#ef4444]">Crítica</p>
              <p className="text-sm text-[#6b6b6b]">Impacto imediato.</p>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-[#111111] mb-3">Dados técnicos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Geolocalização</p>
              <p className="text-sm text-[#6b6b6b]">Coordenadas aproximadas do foco de tensao.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Classificação</p>
              <p className="text-sm text-[#6b6b6b]">Baixa, media, alta ou critica por severidade.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Atualizacao</p>
              <p className="text-sm text-[#6b6b6b]">Carimbo de data/hora por ponto do mapa.</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm font-semibold text-[#111111]">Resumo</p>
              <p className="text-sm text-[#6b6b6b]">Descrição curta com contexto do evento.</p>
            </div>
          </div>
        </section>
      </section>
    </>
  );
}
