import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Store original env
const originalEnv = process.env.NODE_ENV;

describe('logger - development', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    process.env.NODE_ENV = 'development';
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('should log in development environment', async () => {
    const { logger } = await import('@/lib/logger');
    
    logger.log('test message');
    expect(console.log).toHaveBeenCalledWith('test message');
  });

  it('should warn in development', async () => {
    const { logger } = await import('@/lib/logger');
    
    logger.warn('warning message');
    expect(console.warn).toHaveBeenCalledWith('warning message');
  });

  it('should log errors in development with full details', async () => {
    const { logger } = await import('@/lib/logger');
    
    const error = new Error('Test error');
    logger.error('error occurred', error);
    expect(console.error).toHaveBeenCalledWith('error occurred', error);
  });

  it('should debug in development', async () => {
    const { logger } = await import('@/lib/logger');
    
    logger.debug('debug message');
    expect(console.debug).toHaveBeenCalledWith('debug message');
  });

  it('should handle multiple arguments', async () => {
    const { logger } = await import('@/lib/logger');
    
    logger.log('arg1', 'arg2', 'arg3');
    expect(console.log).toHaveBeenCalledWith('arg1', 'arg2', 'arg3');
  });
});

describe('logger - production', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    process.env.NODE_ENV = 'production';
    
    // Mock console methods
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('should not log in production environment', async () => {
    const { logger } = await import('@/lib/logger');
    
    logger.log('test message');
    expect(console.log).not.toHaveBeenCalled();
  });

  it('should not warn in production', async () => {
    const { logger } = await import('@/lib/logger');
    
    logger.warn('warning message');
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('should log errors in production (sanitized)', async () => {
    const { logger } = await import('@/lib/logger');
    
    const error = new Error('Test error');
    logger.error('error occurred', error);
    
    // Error should be logged in production
    expect(console.error).toHaveBeenCalled();
  });

  it('should not debug in production', async () => {
    const { logger } = await import('@/lib/logger');
    
    logger.debug('debug message');
    expect(console.debug).not.toHaveBeenCalled();
  });
});

describe('logger behavior', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.resetAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle Error objects', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    
    const error = new Error('Test error');
    logger.error('error occurred', error);
    
    expect(console.error).toHaveBeenCalled();
    const callArgs = vi.mocked(console.error).mock.calls[0];
    expect(callArgs[0]).toBe('error occurred');
    expect(callArgs[1]).toBeInstanceOf(Error);
  });

  it('should handle plain objects', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    
    const obj = { key: 'value' };
    logger.error('error occurred', obj);
    
    expect(console.error).toHaveBeenCalledWith('error occurred', obj);
  });

  it('should handle null and undefined', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    
    logger.error('test', null, undefined);
    expect(console.error).toHaveBeenCalledWith('test', null, undefined);
  });

  it('should handle strings and numbers', async () => {
    process.env.NODE_ENV = 'development';
    const { logger } = await import('@/lib/logger');
    
    logger.error('test', 'string', 123, true);
    expect(console.error).toHaveBeenCalledWith('test', 'string', 123, true);
  });

  it('should have all required methods', async () => {
    const { logger } = await import('@/lib/logger');
    
    expect(typeof logger.log).toBe('function');
    expect(typeof logger.warn).toBe('function');
    expect(typeof logger.error).toBe('function');
    expect(typeof logger.debug).toBe('function');
  });

  it('should export default logger', async () => {
    const loggerModule = await import('@/lib/logger');
    expect(loggerModule.default).toBeDefined();
    expect(typeof loggerModule.default.log).toBe('function');
  });
});
