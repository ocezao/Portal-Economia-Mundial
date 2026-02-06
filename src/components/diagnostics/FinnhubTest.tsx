/**
 * Componente de Teste para Endpoints Finnhub
 * Verifica se todas as funções estão funcionando
 */

import React, { useState } from 'react';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  searchSymbols,
  getStockSymbols,
  getEarningsCalendar,
  getIPOCalendar,
  getRecommendationTrends,
  getPriceTarget,
  getStockPeers,
  getSupplyChain,
  getMarketStatus,
  getMarketHolidays,
  getSECFilings,
  getCongressionalTrading,
  getQuote,
  getMarketNews,
} from '@/services/economics/finnhubService';

interface TestResult {
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  data?: unknown;
  error?: string;
  duration?: number;
}

const INITIAL_TESTS: TestResult[] = [
  { name: 'searchSymbols (AAPL)', status: 'idle' },
  { name: 'getStockSymbols (US)', status: 'idle' },
  { name: 'getQuote (AAPL)', status: 'idle' },
  { name: 'getMarketNews', status: 'idle' },
  { name: 'getEarningsCalendar', status: 'idle' },
  { name: 'getIPOCalendar', status: 'idle' },
  { name: 'getRecommendationTrends (AAPL)', status: 'idle' },
  { name: 'getPriceTarget (AAPL)', status: 'idle' },
  { name: 'getStockPeers (AAPL)', status: 'idle' },
  { name: 'getSupplyChain (AAPL)', status: 'idle' },
  { name: 'getMarketStatus (US)', status: 'idle' },
  { name: 'getMarketHolidays (US)', status: 'idle' },
  { name: 'getSECFilings (AAPL)', status: 'idle' },
  { name: 'getCongressionalTrading', status: 'idle' },
];

export function FinnhubTest() {
  const [results, setResults] = useState<TestResult[]>(INITIAL_TESTS);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (index: number, update: Partial<TestResult>) => {
    setResults(prev => prev.map((r, i) => i === index ? { ...r, ...update } : r));
  };

  const runTest = async (index: number, testFn: () => Promise<unknown>) => {
    const startTime = Date.now();
    updateResult(index, { status: 'loading' });
    
    try {
      const data = await testFn();
      const duration = Date.now() - startTime;
      updateResult(index, { status: 'success', data, duration });
      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      updateResult(index, { status: 'error', error: errorMsg, duration });
      return false;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults(INITIAL_TESTS);

    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Test 1: searchSymbols
    await runTest(0, () => searchSymbols('Apple'));
    await new Promise(r => setTimeout(r, 500));

    // Test 2: getStockSymbols (limitado a 10 resultados)
    await runTest(1, async () => {
      const result = await getStockSymbols('US');
      return result.slice(0, 10);
    });
    await new Promise(r => setTimeout(r, 500));

    // Test 3: getQuote
    await runTest(2, () => getQuote('AAPL'));
    await new Promise(r => setTimeout(r, 500));

    // Test 4: getMarketNews
    await runTest(3, async () => {
      const result = await getMarketNews('general', 0);
      return result.slice(0, 3);
    });
    await new Promise(r => setTimeout(r, 500));

    // Test 5: getEarningsCalendar
    await runTest(4, async () => {
      const result = await getEarningsCalendar(today, nextWeek);
      return result.slice(0, 5);
    });
    await new Promise(r => setTimeout(r, 500));

    // Test 6: getIPOCalendar
    await runTest(5, async () => {
      const result = await getIPOCalendar(today, nextWeek);
      return result.slice(0, 5);
    });
    await new Promise(r => setTimeout(r, 500));

    // Test 7: getRecommendationTrends
    await runTest(6, () => getRecommendationTrends('AAPL'));
    await new Promise(r => setTimeout(r, 500));

    // Test 8: getPriceTarget
    await runTest(7, () => getPriceTarget('AAPL'));
    await new Promise(r => setTimeout(r, 500));

    // Test 9: getStockPeers
    await runTest(8, () => getStockPeers('AAPL'));
    await new Promise(r => setTimeout(r, 500));

    // Test 10: getSupplyChain
    await runTest(9, () => getSupplyChain('AAPL'));
    await new Promise(r => setTimeout(r, 500));

    // Test 11: getMarketStatus
    await runTest(10, () => getMarketStatus('US'));
    await new Promise(r => setTimeout(r, 500));

    // Test 12: getMarketHolidays
    await runTest(11, () => getMarketHolidays('US'));
    await new Promise(r => setTimeout(r, 500));

    // Test 13: getSECFilings
    await runTest(12, async () => {
      const result = await getSECFilings('AAPL');
      return result.slice(0, 3);
    });
    await new Promise(r => setTimeout(r, 500));

    // Test 14: getCongressionalTrading
    await runTest(13, async () => {
      const result = await getCongressionalTrading(undefined, today, nextWeek);
      return result.slice(0, 5);
    });

    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-300" />;
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  return (
    <section className="max-w-4xl mx-auto p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-[#111111] mb-2">
          Teste de Endpoints Finnhub
        </h1>
        <p className="text-[#6b6b6b]">
          Verificando se todas as novas funções estão funcionando corretamente.
        </p>
      </header>

      <section className="mb-6 flex items-center gap-4">
        <Button
          onClick={runAllTests}
          disabled={isRunning}
          className="bg-[#c40000] hover:bg-[#a00000]"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            'Executar Todos os Testes'
          )}
        </Button>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            {successCount} OK
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-500" />
            {errorCount} Falhas
          </span>
          <span className="text-[#6b6b6b]">
            Total: {results.length}
          </span>
        </div>
      </section>

      <section className="space-y-3">
        {results.map((result) => (
          <article
            key={result.name}
            className={`border rounded-lg overflow-hidden ${
              result.status === 'success' ? 'border-green-200 bg-green-50' :
              result.status === 'error' ? 'border-red-200 bg-red-50' :
              'border-gray-200'
            }`}
          >
            <header className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <span className="font-medium text-[#111111]">{result.name}</span>
                {result.duration && (
                  <span className="text-xs text-[#6b6b6b]">
                    ({result.duration}ms)
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded ${
                result.status === 'success' ? 'bg-green-100 text-green-700' :
                result.status === 'error' ? 'bg-red-100 text-red-700' :
                result.status === 'loading' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-500'
              }`}>
                {result.status === 'idle' ? 'Pendente' :
                 result.status === 'loading' ? 'Executando' :
                 result.status === 'success' ? 'Sucesso' : 'Erro'}
              </span>
            </header>

            {(result.status === 'success' || result.status === 'error') && (
              <div className="px-4 pb-4">
                {result.status === 'success' && result.data !== undefined && (
                  <pre className="bg-white p-3 rounded text-xs overflow-x-auto border border-gray-200 max-h-48 overflow-y-auto">
                    {JSON.stringify(result.data, null, 2) as React.ReactNode}
                  </pre>
                )}
                {result.status === 'error' && result.error && (
                  <p className="text-red-600 text-sm bg-red-100 p-3 rounded">
                    {result.error}
                  </p>
                )}
              </div>
            )}
          </article>
        ))}
      </section>
    </section>
  );
}
