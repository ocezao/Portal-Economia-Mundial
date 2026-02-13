import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
  it('deve combinar classes simples', () => {
    const result = cn('class1', 'class2');
    expect(result).toBe('class1 class2');
  });

  it('deve ignorar valores falsy', () => {
    const result = cn('class1', false && 'class2', null, undefined, 'class3');
    expect(result).toBe('class1 class3');
  });

  it('deve lidar com objetos condicionais', () => {
    const result = cn('base', {
      'active': true,
      'disabled': false,
    });
    expect(result).toContain('base');
    expect(result).toContain('active');
    expect(result).not.toContain('disabled');
  });

  it('deve mesclar classes do Tailwind corretamente', () => {
    // Quando há conflito, tailwind-merge resolve
    const result = cn('px-2 py-1', 'px-4');
    expect(result).toContain('px-4');
    expect(result).toContain('py-1');
  });

  it('deve retornar string vazia quando não há classes', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('deve lidar com arrays de classes', () => {
    const result = cn(['class1', 'class2'], 'class3');
    expect(result).toContain('class1');
    expect(result).toContain('class2');
    expect(result).toContain('class3');
  });

  it('deve lidar com classes vazias', () => {
    const result = cn('class1', '', 'class2');
    expect(result).toBe('class1 class2');
  });
});
