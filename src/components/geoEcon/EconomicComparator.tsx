/**
 * Comparador Econômico
 * Compara indicadores entre países
 */

import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { inflationComparison, interestRateComparison } from '@/config/geoecon';

interface ComparisonTableProps {
  title: string;
  data: typeof inflationComparison;
  unit: string;
}

function ComparisonTable({ title, data, unit }: ComparisonTableProps) {
  return (
    <section className="space-y-3">
      <h3 className="font-medium text-[#111111] text-sm">{title}</h3>
      <ul className="space-y-2">
        {data.map((item) => {
          const isPositive = item.change > 0;
          const isNeutral = item.change === 0;
          const ChangeIcon = isPositive ? TrendingUp : isNeutral ? null : TrendingDown;
          const changeColor = isPositive ? '#ef4444' : isNeutral ? '#6b6b6b' : '#22c55e';
          
          return (
            <li key={item.id}>
              <article className="flex items-center justify-between p-2 bg-[#f9fafb] rounded">
                <span className="text-sm text-[#111111]">{item.label}</span>
                <section className="flex items-center gap-3">
                  <span className="font-semibold text-[#111111]">
                    {item.current}{unit}
                  </span>
                  <span 
                    className="flex items-center gap-0.5 text-xs"
                    style={{ color: changeColor }}
                  >
                    {ChangeIcon && <ChangeIcon className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{item.change}{unit}
                  </span>
                </section>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function EconomicComparator() {
  return (
    <aside className="bg-white border border-[#e5e5e5] rounded-lg p-4 sm:p-6">
      <header className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-[#c40000]" />
        <h2 className="text-lg font-bold text-[#111111]">Comparador</h2>
      </header>

      <section className="space-y-6">
        <ComparisonTable 
          title="Inflação (12 meses)" 
          data={inflationComparison} 
          unit="%" 
        />
        
        <section className="border-t border-[#e5e5e5] pt-4">
          <ComparisonTable 
            title="Taxas de Juros" 
            data={interestRateComparison} 
            unit="%" 
          />
        </section>
      </section>

      <footer className="mt-4 pt-4 border-t border-[#e5e5e5]">
        <p className="text-xs text-[#6b6b6b]">
          Dados de referência. Variação em relação ao período anterior.
        </p>
      </footer>
    </aside>
  );
}
