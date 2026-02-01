import { renderHook } from '@testing-library/react';
import { useGameSocket } from '../useGameSocket';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock context y servicios
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: { _id: 'u1' }, isDM: false }),
}));
vi.mock('../../context/toastStore', () => () => ({ addToast: vi.fn() }));
vi.mock('../../context/toastStore', () => ({
  default: () => ({ addToast: vi.fn() }),
}));
vi.mock('../../utils/authService', () => ({
  authService: { getToken: () => 'mock-token' },
}));

describe('useGameSocket', () => {
  it('debe exponer estados principales', () => {
    const { result } = renderHook(() => useGameSocket('game1'));
    expect(typeof result.current.connected).toBe('boolean');
    expect(Array.isArray(result.current.characters)).toBe(true);
    expect(
      result.current.game === null || typeof result.current.game === 'object',
    ).toBe(true);
  });

  it('no conecta si no hay gameId', () => {
    const { result } = renderHook(() => useGameSocket(undefined));
    expect(result.current.connected).toBe(false);
  });
});
