/**
 * Componente de Imagem Otimizado
 * Wrapper do next/image com configuracoes padrao para o projeto
 */

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  onLoad?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  sizes,
  className,
  containerClassName,
  objectFit = 'cover',
  onLoad,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const isExternal = src?.startsWith('http') || src?.startsWith('data:');
  const isStaticExport = process.env.NODE_ENV === 'production';

  if (isExternal || (isStaticExport && isExternal)) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            `object-${objectFit}`,
            className,
          )}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={() => {
            setIsLoading(false);
            setError(true);
          }}
        />
        {isLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          `object-${objectFit}`,
          className,
        )}
        onLoad={() => {
          setIsLoading(false);
          onLoad?.();
        }}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
      />
      {isLoading && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-400 text-sm">Imagem indisponivel</span>
        </div>
      )}
    </div>
  );
}

export function LazyImage(props: Omit<OptimizedImageProps, 'priority'>) {
  return <OptimizedImage {...props} priority={false} />;
}

export function PriorityImage(props: Omit<OptimizedImageProps, 'priority'>) {
  return <OptimizedImage {...props} priority />;
}

export function ThumbnailImage({
  src,
  alt,
  size = 80,
  className,
  containerClassName,
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  containerClassName?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      sizes="80px"
      className={className}
      containerClassName={containerClassName}
    />
  );
}

export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
}: {
  src?: string | null;
  alt: string;
  size?: number;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={cn(
          'bg-gray-200 rounded-full flex items-center justify-center',
          className,
        )}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-400 text-xs">{alt.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={cn('rounded-full', className)}
      containerClassName="rounded-full overflow-hidden"
    />
  );
}
