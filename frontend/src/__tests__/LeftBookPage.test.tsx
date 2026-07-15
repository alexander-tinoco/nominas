import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeftBookPage } from '../components/LeftBookPage';
import { useReportePorUnidad, useReporteConceptos } from '../api/client';
import { useStore } from '../store/useStore';

// Mock React Query hooks
vi.mock('../api/client', () => ({
  useReportePorUnidad: vi.fn(),
  useReporteConceptos: vi.fn(),
}));

// Mock Zustand store
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

// Mock GraficaBalances to avoid Recharts rendering issues in JSDOM
vi.mock('../components/nomina/GraficaBalances', () => ({
  GraficaBalances: () => <div data-testid="grafica-balances">GraficaBalances Mocked</div>,
}));

describe('LeftBookPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default store return
    (useStore as any).mockReturnValue({
      selectedQna: 201806,
    });
  });

  it('muestra estado de carga cuando se están consultando los reportes', () => {
    (useReportePorUnidad as any).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });
    (useReporteConceptos as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<LeftBookPage />);

    expect(screen.getByText('Consultando registros contables...')).toBeInTheDocument();
  });

  it('muestra un mensaje de error si falla la consulta de unidades', () => {
    (useReportePorUnidad as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });
    (useReporteConceptos as any).mockReturnValue({
      data: null,
      isLoading: false,
      isError: false,
    });

    render(<LeftBookPage />);

    expect(screen.getByText('Error de Lectura')).toBeInTheDocument();
    expect(screen.getByText(/No se pudo establecer conexión/)).toBeInTheDocument();
  });

  it('muestra un panel de "Sin Asientos Contables" si no hay datos', () => {
    (useReportePorUnidad as any).mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    });
    (useReporteConceptos as any).mockReturnValue({
      data: { data: [] },
      isLoading: false,
      isError: false,
    });

    render(<LeftBookPage />);

    expect(screen.getByText('Sin Asientos Contables')).toBeInTheDocument();
    expect(screen.getByText(/No existen registros de pago/)).toBeInTheDocument();
  });

  it('renderiza la gráfica de balances cuando se obtienen datos correctamente', async () => {
    (useReportePorUnidad as any).mockReturnValue({
      data: {
        data: [
          { etiqueta: 'U1', unidad: '1', total_neto: 1000 },
        ],
      },
      isLoading: false,
      isError: false,
    });
    (useReporteConceptos as any).mockReturnValue({
      data: {
        data: [
          { etiqueta: 'C1', concepto: '001', total_importe: 500 },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<LeftBookPage />);

    // Renders header
    expect(screen.getByText('Resumen y Balances')).toBeInTheDocument();

    // Since GraficaBalances is lazy-loaded, we wait for it to be rendered from Suspense
    await waitFor(() => {
      expect(screen.getByTestId('grafica-balances')).toBeInTheDocument();
    });
  });
});
