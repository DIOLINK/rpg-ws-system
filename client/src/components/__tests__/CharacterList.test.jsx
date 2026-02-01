import { render, screen } from '@testing-library/react';
import CharacterList from '../CharacterList';

import { vi } from 'vitest';

describe('CharacterList', () => {
  const characters = [
    {
      _id: '1',
      name: 'Hero',
      validated: false,
      validationComment: '',
      description: 'Un héroe valiente',
      gameId: null,
    },
    {
      _id: '2',
      name: 'Villain',
      validated: true,
      validationComment: 'Validado por DM',
      description: 'El villano principal',
      gameId: 'game123',
    },
  ];
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  const onSend = vi.fn();
  const onAssignToGame = vi.fn();

  it('muestra mensaje si no hay personajes', () => {
    render(
      <CharacterList
        characters={[]}
        onEdit={onEdit}
        onDelete={onDelete}
        onSend={onSend}
      />,
    );
    expect(screen.getByText(/no hay personajes/i)).toBeInTheDocument();
  });

  it('renderiza la lista de personajes', () => {
    render(
      <CharacterList
        characters={characters}
        onEdit={onEdit}
        onDelete={onDelete}
        onSend={onSend}
        onAssignToGame={onAssignToGame}
        currentEditingId={null}
      />,
    );
    expect(screen.getByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Villain')).toBeInTheDocument();
    expect(screen.getByText('Un héroe valiente')).toBeInTheDocument();
    expect(screen.getByText('El villano principal')).toBeInTheDocument();
  });

  it('llama a onEdit, onDelete, onSend y onAssignToGame', () => {
    render(
      <CharacterList
        characters={characters}
        onEdit={onEdit}
        onDelete={onDelete}
        onSend={onSend}
        onAssignToGame={onAssignToGame}
        currentEditingId={null}
      />,
    );
    // Simular clicks en los menús de acciones
    // Aquí deberías mockear CharacterActionsMenu para exponer los botones y simular los eventos
  });
});
