import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Component that throws an error to trigger ErrorBoundary
const ProblematicComponent = () => {
  throw new Error('Test Error');
};

describe('ErrorBoundary Component', () => {
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Suppress console.error inside tests to prevent cluttering logs with the intentional test error
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  it('renderiza los hijos normalmente cuando no hay error', () => {
    render(
      <ErrorBoundary>
        <div>Contenido Seguro</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Contenido Seguro')).toBeInTheDocument();
  });

  it('captura el error y renderiza la interfaz de error cuando un hijo falla', () => {
    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Inconsistencia de Renderizado')).toBeInTheDocument();
    expect(screen.getByText(/El sistema ha detectado una inconsistencia crítica/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /recargar página/i })).toBeInTheDocument();
  });

  it('llama a window.location.reload al hacer clic en el botón de recargar', () => {
    // Mock location reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
      configurable: true,
    });

    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    const button = screen.getByRole('button', { name: /recargar página/i });
    fireEvent.click(button);

    expect(reloadMock).toHaveBeenCalled();
  });
});
