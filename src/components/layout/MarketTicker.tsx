/**
 * Ticker de Mercado Financeiro
 * Scroll infinito com cotações em tempo real da Finnhub API
 */

import { memo, useMemo, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useMarketTicker } from '@/hooks/economics';
import { cn } from '@/lib/utils';

interface MarketItem {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  currency: string;
}

export const MarketTicker = memo(function MarketTicker() {
  const { data, isLoading, error } = useMarketTicker();

  // Hooks must be called unconditionally. Keep these above any early returns.
  // (React will throw in production if hooks order changes between renders.)
  const tickerData = useMemo(() => [...data, ...data], [data]);

  // useCallback para formatação de números
  const formatPrice = useCallback((price: number | undefined, currency: string): string => {
    if (price === undefined || !Number.isFinite(price)) {
      return '--';
    }

    if (currency === 'BRL') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(price);
    }
    if (currency === 'EUR') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'EUR',
        maximumFractionDigits: 0,
      }).format(price);
    }
    if (currency === 'GBP') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'GBP',
        maximumFractionDigits: 0,
      }).format(price);
    }
    if (currency === 'JPY') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'JPY',
        maximumFractionDigits: 0,
      }).format(price);
    }
    
    // USD ou outros
    if (price < 1) {
      return `$${price.toFixed(4)}`;
    }
    if (price < 100) {
      return `$${price.toFixed(2)}`;
    }
    if (price < 10000) {
      return `$${price.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
    }
    return `$${(price / 1000).toFixed(1)}K`;
  }, []);

  const formatChange = useCallback((change: number | undefined, changePercent: number | undefined): string => {
    if (changePercent === undefined || !Number.isFinite(changePercent)) {
      return '--';
    }

    const sign = (change ?? 0) >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }, []);

  // Se houver erro ou estiver carregando com dados vazios
  if (error && data.length === 0) {
    return (
      <aside 
        className="bg-[#111111] text-white overflow-hidden h-10 flex items-center justify-center"
        aria-label="Erro ao carregar cotações"
        data-testid="market-ticker"
        data-state="error"
      >
        <span className="flex items-center gap-2 text-sm text-[#9b9b9b]">
          <AlertCircle className="w-4 h-4" />
          Dados de mercado indisponíveis no momento
        </span>
      </aside>
    );
  }

  // Se estiver carregando
  if (isLoading && data.length === 0) {
    return (
      <aside 
        className="bg-[#111111] text-white overflow-hidden h-10 flex items-center"
        aria-label="Carregando cotações"
        data-testid="market-ticker"
        data-state="loading"
      >
        <div className="flex items-center gap-8 px-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-12 h-3 bg-[#333333] rounded"></div>
              <div className="w-16 h-4 bg-[#333333] rounded"></div>
              <div className="w-12 h-3 bg-[#333333] rounded"></div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside 
      className="bg-[#111111] text-white overflow-hidden h-10 flex items-center"
      aria-label="Cotações de mercado em tempo real"
      data-testid="market-ticker"
      data-state="loaded"
    >
      <section className="flex ticker-animation whitespace-nowrap">
        {tickerData.map((item, index) => {
          const isPositive = item.change >= 0;
          const isNeutral = item.change === 0;
          
          return (
            <TickerItem
              key={`${item.symbol}-${index}`}
              item={item}
              isPositive={isPositive}
              isNeutral={isNeutral}
              formatPrice={formatPrice}
              formatChange={formatChange}
            />
          );
        })}
      </section>
    </aside>
  );
});
MarketTicker.displayName = 'MarketTicker';

// Componente interno otimizado para cada item do ticker
interface TickerItemProps {
  item: MarketItem;
  isPositive: boolean;
  isNeutral: boolean;
  formatPrice: (price: number | undefined, currency: string) => string;
  formatChange: (change: number | undefined, changePercent: number | undefined) => string;
}

const TickerItem = memo(function TickerItem({ 
  item, 
  isPositive, 
  isNeutral, 
  formatPrice, 
  formatChange 
}: TickerItemProps) {
  return (
    <article
      className="flex items-center gap-2 px-4 border-r border-[#333333]"
    >
      <span className="font-mono text-xs font-semibold text-[#e5e5e5]">
        {item.symbol}
      </span>
      <span className="font-mono text-sm">
        {formatPrice(item.price, item.currency)}
      </span>
      <span 
        className={cn(
          "flex items-center gap-0.5 text-xs font-medium",
          isPositive ? 'text-[#22c55e]' : isNeutral ? 'text-[#6b6b6b]' : 'text-[#c40000]'
        )}
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
});
TickerItem.displayName = 'TickerItem';
