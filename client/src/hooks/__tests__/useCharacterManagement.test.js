import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import * as AuthContext from '../../context/AuthContext';
import * as toastStore from '../../context/toastStore';
// No importar los objetos, se mockean abajo
import { useCharacterManagement } from '../useCharacterManagement';

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({ on: vi.fn(), emit: vi.fn(), disconnect: vi.fn() })),
}));
vi.mock('../../services/characterService', () => ({
  characterService: { getAll: vi.fn().mockResolvedValue([]) },
}));
vi.mock('../../utils/authService', () => ({
  authService: { getToken: () => 'token' },
}));

describe('useCharacterManagement', () => {
  beforeEach(() => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
      user: { name: 'Test', _id: '1' },
    });
    vi.spyOn(toastStore, 'default').mockReturnValue(() => ({
      addToast: vi.fn(),
    }));
    // characterService y authService ya están mockeados arriba
  });

  it('inicializa correctamente', async () => {
    const { result } = renderHook(() => useCharacterManagement());
    expect(result.current.characters).toBeDefined();
    expect(result.current.loading).toBe(true);
  });
});
