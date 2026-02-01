import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock apiFetch
vi.mock('../../utils/apiFetch', () => ({
  apiFetch: vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ _id: 'u1', name: 'Test' }),
    }),
  ),
}));

// Mock localStorage
beforeAll(() => {
  vi.stubGlobal('localStorage', {
    getItem: vi.fn(() => 'token'),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
});

afterEach(() => {
  mockNavigate.mockClear();
});

function TestComponent() {
  const { user, loading } = useAuth();
  return (
    <div>
      <span data-testid="user">{user ? user.name : 'no-user'}</span>
      <span data-testid="loading">{loading ? 'loading' : 'done'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  it('renderiza y obtiene usuario', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('Test');
      expect(screen.getByTestId('loading').textContent).toBe('done');
    });
  });

  it('redirige a /lobby si hay usuario', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/lobby');
    });
  });
});
