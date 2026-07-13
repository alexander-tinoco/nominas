import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RightBookPage } from '../components/RightBookPage';
import { useEmpleados, useNominaList } from '../api/client';
import { useStore } from '../store/useStore';

// Mockear los hooks de React Query
vi.mock('../api/client', () => ({
  useEmpleados: vi.fn(),
  useNominaList: vi.fn(),
}));

// Mockear el store de Zustand
vi.mock('../store/useStore', () => ({
  useStore: vi.fn(),
}));

describe('RightBookPage Component', () => {
  const mockSetSelectedRfc = vi.fn();
  const mockSetSelectedQna = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configurar retorno por defecto del store
    (useStore as any).mockReturnValue({
      selectedQna: 201806,
      setSelectedRfc: mockSetSelectedRfc,
      setSelectedQna: mockSetSelectedQna,
    });

    // Configurar retornos por defecto de las queries
    (useEmpleados as any).mockReturnValue({
      data: {
        data: [
          { rfc: 'LOAA880101ABC', nom_emp: 'Ana López' },
          { rfc: 'MGRB900202DEF', nom_emp: 'Bernardo Mora' },
        ],
        pagination: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
      isError: false,
    });

    (useNominaList as any).mockReturnValue({
      data: {
        data: [],
        summary: { total: 0, totalPercepciones: 0, totalDeducciones: 0, totalNeto: 0 },
        pagination: { total: 0, page: 1, limit: 8, totalPages: 0 },
      },
      isLoading: false,
      isError: false,
    });
  });

  it('renderiza correctamente el tab de Personal (búsqueda simple) por defecto', () => {
    render(<RightBookPage />);

    // Título principal
    expect(screen.getByText('Búsqueda de Cuentas')).toBeInTheDocument();

    // Input de búsqueda simple
    expect(screen.getByPlaceholderText('Buscar por RFC o Nombre...')).toBeInTheDocument();

    // Los empleados en la tabla
    expect(screen.getByText('Ana López')).toBeInTheDocument();
    expect(screen.getByText('LOAA880101ABC')).toBeInTheDocument();
    expect(screen.getByText('Bernardo Mora')).toBeInTheDocument();
  });

  it('cambia al tab de Filtros Avanzados y lo renderiza correctamente al hacer clic', () => {
    render(<RightBookPage />);

    // Hacer click en el selector de Filtros Avanzados
    const advancedTabButton = screen.getByRole('tab', { name: /filtros avanzados/i });
    fireEvent.click(advancedTabButton);

    // Debe mostrar campos de búsqueda avanzada
    expect(screen.getByText('DATOS PERSONALES Y EDAD')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Ej. GILBERTO')).toBeInTheDocument(); // Nombre o RFC
    expect(screen.getByPlaceholderText('Ej. 10')).toBeInTheDocument(); // Entidad Fed

    // Debe mostrar la sección de botones de filtrar/limpiar
    expect(screen.getByRole('button', { name: /limpiar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filtrar/i })).toBeInTheDocument();
  });

  it('dispara setSelectedRfc al hacer clic en una fila de la tabla simple', () => {
    render(<RightBookPage />);

    const row = screen.getByText('Ana López');
    fireEvent.click(row);

    expect(mockSetSelectedRfc).toHaveBeenCalledWith('LOAA880101ABC');
  });
});
