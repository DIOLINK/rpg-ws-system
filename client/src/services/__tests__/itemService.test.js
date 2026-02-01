import { apiFetch } from '../../utils/apiFetch';
import { itemService } from '../itemService';

// Mock apiFetch
vi.mock('../../utils/apiFetch', () => ({
  apiFetch: vi.fn(),
}));

describe('itemService', () => {
  afterEach(() => {
    apiFetch.mockClear();
  });

  it('getAll retorna items', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ _id: 'i1', name: 'Espada' }],
    });
    const result = await itemService.getAll();
    expect(result[0].name).toBe('Espada');
  });

  it('getById retorna un item', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: 'i1', name: 'Espada' }),
    });
    const result = await itemService.getById('i1');
    expect(result.name).toBe('Espada');
  });

  it('create lanza error si la API responde mal', async () => {
    apiFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Error' }),
    });
    await expect(itemService.create({})).rejects.toThrow('Error');
  });
});
