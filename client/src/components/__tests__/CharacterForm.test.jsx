import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import CharacterForm from '../CharacterForm';

describe('CharacterForm', () => {
  const baseCharacter = {
    name: 'Test Hero',
    description: 'Un personaje de prueba',
    classType: 'guerrero',
  };
  const onChange = vi.fn();
  const onSave = vi.fn();
  const onCancel = vi.fn();

  it('renderiza los campos correctamente', () => {
    render(
      <CharacterForm
        character={baseCharacter}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
        isEditing={false}
        disabled={false}
      />,
    );
    expect(screen.getByLabelText(/nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/descripción/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/clase/i)).toBeInTheDocument();
    expect(screen.getByText(/crear personaje/i)).toBeInTheDocument();
    expect(screen.getByText(/cancelar/i)).toBeInTheDocument();
  });

  it('llama a onChange al modificar campos', () => {
    render(
      <CharacterForm
        character={baseCharacter}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
        isEditing={false}
        disabled={false}
      />,
    );
    fireEvent.change(screen.getByLabelText(/nombre/i), {
      target: { value: 'Nuevo Nombre' },
    });
    expect(onChange).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/descripción/i), {
      target: { value: 'Nueva desc' },
    });
    expect(onChange).toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/clase/i), {
      target: { value: 'mago' },
    });
    expect(onChange).toHaveBeenCalled();
  });

  it('llama a onSave al enviar el formulario', () => {
    render(
      <CharacterForm
        character={baseCharacter}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
        isEditing={false}
        disabled={false}
      />,
    );
    fireEvent.click(screen.getByText(/crear personaje/i));
    expect(onSave).toHaveBeenCalled();
  });

  it('llama a onCancel al hacer click en cancelar', () => {
    render(
      <CharacterForm
        character={baseCharacter}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
        isEditing={false}
        disabled={false}
      />,
    );
    fireEvent.click(screen.getByText(/cancelar/i));
    expect(onCancel).toHaveBeenCalled();
  });
});
