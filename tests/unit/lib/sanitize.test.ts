import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DOMPurify
vi.mock('dompurify', () => ({
  default: {
    sanitize: vi.fn((html: string, options?: Record<string, unknown>) => {
      // Simular comportamento básico de sanitização
      const allowed = (options as { ALLOWED_TAGS?: unknown })?.ALLOWED_TAGS;

      if (Array.isArray(allowed)) {
        if (allowed.length === 0) {
          // Modo strict - remove todas as tags
          return html.replace(/<[^>]*>/g, '');
        }

        const allowedSet = new Set(allowed.map((t) => String(t).toLowerCase()));

        return html.replace(/<\/?([a-z0-9-]+)(\s[^>]*)?>/gi, (m, tag: string) => {
          const t = tag.toLowerCase();
          if (!allowedSet.has(t)) return '';
          return m.replace(/\son\w+=(\"|').*?\1/gi, '');
        });
      }

      // Modo normal - remove scripts
      return html.replace(/<script[^>]*>.*?<\/script>/gi, '');
    }),
  },
}));

// Import after mocking
import { sanitizeHtml, sanitizeHtmlStrict, isHtmlSafe } from '@/lib/sanitize';

describe('sanitizeHtml', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    // Mock window object for browser environment
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('<p>');
  });

  it('should keep allowed tags', () => {
    const input = '<p><strong>Bold</strong> text</p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<strong>');
  });

  it('should handle empty input', () => {
    expect(sanitizeHtml('')).toBe('');
  });

  it('should return original HTML when window is undefined (SSR)', () => {
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });
    const input = '<p>Test</p>';
    const result = sanitizeHtml(input);
    expect(result).toBe(input);
  });

  it('should handle complex HTML with multiple tags', () => {
    const input = '<p>Paragraph</p><ul><li>Item 1</li><script>alert("xss")</script></ul>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<p>');
    expect(result).not.toContain('<script>');
  });
});

describe('sanitizeHtmlStrict', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });
  });

  it('should only allow basic formatting tags', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em><script>alert("xss")</script></p>';
    const result = sanitizeHtmlStrict(input);
    expect(result).not.toContain('<script>');
  });

  it('should remove images and links', () => {
    const input = '<p>Just text</p><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a>';
    const result = sanitizeHtmlStrict(input);
    expect(result).not.toContain('<img');
    expect(result).not.toContain('<a');
  });

  it('should return original HTML when window is undefined (SSR)', () => {
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });
    const input = '<p>Test</p>';
    const result = sanitizeHtmlStrict(input);
    expect(result).toBe(input);
  });
});

describe('isHtmlSafe', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    Object.defineProperty(global, 'window', {
      value: {},
      writable: true,
    });
  });

  it('should return true for safe plain text', () => {
    expect(isHtmlSafe('Plain text')).toBe(true);
  });

  it('should return false for HTML with scripts', () => {
    const input = '<script>alert("xss")</script>';
    const result = isHtmlSafe(input);
    expect(result).toBe(false);
  });

  it('should return true when window is undefined (SSR)', () => {
    Object.defineProperty(global, 'window', {
      value: undefined,
      writable: true,
    });
    expect(isHtmlSafe('<script>test</script>')).toBe(true);
  });

  it('should detect malicious attributes', () => {
    const input = '<p onclick="alert(1)">test</p>';
    const result = isHtmlSafe(input);
    expect(result).toBe(false);
  });
});
