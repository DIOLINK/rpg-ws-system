import { gameService } from '../gameService';

describe('gameService', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('sale de la partida correctamente', async () => {
    const mockData = { success: true };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    });
    const result = await gameService.leaveGame('game1', 'token123');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/game/leave/game1'),
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(mockData);
  });

  it('lanza error si la respuesta no es ok', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Error custom' }),
    });
    await expect(gameService.leaveGame('game2', 'token123')).rejects.toThrow(
      'Error custom',
    );
  });
});
