/**
 * Configuração de Dados Geopolíticos e Econômicos
 * Mock data para módulos interativos
 */

// ==================== MAPA DE TENSÕES ====================

export interface TensionPoint {
  id: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  url?: string;
  lastUpdate: string;
}

export const tensionPoints: TensionPoint[] = [
  {
    id: 't1',
    region: 'Europa Oriental',
    country: 'Ucrânia',
    lat: 48.3794,
    lng: 31.1656,
    level: 'critical',
    title: 'Conflito Rússia-Ucrânia',
    description: 'Guerra em curso com intensos combates no leste ucraniano.',
    lastUpdate: '2024-01-15T10:00:00Z',
  },
  {
    id: 't2',
    region: 'Oriente Médio',
    country: 'Gaza',
    lat: 31.5017,
    lng: 34.4668,
    level: 'critical',
    title: 'Conflito Israel-Hamas',
    description: 'Hostilidades continuam com alto custo humano.',
    lastUpdate: '2024-01-15T08:30:00Z',
  },
  {
    id: 't3',
    region: 'Ásia',
    country: 'Taiwan',
    lat: 23.6978,
    lng: 120.9605,
    level: 'high',
    title: 'Tensões China-Taiwan',
    description: 'Exercícios militares chineses aumentam tensões na região.',
    lastUpdate: '2024-01-14T16:00:00Z',
  },
  {
    id: 't4',
    region: 'América do Sul',
    country: 'Venezuela',
    lat: 6.4238,
    lng: -66.5897,
    level: 'medium',
    title: 'Disputa Territorial Guiana',
    description: 'Tensões diplomáticas por território de Essequibo.',
    lastUpdate: '2024-01-13T12:00:00Z',
  },
  {
    id: 't5',
    region: 'África',
    country: 'Sudão',
    lat: 12.8628,
    lng: 30.2176,
    level: 'high',
    title: 'Conflito Civil Sudanês',
    description: 'Confronto entre exército e forças paramilitares.',
    lastUpdate: '2024-01-14T09:00:00Z',
  },
];

export const tensionLevelConfig = {
  low: { color: '#22c55e', label: 'Baixa', bg: 'bg-[#dcfce7]' },
  medium: { color: '#f59e0b', label: 'Média', bg: 'bg-[#fef3c7]' },
  high: { color: '#f97316', label: 'Alta', bg: 'bg-[#ffedd5]' },
  critical: { color: '#ef4444', label: 'Crítica', bg: 'bg-[#fef2f2]' },
};

// ==================== AGENDA ECONÔMICA ====================

export interface EconomicEvent {
  id: string;
  date: string;
  time?: string;
  title: string;
  country: string;
  impact: 'low' | 'medium' | 'high';
  category: 'indicador' | 'politica' | 'reuniao' | 'resultado';
  description: string;
}

export const economicAgenda: EconomicEvent[] = [
  {
    id: 'e1',
    date: '2024-01-16',
    time: '09:00',
    title: 'IPC - Brasil',
    country: 'BR',
    impact: 'high',
    category: 'indicador',
    description: 'Índice de Preços ao Consumidor',
  },
  {
    id: 'e2',
    date: '2024-01-17',
    time: '15:30',
    title: 'Vendas no Varejo - EUA',
    country: 'US',
    impact: 'medium',
    category: 'indicador',
    description: 'Dados de vendas do varejo americano',
  },
  {
    id: 'e3',
    date: '2024-01-18',
    time: '21:00',
    title: 'Reunião do BCE',
    country: 'EU',
    impact: 'high',
    category: 'reuniao',
    description: 'Decisão de política monetária do Banco Central Europeu',
  },
  {
    id: 'e4',
    date: '2024-01-19',
    time: '10:00',
    title: 'PIB - China',
    country: 'CN',
    impact: 'high',
    category: 'indicador',
    description: 'Dados do Produto Interno Bruto chinês',
  },
  {
    id: 'e5',
    date: '2024-01-22',
    time: '14:00',
    title: 'Relatório de Emprego - Reino Unido',
    country: 'UK',
    impact: 'medium',
    category: 'indicador',
    description: 'Dados de mercado de trabalho britânico',
  },
];

export const impactConfig = {
  low: { color: '#6b6b6b', label: 'Baixo' },
  medium: { color: '#f59e0b', label: 'Médio' },
  high: { color: '#c40000', label: 'Alto' },
};

export const categoryConfig = {
  indicador: { icon: 'chart', label: 'Indicador' },
  politica: { icon: 'landmark', label: 'Política' },
  reuniao: { icon: 'users', label: 'Reunião' },
  resultado: { icon: 'file', label: 'Resultado' },
};

// ==================== TERMÔMETRO DE RISCO ====================

export interface RiskIndex {
  id: string;
  name: string;
  region: string;
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  factors: string[];
  lastUpdate: string;
}

export const riskIndices: RiskIndex[] = [
  {
    id: 'r1',
    name: 'Risco Geopolítico Global',
    region: 'Mundial',
    currentValue: 78,
    previousValue: 75,
    trend: 'up',
    factors: ['Conflitos em curso', 'Tensões Taiwan', 'Instabilidade Médio Oriente'],
    lastUpdate: '2024-01-15T00:00:00Z',
  },
  {
    id: 'r2',
    name: 'Risco Econômico - Europa',
    region: 'Europa',
    currentValue: 62,
    previousValue: 64,
    trend: 'down',
    factors: ['Inflação em queda', 'Crescimento estável'],
    lastUpdate: '2024-01-15T00:00:00Z',
  },
  {
    id: 'r3',
    name: 'Risco Cambial - Emergentes',
    region: 'Mercados Emergentes',
    currentValue: 71,
    previousValue: 70,
    trend: 'up',
    factors: ['Fortalecimento do dólar', 'Saída de capitais'],
    lastUpdate: '2024-01-15T00:00:00Z',
  },
  {
    id: 'r4',
    name: 'Risco de Inflação - Brasil',
    region: 'Brasil',
    currentValue: 45,
    previousValue: 48,
    trend: 'down',
    factors: ['IPCA em queda', 'Expectativas âncoradas'],
    lastUpdate: '2024-01-15T00:00:00Z',
  },
];

export function getRiskLevel(value: number): { level: string; color: string } {
  if (value >= 75) return { level: 'Crítico', color: '#ef4444' };
  if (value >= 60) return { level: 'Alto', color: '#f97316' };
  if (value >= 40) return { level: 'Moderado', color: '#f59e0b' };
  return { level: 'Baixo', color: '#22c55e' };
}

// ==================== COMPARADOR ECONÔMICO ====================

export interface ComparisonData {
  id: string;
  label: string;
  current: number;
  previous: number;
  unit: string;
  change: number;
}

export const inflationComparison: ComparisonData[] = [
  { id: 'c1', label: 'Brasil', current: 4.62, previous: 5.79, unit: '%', change: -1.17 },
  { id: 'c2', label: 'EUA', current: 3.4, previous: 3.1, unit: '%', change: 0.3 },
  { id: 'c3', label: 'Zona Euro', current: 2.9, previous: 2.4, unit: '%', change: 0.5 },
  { id: 'c4', label: 'China', current: 0.3, previous: 0.2, unit: '%', change: 0.1 },
];

export const interestRateComparison: ComparisonData[] = [
  { id: 'i1', label: 'Brasil (Selic)', current: 11.75, previous: 12.75, unit: '%', change: -1.0 },
  { id: 'i2', label: 'EUA (Fed Funds)', current: 5.5, previous: 5.5, unit: '%', change: 0 },
  { id: 'i3', label: 'Zona Euro', current: 4.5, previous: 4.5, unit: '%', change: 0 },
  { id: 'i4', label: 'Reino Unido', current: 5.25, previous: 5.25, unit: '%', change: 0 },
];
