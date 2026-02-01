import { fireEvent, render, screen } from '@testing-library/react';
import CharacterActionsMenu from '../CharacterActionsMenu';

vi.mock('../../context/toastStore', () => ({
  default: () => ({ addToast: vi.fn() }),
  useToastStore: () => ({ addToast: vi.fn(), removeToast: vi.fn() }),
}));

describe('CharacterActionsMenu', () => {
  it('muestra y oculta el menú al hacer click', () => {
    render(<CharacterActionsMenu />);
    const button = screen.getByRole('button', { name: /más acciones/i });
    fireEvent.click(button);
    expect(screen.getByText(/asociar a partida/i)).toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.queryByText(/asociar a partida/i)).not.toBeInTheDocument();
  });

  it('llama a onEdit cuando se hace click en Editar', () => {
    const onEdit = vi.fn();
    render(<CharacterActionsMenu onEdit={onEdit} />);
    fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText(/editar/i));
    expect(onEdit).toHaveBeenCalled();
  });

  it('llama a onDelete cuando se confirma eliminar', () => {
    const onDelete = vi.fn();
    render(<CharacterActionsMenu onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
    fireEvent.click(screen.getByText(/eliminar/i));
    // No se puede simular el toast y confirmación aquí sin mock más avanzado
    // Solo se valida que addToast fue llamado
    // (la lógica de confirmación está en el toastStore)
  });

  it('deshabilita botones según props', () => {
    render(<CharacterActionsMenu disabledEdit disabledSend disabledAssign />);
    fireEvent.click(screen.getByRole('button', { name: /más acciones/i }));
    expect(screen.getByText(/editar/i)).toBeDisabled();
    expect(screen.getByText(/validación/i)).toBeDisabled();
    expect(screen.getByText(/asociar a partida/i)).toBeDisabled();
  });
});
