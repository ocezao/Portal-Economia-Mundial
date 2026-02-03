/**
 * Ticker de Mercado Financeiro
 * Scroll infinito com cotações em tempo real
 */

import { useMarket } from '@/hooks/useMarket';
import { formatPrice, formatChange } from '@/config/market';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function MarketTicker() {
  const { data } = useMarket();

  // Duplicar dados para scroll infinito
  const tickerData = [...data, ...data];

  return (
    <aside 
      className="bg-[#111111] text-white overflow-hidden h-10 flex items-center"
      aria-label="Cotações de mercado em tempo real"
    >
      <section className="flex ticker-animation whitespace-nowrap">
        {tickerData.map((item, index) => {
          const isPositive = item.change >= 0;
          const isNeutral = item.change === 0;
          
          return (
            <article
              key={`${item.symbol}-${index}`}
              className="flex items-center gap-2 px-4 border-r border-[#333333]"
            >
              <span className="font-mono text-xs font-semibold text-[#e5e5e5]">
                {item.symbol}
              </span>
              <span className="font-mono text-sm">
                {formatPrice(item.price, item.currency)}
              </span>
              <span 
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  isPositive ? 'text-[#22c55e]' : isNeutral ? 'text-[#6b6b6b]' : 'text-[#c40000]'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : isNeutral ? (
                  <Minus className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {formatChange(item.change, item.changePercent)}
              </span>
            </article>
          );
        })}
      </section>
    </aside>
  );
}
