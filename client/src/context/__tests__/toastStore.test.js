import useToastStore from '../toastStore';

describe('toastStore', () => {
  beforeEach(() => {
    // Reset Zustand state
    const { toasts, removeToast } = useToastStore.getState();
    toasts.forEach((t) => removeToast(t.id));
  });

  it('agrega un toast correctamente', () => {
    const { addToast, toasts } = useToastStore.getState();
    addToast({ type: 'success', message: 'Hola' });
    expect(useToastStore.getState().toasts.length).toBe(1);
    expect(useToastStore.getState().toasts[0].message).toBe('Hola');
  });

  it('elimina un toast por id', () => {
    const { addToast, removeToast } = useToastStore.getState();
    addToast({ type: 'info', message: 'Test' });
    const id = useToastStore.getState().toasts[0].id;
    removeToast(id);
    expect(useToastStore.getState().toasts.length).toBe(0);
  });
});
