import { characterService } from '../characterService';

// Mock global fetch
global.fetch = vi.fn();

describe('characterService', () => {
  afterEach(() => {
    fetch.mockClear();
  });

  it('getAll llama a la API y retorna datos', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{ _id: '1', name: 'Hero' }],
    });
    const result = await characterService.getAll('token');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/characters'),
      expect.any(Object),
    );
    expect(result[0].name).toBe('Hero');
  });

  it('create lanza error si la API responde mal', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Error' }),
    });
    await expect(characterService.create({}, 'token')).rejects.toThrow('Error');
  });

  it('update retorna datos si la API responde bien', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ _id: '1', name: 'Editado' }),
    });
    const result = await characterService.update(
      '1',
      { name: 'Editado' },
      'token',
    );
    expect(result.name).toBe('Editado');
  });

  it('remove lanza error si la API responde mal', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'No se pudo' }),
    });
    await expect(characterService.remove('1', 'token')).rejects.toThrow(
      'No se pudo',
    );
  });
});
