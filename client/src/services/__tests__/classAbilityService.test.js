import { classAbilityService } from '../classAbilityService';

describe('classAbilityService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('devuelve habilidades por clase (éxito)', async () => {
    const mockData = [{ id: 1, name: 'Habilidad' }];
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });
    const result = await classAbilityService.getByClassType('Guerrero');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('classType=Guerrero'),
    );
    expect(result).toEqual(mockData);
  });

  it('lanza error si la respuesta no es ok', async () => {
    fetch.mockResolvedValueOnce({ ok: false });
    await expect(classAbilityService.getByClassType('Mago')).rejects.toThrow(
      'Error al obtener habilidades de clase',
    );
  });
});
