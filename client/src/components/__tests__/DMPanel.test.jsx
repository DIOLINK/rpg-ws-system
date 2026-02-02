import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DMPanel } from '../DMPanel';

describe('DMPanel', () => {
  const characters = [
    {
      _id: '1',
      name: 'Hero',
      validated: false,
      canEdit: false,
      playerName: 'Jugador1',
      description: 'desc1',
    },
    {
      _id: '2',
      name: 'Villain',
      validated: true,
      canEdit: true,
      playerName: 'Jugador2',
      description: 'desc2',
    },
  ];
  let onDMCommand;

  beforeEach(() => {
    onDMCommand = vi.fn();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renderiza personajes pendientes de validación y permite aprobar/rechazar', async () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    expect(screen.getByText('Hero')).toBeInTheDocument();
    const aprobarBtn = await screen.findByRole('button', { name: /aprobar/i });
    const rechazarBtn = await screen.findByRole('button', {
      name: /rechazar/i,
    });
    fireEvent.click(aprobarBtn);
    expect(onDMCommand).toHaveBeenCalledWith(
      'validate-character',
      expect.objectContaining({ characterId: '1', validated: true }),
    );
    fireEvent.click(rechazarBtn);
    expect(onDMCommand).toHaveBeenCalledWith(
      'validate-character',
      expect.objectContaining({ characterId: '1', validated: false }),
    );
  });

  it('permite seleccionar personajes y aplicar daño', async () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    // Abrir el panel del personaje
    fireEvent.click(await screen.findByText(/🧑 Hero/));
    // Seleccionar el checkbox
    const checkbox = await screen.findAllByRole('checkbox');
    fireEvent.click(checkbox[0]);
    // Ingresar daño en el input de daño masivo (placeholder exacto: "Daño")
    const input = await screen.findByPlaceholderText('Daño');
    fireEvent.change(input, { target: { value: '10' } });
    // Aplicar daño
    const btn = await screen.findByRole('button', { name: /aplicar 10 daño/i });
    fireEvent.click(btn);
    expect(onDMCommand).toHaveBeenCalledWith(
      'apply-damage',
      expect.objectContaining({ targets: ['1'], damage: 10 }),
    );
  });

  it('permite alternar editable/bloqueado', async () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    fireEvent.click(await screen.findByText(/🧑 Villain/));
    const toggleBtn = await screen.findByRole('button', {
      name: /editable|bloqueado/i,
    });
    fireEvent.click(toggleBtn);
    expect(onDMCommand).toHaveBeenCalledWith(
      'toggle-edit',
      expect.objectContaining({ characterId: '2', canEdit: false }),
    );
  });

  it('permite agregar habilidad', async () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    fireEvent.click(await screen.findByText(/🧑 Hero/));
    fireEvent.change(await screen.findByPlaceholderText(/nombre habilidad/i), {
      target: { value: 'Fuego' },
    });
    fireEvent.change(await screen.findByPlaceholderText(/descripción/i), {
      target: { value: 'Quema' },
    });
    fireEvent.change(
      await screen.findByPlaceholderText(/daño \(ej: 1d6\+2\)/i),
      {
        target: { value: '1d6' },
      },
    );
    fireEvent.change(await screen.findByPlaceholderText(/mana/i), {
      target: { value: '5' },
    });
    fireEvent.click(await screen.findByRole('button', { name: /habilidad/i }));
    await waitFor(() => {
      expect(onDMCommand).toHaveBeenCalledWith(
        'add-ability',
        expect.objectContaining({
          characterId: '1',
          ability: expect.objectContaining({
            name: 'Fuego',
            description: 'Quema',
            damage: '1d6',
            manaCost: 5,
          }),
        }),
      );
    });
  });

  it('permite agregar estado', async () => {
    render(<DMPanel characters={characters} onDMCommand={onDMCommand} />);
    fireEvent.click(await screen.findByText(/🧑 Hero/));
    fireEvent.change(await screen.findByPlaceholderText(/nombre estado/i), {
      target: { value: 'Buff' },
    });
    // Seleccionar tipo de estado (opcional, por defecto neutral)
    fireEvent.change(await screen.findByRole('combobox'), {
      target: { value: 'buff' },
    });
    fireEvent.change(
      await screen.findByPlaceholderText(/duración \(turnos\)/i),
      {
        target: { value: '3' },
      },
    );
    fireEvent.click(await screen.findByRole('button', { name: /estado/i }));
    await waitFor(() => {
      expect(onDMCommand).toHaveBeenCalledWith(
        'add-status',
        expect.objectContaining({
          characterId: '1',
          status: expect.objectContaining({ name: 'Buff', duration: 3 }),
        }),
      );
    });
  });
});
