import { apiFetch } from '../apiFetch';

// Mocks
vi.mock('../authService', () => ({ authService: { getToken: () => 'token' } }));
vi.mock('../cacheService', () => ({
  cacheService: {
    getCacheKey: (url) => url,
    get: vi.fn(),
    set: vi.fn(),
  },
}));

global.fetch = vi.fn();

describe('apiFetch', () => {
  afterEach(() => {
    fetch.mockClear();
  });

  it('devuelve respuesta de caché si existe', async () => {
    const { cacheService } = await import('../cacheService');
    cacheService.get.mockReturnValue({ foo: 'bar' });
    const res = await apiFetch('/api/test', {}, undefined, { useCache: true });
    const data = await res.json();
    expect(data.foo).toBe('bar');
  });

  it('hace fetch si no hay caché', async () => {
    const { cacheService } = await import('../cacheService');
    cacheService.get.mockReturnValue(undefined);
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    const res = await apiFetch('/api/test', {}, undefined, { useCache: true });
    expect(fetch).toHaveBeenCalled();
    expect(res.status).toBe(200);
  });
});
