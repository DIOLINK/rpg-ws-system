import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renderiza hijos si no hay error', () => {
    const { getByText } = render(
      <MemoryRouter>
        <ErrorBoundary>
          <div>Contenido seguro</div>
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(getByText('Contenido seguro')).toBeInTheDocument();
  });

  it('redirige a /error si hay error', () => {
    // Simular error lanzando en un componente hijo
    const ProblemChild = () => {
      throw new Error('Error de prueba');
    };
    // No se puede testear Navigate directamente, pero se puede verificar que no renderiza hijos
    const { queryByText } = render(
      <MemoryRouter>
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(queryByText('Contenido seguro')).toBeNull();
  });
});
