import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../NavBar';

// Mock del hook
vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('NavBar con hook mockeado', () => {
  test('renderiza con hook mockeado', () => {
    // Configurar el mock
    useAuth.mockReturnValue({
      user: { name: 'Mock User', isDM: false },
      isDM: false,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <MemoryRouter>
        <NavBar />
      </MemoryRouter>
    );

    // Verifica que el enlace Perfil está presente
    expect(screen.getByText('Perfil')).toBeInTheDocument();
  });
});
