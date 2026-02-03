/**
 * Configuração de Dados de Mercado
 * Mock data para ticker e cotações
 */

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  type: 'stock' | 'index' | 'currency' | 'commodity';
  currency: string;
}

export const MARKET_CONFIG = {
  updateInterval: 5000, // ms
  symbols: {
    stocks: ['PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'ABEV3', 'WEGE3', 'BBAS3', 'SUZB3'],
    indices: ['IBOV', 'SPX', 'DJI', 'NASDAQ', 'DXY'],
    currencies: ['USDBRL', 'EURBRL', 'GBPBRL', 'BTCUSD', 'ETHUSD'],
    commodities: ['GOLD', 'OIL', 'SOY'],
  },
} as const;

// Dados iniciais de mercado (mock)
export const initialMarketData: MarketData[] = [
  // Ações Brasileiras
  { symbol: 'PETR4', name: 'Petrobras PN', price: 37.85, change: 0.42, changePercent: 1.12, type: 'stock', currency: 'BRL' },
  { symbol: 'VALE3', name: 'Vale ON', price: 68.92, change: -0.78, changePercent: -1.12, type: 'stock', currency: 'BRL' },
  { symbol: 'ITUB4', name: 'Itaú Unibanco PN', price: 35.47, change: 0.23, changePercent: 0.65, type: 'stock', currency: 'BRL' },
  { symbol: 'BBDC4', name: 'Bradesco PN', price: 15.82, change: -0.12, changePercent: -0.75, type: 'stock', currency: 'BRL' },
  { symbol: 'ABEV3', name: 'Ambev ON', price: 13.45, change: 0.08, changePercent: 0.60, type: 'stock', currency: 'BRL' },
  { symbol: 'WEGE3', name: 'Weg ON', price: 52.30, change: 1.25, changePercent: 2.45, type: 'stock', currency: 'BRL' },
  { symbol: 'BBAS3', name: 'Banco do Brasil ON', price: 28.94, change: 0.56, changePercent: 1.97, type: 'stock', currency: 'BRL' },
  { symbol: 'SUZB3', name: 'Suzano ON', price: 48.67, change: -0.34, changePercent: -0.69, type: 'stock', currency: 'BRL' },
  
  // Índices
  { symbol: 'IBOV', name: 'Ibovespa', price: 128456.78, change: 1256.34, changePercent: 0.99, type: 'index', currency: 'BRL' },
  { symbol: 'SPX', name: 'S&P 500', price: 4892.15, change: -12.45, changePercent: -0.25, type: 'index', currency: 'USD' },
  { symbol: 'DJI', name: 'Dow Jones', price: 38245.67, change: 156.78, changePercent: 0.41, type: 'index', currency: 'USD' },
  { symbol: 'NASDAQ', name: 'Nasdaq', price: 15432.89, change: -89.34, changePercent: -0.58, type: 'index', currency: 'USD' },
  { symbol: 'DXY', name: 'Dólar Index', price: 103.45, change: 0.23, changePercent: 0.22, type: 'index', currency: 'USD' },
  
  // Moedas
  { symbol: 'USDBRL', name: 'Dólar/Real', price: 4.9567, change: 0.0234, changePercent: 0.47, type: 'currency', currency: 'BRL' },
  { symbol: 'EURBRL', name: 'Euro/Real', price: 5.3845, change: -0.0156, changePercent: -0.29, type: 'currency', currency: 'BRL' },
  { symbol: 'GBPBRL', name: 'Libra/Real', price: 6.2845, change: 0.0345, changePercent: 0.55, type: 'currency', currency: 'BRL' },
  { symbol: 'BTCUSD', name: 'Bitcoin', price: 42567.89, change: 1234.56, changePercent: 2.99, type: 'currency', currency: 'USD' },
  { symbol: 'ETHUSD', name: 'Ethereum', price: 2567.34, change: 45.67, changePercent: 1.81, type: 'currency', currency: 'USD' },
  
  // Commodities
  { symbol: 'GOLD', name: 'Ouro', price: 2034.56, change: 12.34, changePercent: 0.61, type: 'commodity', currency: 'USD' },
  { symbol: 'OIL', name: 'Petróleo WTI', price: 76.45, change: -0.89, changePercent: -1.15, type: 'commodity', currency: 'USD' },
  { symbol: 'SOY', name: 'Soja', price: 1245.67, change: 15.67, changePercent: 1.27, type: 'commodity', currency: 'USD' },
];

// Função para simular atualizações de mercado
export function simulateMarketUpdate(data: MarketData[]): MarketData[] {
  return data.map(item => {
    const volatility = item.type === 'currency' ? 0.002 : item.type === 'stock' ? 0.008 : 0.005;
    const change = (Math.random() - 0.5) * 2 * volatility * item.price;
    const newPrice = Math.max(0.01, item.price + change);
    const changePercent = (change / item.price) * 100;
    
    return {
      ...item,
      price: Number(newPrice.toFixed(item.type === 'currency' ? 4 : 2)),
      change: Number(change.toFixed(2)),
      changePercent: Number(changePercent.toFixed(2)),
    };
  });
}

// Formatar preço baseado na moeda
export function formatPrice(price: number, currency: string): string {
  if (currency === 'BRL') {
    return price >= 1000 
      ? price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : price.toFixed(2);
  }
  return price >= 1000
    ? price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : price.toFixed(2);
}

// Formatar variação
export function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
}
