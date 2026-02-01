import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useTurnOrderSocket } from '../useTurnOrderSocket';

const mockSocket = { on: vi.fn(), emit: vi.fn(), off: vi.fn() };

describe('useTurnOrderSocket', () => {
  it('inicializa correctamente', () => {
    const getSocket = () => mockSocket;
    const emit = vi.fn();
    const { result } = renderHook(() =>
      useTurnOrderSocket('game1', getSocket, emit),
    );
    expect(result.current.turnOrder).toBeDefined();
    expect(result.current.combatStarted).toBe(false);
  });
});
