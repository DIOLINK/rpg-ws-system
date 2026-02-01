import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useGameLobby } from '../useGameLobby';

vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() })),
}));
vi.mock('../../utils/authService', () => ({
  authService: { getToken: () => 'token' },
}));

describe('useGameLobby', () => {
  it('inicializa correctamente', () => {
    const { result } = renderHook(() =>
      useGameLobby({ _id: '1', name: 'Test' }),
    );
    expect(result.current.games).toBeDefined();
    expect(result.current.loading).toBe(true);
  });
});
