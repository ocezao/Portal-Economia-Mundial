/**
 * Hook para Intersection Observer
 * Permite detectar quando elementos entram na viewport
 * Útil para lazy loading de componentes e analytics
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const { threshold = 0.1, rootMargin = '0px', triggerOnce = true } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<T>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Se já disparou uma vez e triggerOnce é true, não observar novamente
    if (triggerOnce && hasTriggered) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const intersecting = entry.isIntersecting;
        setIsIntersecting(intersecting);
        
        if (intersecting && triggerOnce) {
          setHasTriggered(true);
          observer.unobserve(element);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref: elementRef, isIntersecting, hasTriggered };
}

/**
 * Hook para carregar componentes apenas quando visíveis
 */
export function useLazyLoad<T extends HTMLElement = HTMLDivElement>(
  options: UseIntersectionObserverOptions = {}
) {
  const { isIntersecting, ref } = useIntersectionObserver<T>({
    ...options,
    triggerOnce: true,
  });

  return { ref, isVisible: isIntersecting };
}

/**
 * Hook para analytics - dispara eventos apenas quando elemento é visto
 */
export function useAnalyticsView<T extends HTMLElement = HTMLDivElement>(
  eventName: string,
  eventData?: Record<string, unknown>
) {
  const { ref, isIntersecting } = useIntersectionObserver<T>({
    threshold: 0.5,
    triggerOnce: true,
  });

  useEffect(() => {
    if (isIntersecting) {
      // Disparar evento de analytics
      const w = window as Window & { gtag?: (...args: unknown[]) => void };
      if (typeof window !== 'undefined' && w.gtag) {
        w.gtag('event', eventName, {
          ...eventData,
          event_category: 'engagement',
          event_label: 'view',
        });
      }
      
      // Console em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[Analytics] ${eventName}`, eventData);
      }
    }
  }, [isIntersecting, eventName, eventData]);

  return ref;
}

/**
 * Hook para infinite scroll
 */
export function useInfiniteScroll(
  onLoadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({
    threshold: 0,
    rootMargin: '200px', // Load before reaching bottom
    triggerOnce: false,
  });

  useEffect(() => {
    if (isIntersecting && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [isIntersecting, hasMore, isLoading, onLoadMore]);

  return { loaderRef: ref, isLoadingMore: isIntersecting && isLoading };
}

/**
 * Componente wrapper para lazy load
 */
interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  rootMargin?: string;
  threshold?: number;
}

export function LazyLoad({ 
  children, 
  fallback = null,
  rootMargin = '100px',
  threshold = 0.1,
}: LazyLoadProps) {
  const { ref, isVisible } = useLazyLoad<HTMLDivElement>({
    rootMargin,
    threshold,
  });

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  );
}

/**
 * Hook para lazy loading de imagens
 * Carrega imagens apenas quando próximas da viewport
 */
export function useLazyImage(src: string) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const { ref, isVisible } = useLazyLoad<HTMLImageElement>({
    rootMargin: '200px',
  });

  useEffect(() => {
    if (isVisible && !imageSrc) {
      setImageSrc(src);
    }
  }, [isVisible, src, imageSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  return { ref, imageSrc: imageSrc || undefined, isLoaded, handleLoad };
}
