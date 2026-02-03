/**
 * Mapa de Tensões Geopolíticas
 * Lista de pontos de tensão global
 */

import { AlertTriangle, MapPin, Clock } from 'lucide-react';
import { tensionPoints, tensionLevelConfig } from '@/config/geoecon';

export function TensionMap() {
  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
      <header className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-[#c40000]" />
        <h2 className="text-lg font-bold text-[#111111]">Mapa de Tensões</h2>
      </header>

      {/* Legenda */}
      <section className="flex flex-wrap gap-2 mb-4">
        {Object.entries(tensionLevelConfig).map(([key, config]) => (
          <span 
            key={key}
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${config.bg}`}
          >
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: config.color }}
            />
            {config.label}
          </span>
        ))}
      </section>

      {/* Lista de tensões */}
      <ul className="space-y-3">
        {tensionPoints.map((point) => {
          const config = tensionLevelConfig[point.level];
          return (
            <li key={point.id}>
              <article className={`p-3 rounded-lg ${config.bg} border-l-4`} style={{ borderLeftColor: config.color }}>
                <header className="flex items-start justify-between gap-2">
                  <section className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#111111] text-sm sm:text-base truncate">
                      {point.title}
                    </h3>
                    <p className="flex items-center gap-1 text-xs text-[#6b6b6b] mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {point.region} • {point.country}
                    </p>
                  </section>
                  <span 
                    className="px-2 py-0.5 rounded text-xs font-medium text-white flex-shrink-0"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.label}
                  </span>
                </header>
                <p className="text-xs sm:text-sm text-[#374151] mt-2 line-clamp-2">
                  {point.description}
                </p>
                <footer className="flex items-center gap-1 mt-2 text-xs text-[#6b6b6b]">
                  <Clock className="w-3 h-3" />
                  Atualizado: {new Date(point.lastUpdate).toLocaleDateString('pt-BR')}
                </footer>
              </article>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
