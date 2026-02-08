/**
 * Registro do Service Worker para PWA
 * Carrega o SW apenas em produção e quando suportado
 */

'use client';

import { useEffect, useState } from 'react';

export function ServiceWorkerRegistration() {
  const [isSupported] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'serviceWorker' in navigator;
  });

  useEffect(() => {
    // Verificar suporte a Service Workers
    if (!isSupported) {
      return;
    }

    // Registrar apenas em produção
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.log('[PWA] Service Worker registration skipped in development');
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        // eslint-disable-next-line no-console
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Monitorar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              // eslint-disable-next-line no-console
              console.log('[PWA] New version available');
              
              // Poderia mostrar um toast aqui para atualizar
              if (confirm('Nova versão disponível. Deseja atualizar?')) {
                newWorker.postMessage('skipWaiting');
                window.location.reload();
              }
            }
          });
        });

        // Listen for messages from SW
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data === 'reload') {
            window.location.reload();
          }
        });

      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Aguardar carregamento completo da página
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
    }

    return () => {
      window.removeEventListener('load', registerSW);
    };
  }, []);

  // Este componente não renderiza nada visual
  return null;
}

/**
 * Hook para verificar status do Service Worker
 */
export function useServiceWorker() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar se SW está instalado
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsInstalled(true);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isInstalled, isOnline };
}

/**
 * Componente de indicador de status offline/online
 */
export function NetworkStatus() {
  const { isOnline } = useServiceWorker();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowIndicator(true);
    } else {
      // Esconder indicador após 3 segundos quando voltar online
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!showIndicator) return null;

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium shadow-lg z-50 transition-colors ${
        isOnline 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white'
      }`}
      role="status"
      aria-live="polite"
    >
      {isOnline ? '📶 Conexão restaurada' : '📴 Você está offline'}
    </div>
  );
}

/**
 * Hook para instalação do PWA
 */
export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Verificar se já está instalado
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (installPrompt as any).prompt();
    
    if (result.outcome === 'accepted') {
      setIsInstalled(true);
    }
    
    setInstallPrompt(null);
    setIsInstallable(false);
  };

  return { isInstallable, isInstalled, install };
}
