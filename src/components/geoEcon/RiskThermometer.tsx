/**
 * Termômetro de Risco
 * Índices de risco por região/tema
 */

import { Thermometer, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { riskIndices, getRiskLevel } from '@/config/geoecon';

export function RiskThermometer() {
  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
      <header className="flex items-center gap-2 mb-4">
        <Thermometer className="w-5 h-5 text-[#c40000]" />
        <h2 className="text-lg font-bold text-[#111111]">Termômetro de Risco</h2>
      </header>

      <ul className="space-y-4">
        {riskIndices.map((index) => {
          const risk = getRiskLevel(index.currentValue);
          const TrendIcon = index.trend === 'up' ? TrendingUp : 
                           index.trend === 'down' ? TrendingDown : Minus;
          const trendColor = index.trend === 'up' ? '#ef4444' : 
                            index.trend === 'down' ? '#22c55e' : '#6b6b6b';
          
          return (
            <li key={index.id}>
              <article className="space-y-2">
                <header className="flex items-center justify-between">
                  <section>
                    <h3 className="font-medium text-[#111111] text-sm">{index.name}</h3>
                    <p className="text-xs text-[#6b6b6b]">{index.region}</p>
                  </section>
                  <section className="flex items-center gap-2">
                    <span 
                      className="text-2xl font-bold"
                      style={{ color: risk.color }}
                    >
                      {index.currentValue}
                    </span>
                    <TrendIcon 
                      className="w-4 h-4" 
                      style={{ color: trendColor }}
                    />
                  </section>
                </header>

                {/* Barra de progresso */}
                <section className="relative h-2 bg-[#e5e5e5] rounded-full overflow-hidden">
                  <span 
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${index.currentValue}%`,
                      backgroundColor: risk.color 
                    }}
                  />
                </section>

                {/* Fatores */}
                <ul className="flex flex-wrap gap-1 mt-2">
                  {index.factors.map((factor, i) => (
                    <li key={i}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#f3f4f6] rounded text-xs text-[#6b6b6b]">
                        <AlertCircle className="w-3 h-3" />
                        {factor}
                      </span>
                    </li>
                  ))}
                </ul>
              </article>
            </li>
          );
        })}
      </ul>

      {/* Legenda */}
      <footer className="mt-4 pt-4 border-t border-[#e5e5e5]">
        <p className="text-xs text-[#6b6b6b]">
          Índice de 0 a 100. Valores acima de 75 indicam risco crítico.
        </p>
      </footer>
    </aside>
  );
}
