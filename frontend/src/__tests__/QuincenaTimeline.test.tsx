import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QuincenaTimeline } from '../components/QuincenaTimeline';
import { useStore } from '../store/useStore';

// Mockear useStore
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('QuincenaTimeline Component', () => {
  const mockSetSelectedQna = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useStore as any).mockReturnValue({
      selectedQna: 201806,
      setSelectedQna: mockSetSelectedQna,
    });
  });

  it('muestra la quincena seleccionada con estilos correctos', () => {
    const quincenas = [201805, 201806];
    render(<QuincenaTimeline quincenas={quincenas} />);

    // Verificar que se renderizan ambas quincenas
    const qna05Button = screen.getByRole('tab', { name: /Seleccionar quincena 05 del año 2018/i });
    const qna06Button = screen.getByRole('tab', { name: /Seleccionar quincena 06 del año 2018/i });

    expect(qna05Button).toBeInTheDocument();
    expect(qna06Button).toBeInTheDocument();

    // La quincena 201806 (seleccionada) debe tener la clase bg-accounting-green
    expect(qna06Button.className).toContain('bg-accounting-green');
    expect(qna05Button.className).not.toContain('bg-accounting-green');
  });

  it('llama a setSelectedQna al hacer clic en otra quincena', () => {
    const quincenas = [201805, 201806];
    render(<QuincenaTimeline quincenas={quincenas} />);

    const qna05Button = screen.getByRole('tab', { name: /Seleccionar quincena 05 del año 2018/i });
    fireEvent.click(qna05Button);

    expect(mockSetSelectedQna).toHaveBeenCalledWith(201805);
  });

  it('navega hacia la izquierda con la flecha izquierda del teclado', () => {
    const quincenas = [201804, 201805, 201806];
    render(<QuincenaTimeline quincenas={quincenas} />);

    // Presionar la flecha izquierda en la ventana global
    fireEvent.keyDown(window, { key: 'ArrowLeft' });

    // La quincena seleccionada inicialmente era 201806 (índice 2). Flecha izquierda debe cambiar al índice 1 (201805).
    expect(mockSetSelectedQna).toHaveBeenCalledWith(201805);
  });

  it('navega hacia la derecha con la flecha derecha del teclado', () => {
    const quincenas = [201804, 201805, 201806];
    // Configurar selectedQna en 201805 para poder ir a la derecha
    (useStore as any).mockReturnValue({
      selectedQna: 201805,
      setSelectedQna: mockSetSelectedQna,
    });

    render(<QuincenaTimeline quincenas={quincenas} />);

    // Presionar la flecha derecha en la ventana global
    fireEvent.keyDown(window, { key: 'ArrowRight' });

    // De 201805 a 201806
    expect(mockSetSelectedQna).toHaveBeenCalledWith(201806);
  });
});
