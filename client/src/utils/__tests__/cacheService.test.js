import { cacheService } from '../cacheService';

describe('cacheService', () => {
  afterEach(() => {
    cacheService.invalidate();
  });

  it('almacena y recupera datos correctamente', () => {
    cacheService.set('key', { foo: 'bar' }, 1000);
    expect(cacheService.get('key')).toEqual({ foo: 'bar' });
  });

  it('elimina datos expirados', () => {
    cacheService.set('key', { foo: 'bar' }, -1); // TTL negativo
    expect(cacheService.get('key')).toBeNull();
  });

  it('invalida una clave específica', () => {
    cacheService.set('key', 123, 1000);
    cacheService.invalidate('key');
    expect(cacheService.get('key')).toBeNull();
  });

  it('invalida todo el caché', () => {
    cacheService.set('a', 1, 1000);
    cacheService.set('b', 2, 1000);
    cacheService.invalidate();
    expect(cacheService.get('a')).toBeNull();
    expect(cacheService.get('b')).toBeNull();
  });
});
