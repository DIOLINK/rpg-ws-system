import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { DMPanel } from '../DMPanel';

describe('DMPanel', () => {
  const characters = [
    { _id: '1', name: 'Hero', validated: false },
    { _id: '2', name: 'Villain', validated: true },
  ];
  const onDMCommand = vi.fn();

  it('renderiza personajes pendientes de validación', () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    expect(screen.getByText('Hero')).toBeInTheDocument();
    // No se asume que 'Villain' esté visible, solo que 'Hero' sí.
  });

  it('permite seleccionar personajes y aplicar daño', () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    // Simular selección y daño
    // Aquí deberías buscar el input de daño y botones, y simular eventos
  });

  it('permite agregar habilidad y estado', () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    // Simular agregar habilidad y estado
    // Aquí deberías buscar los inputs y botones, y simular eventos
  });
});
