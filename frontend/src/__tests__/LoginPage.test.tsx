import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginPage } from '../components/LoginPage';
import { useAuthStore } from '../store/useAuthStore';

vi.mock('../store/useAuthStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('LoginPage Component', () => {
  const mockLogin = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuthStore as any).mockReturnValue({
      login: mockLogin,
      status: 'unauthenticated',
      error: null,
    });
  });

  it('renderiza los campos de email y contraseña', () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument();
  });

  it('llama a login con el email y contraseña ingresados al enviar el formulario', async () => {
    mockLogin.mockResolvedValue(undefined);
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'admin@nominas.local' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'Practica2026Admin!' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@nominas.local', 'Practica2026Admin!');
    });
  });

  it('muestra un mensaje de error cuando las credenciales son inválidas', async () => {
    mockLogin.mockRejectedValue(new Error('Credenciales inválidas'));
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText(/correo electrónico/i), { target: { value: 'admin@nominas.local' } });
    fireEvent.change(screen.getByLabelText(/contraseña/i), { target: { value: 'incorrecta' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Credenciales inválidas');
  });

  it('muestra el estado de carga mientras se verifica la sesión', () => {
    (useAuthStore as any).mockReturnValue({
      login: mockLogin,
      status: 'loading',
      error: null,
    });
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: /verificando/i })).toBeDisabled();
  });
});
