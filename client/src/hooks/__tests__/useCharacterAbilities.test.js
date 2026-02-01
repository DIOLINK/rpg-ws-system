import { renderHook, waitFor } from '@testing-library/react';
import { useCharacterAbilities } from '../useCharacterAbilities';

// Mock classAbilityService
vi.mock('../../services/classAbilityService', () => ({
  classAbilityService: {
    getByClassType: vi.fn(() =>
      Promise.resolve([{ id: 1, name: 'Habilidad' }]),
    ),
  },
}));

describe('useCharacterAbilities', () => {
  it('retorna habilidades del personaje si existen', () => {
    const char = { abilities: [{ id: 1, name: 'A' }], classType: 'Guerrero' };
    const { result } = renderHook(() => useCharacterAbilities(char));
    expect(result.current.abilities).toEqual(char.abilities);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('carga habilidades de la clase si no hay propias', async () => {
    const char = { abilities: [], classType: 'Mago' };
    const { result } = renderHook(() => useCharacterAbilities(char));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.abilities).toEqual([{ id: 1, name: 'Habilidad' }]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('retorna vacío si no hay classType', () => {
    const char = { abilities: [], classType: undefined };
    const { result } = renderHook(() => useCharacterAbilities(char));
    expect(result.current.abilities).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});
