import { renderHook } from '@testing-library/react';
import { useCharacterSocket } from '../useCharacterSocket';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock authService
vi.mock('../../utils/authService', () => ({
  authService: { getToken: () => 'mock-token' },
}));

describe('useCharacterSocket', () => {
  it('debe inicializar con personajes iniciales', () => {
    const initial = [{ _id: '1', name: 'Hero' }];
    const { result } = renderHook(() => useCharacterSocket(initial));
    expect(result.current.characters).toEqual(initial);
  });

  it('debe actualizar personajes cuando initialCharacters cambia', () => {
    const initial = [{ _id: '1', name: 'Hero' }];
    const updated = [{ _id: '2', name: 'Villain' }];
    const { result, rerender } = renderHook(
      ({ chars }) => useCharacterSocket(chars),
      { initialProps: { chars: initial } },
    );
    expect(result.current.characters).toEqual(initial);
    rerender({ chars: updated });
    expect(result.current.characters).toEqual(updated);
  });

  it('debe exponer estado de conexión', () => {
    const { result } = renderHook(() => useCharacterSocket());
    expect(typeof result.current.connected).toBe('boolean');
  });
});
