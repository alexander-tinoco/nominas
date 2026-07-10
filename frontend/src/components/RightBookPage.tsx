import React, { useState, useEffect } from 'react';
import { useEmpleados, useNominaList } from '../api/client';
import { useStore } from '../store/useStore';
import { 
  Search, 
  User, 
  ChevronLeft, 
  ChevronRight, 
  Inbox, 
  Filter, 
  DollarSign, 
  Briefcase, 
  Home, 
  FileText, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';

export const RightBookPage: React.FC = () => {
  const { setSelectedRfc, setSelectedQna } = useStore();
  
  // Pestaña activa: 'simple' (Catálogo) o 'advanced' (Consulta Avanzada de Nóminas)
  const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');

  // ==========================================
  // ESTADO - BÚSQUEDA SIMPLE (CATÁLOGO)
  // ==========================================
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSimple, setPageSimple] = useState(1);
  const limitSimple = 10;

  // Resetear página simple al buscar
  useEffect(() => {
    setPageSimple(1);
  }, [searchQuery]);

  const { 
    data: dataSimple, 
    isLoading: isLoadingSimple, 
    isError: isErrorSimple 
  } = useEmpleados(searchQuery, pageSimple, limitSimple);

  const handleSimpleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  // ==========================================
  // ESTADO - BÚSQUEDA AVANZADA (NÓMINAS)
  // ==========================================
  const [pageAdvanced, setPageAdvanced] = useState(1);
  const limitAdvanced = 8; // Menor cantidad para dar espacio a los filtros colapsables

  // Secciones colapsables de filtros
  const [showPersonal, setShowPersonal] = useState(true);
  const [showCT, setShowCT] = useState(false);
  const [showConceptos, setShowConceptos] = useState(false);
  const [showImportes, setShowImportes] = useState(false);
  const [showPlaza, setShowPlaza] = useState(false);

  // Valores de los filtros
  const [advancedFilters, setAdvancedFilters] = useState({
    search: '',
    rfc: '',
    nom_emp: '',
    ent_fed: '',
    unidad: '',
    subunidad: '',
    cat_puesto: '',
    ct_clasif: '',
    ct_id: '',
    ct_secuencial: '',
    ct_digito_ver: '',
    ct_search: '',
    qna_pago: '',
    qna_pago_min: '',
    qna_pago_max: '',
    qna_ini: '',
    qna_fin: '',
    neto_min: '',
    neto_max: '',
    perc_min: '',
    perc_max: '',
    ded_min: '',
    ded_max: '',
    horas_min: '',
    horas_max: '',
    nivel_sueldo_min: '',
    nivel_sueldo_max: '',
    mot_mov: '',
    concepto: '',
    concepto_tipo: '',
    concepto_importe_min: '',
    concepto_importe_max: '',
    edad_min: '',
    edad_max: '',
  });

  // Filtros aplicados reales que disparan la query
  const [appliedFilters, setAppliedFilters] = useState<any>({});

  // Resetear página avanzada al cambiar filtros aplicados
  useEffect(() => {
    setPageAdvanced(1);
  }, [appliedFilters]);

  // Consulta de Nóminas
  const {
    data: dataAdvanced,
    isLoading: isLoadingAdvanced,
    isError: isErrorAdvanced,
  } = useNominaList({
    ...appliedFilters,
    page: pageAdvanced,
    limit: limitAdvanced
  });

  const handleAdvancedSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtrar campos vacíos antes de aplicar
    const cleanFilters = Object.fromEntries(
      Object.entries(advancedFilters).filter(([_, val]) => val !== '')
    );
    setAppliedFilters(cleanFilters);
  };

  const handleClearFilters = () => {
    const cleared = {
      search: '',
      rfc: '',
      nom_emp: '',
      ent_fed: '',
      unidad: '',
      subunidad: '',
      cat_puesto: '',
      ct_clasif: '',
      ct_id: '',
      ct_secuencial: '',
      ct_digito_ver: '',
      ct_search: '',
      qna_pago: '',
      qna_pago_min: '',
      qna_pago_max: '',
      qna_ini: '',
      qna_fin: '',
      neto_min: '',
      neto_max: '',
      perc_min: '',
      perc_max: '',
      ded_min: '',
      ded_max: '',
      horas_min: '',
      horas_max: '',
      nivel_sueldo_min: '',
      nivel_sueldo_max: '',
      mot_mov: '',
      concepto: '',
      concepto_tipo: '',
      concepto_importe_min: '',
      concepto_importe_max: '',
      edad_min: '',
      edad_max: '',
    };
    setAdvancedFilters(cleared);
    setAppliedFilters({});
  };

  // Manejar cambio en inputs de búsqueda avanzada
  const handleFilterChange = (key: string, value: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Click en una fila
  const handleRowClick = (rfc: string, qna?: number) => {
    if (qna) {
      setSelectedQna(qna);
    }
    setSelectedRfc(rfc);
  };

  const formatCurrency = (val: number | string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(Number(val));
  };

  return (
    <div className="flex flex-col gap-6 pl-2 flex-1">
      {/* Encabezado e Interruptor de Pestañas */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-accounting-indigo/20 pb-3 gap-2">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5 text-accounting-indigo" />
          <h3 className="font-serif text-xl font-bold text-accounting-indigo">Búsqueda de Cuentas</h3>
        </div>
        
        {/* Selector de Pestaña */}
        <div className="flex bg-accounting-paper/50 p-0.5 rounded-sm border border-accounting-indigo/15">
          <button
            onClick={() => setActiveTab('simple')}
            className={`
              px-3 py-1 text-xs font-mono font-bold uppercase transition-colors rounded-sm
              ${activeTab === 'simple' 
                ? 'bg-accounting-indigo text-accounting-paper shadow-sm' 
                : 'text-accounting-graphite hover:text-accounting-indigo'}
            `}
          >
            Personal
          </button>
          <button
            onClick={() => setActiveTab('advanced')}
            className={`
              px-3 py-1 text-xs font-mono font-bold uppercase transition-colors rounded-sm flex items-center gap-1
              ${activeTab === 'advanced' 
                ? 'bg-accounting-indigo text-accounting-paper shadow-sm' 
                : 'text-accounting-graphite hover:text-accounting-indigo'}
            `}
          >
            <Filter className="w-3 h-3" />
            Filtros Avanzados
          </button>
        </div>
      </div>

      {/* ==========================================
          VISTA: BÚSQUEDA SIMPLE (CATÁLOGO)
          ========================================== */}
      {activeTab === 'simple' && (
        <div className="flex flex-col gap-6 flex-1 justify-between">
          <form onSubmit={handleSimpleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-accounting-graphite" />
              </span>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Buscar por RFC o Nombre..."
                className="
                  block w-full pl-9 pr-3 py-2 text-sm bg-white border border-accounting-indigo/20 rounded-sm
                  focus:outline-none focus:ring-1 focus:ring-accounting-green focus:border-accounting-green
                  placeholder-accounting-graphite/60 font-sans text-accounting-indigo
                "
              />
            </div>
            <button
              type="submit"
              className="
                px-4 py-2 bg-accounting-indigo text-accounting-paper font-sans text-sm rounded-sm font-medium
                hover:bg-accounting-indigo/90 focus:outline-none focus:ring-2 focus:ring-accounting-green transition-colors
              "
            >
              Buscar
            </button>
          </form>

          {/* Tabla de Catálogo */}
          <div className="flex-1 flex flex-col justify-between min-h-[380px]">
            {isLoadingSimple ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-accounting-graphite">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accounting-indigo"></div>
                <p className="font-mono text-xs">Buscando en nóminas...</p>
              </div>
            ) : isErrorSimple ? (
              <div className="text-center py-20 text-accounting-red font-serif text-sm bg-white/50 border border-accounting-indigo/10 rounded-sm">
                Error al consultar el personal. Inténtelo más tarde.
              </div>
            ) : (!dataSimple?.data || dataSimple.data.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-accounting-indigo/10 bg-white/20 rounded-sm">
                <Inbox className="w-10 h-10 text-accounting-indigo/20 mb-2" />
                <span className="font-serif text-sm font-bold text-accounting-indigo mb-1">Sin Resultados</span>
                <p className="text-xs text-accounting-graphite max-w-xs">
                  No se encontraron empleados con ese criterio en los libros de la quincena.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left font-sans">
                  <thead>
                    <tr className="border-b border-accounting-indigo/30 text-[10px] uppercase tracking-wider text-accounting-graphite font-bold font-mono">
                      <th className="py-2 px-3">RFC</th>
                      <th className="py-2 px-3">Nombre Completo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accounting-indigo/10 text-sm">
                    {dataSimple.data.map((emp) => (
                      <tr
                        key={emp.rfc}
                        onClick={() => handleRowClick(emp.rfc)}
                        className="bg-white hover:bg-accounting-paper/50 cursor-pointer transition-colors duration-150 group"
                      >
                        <td className="py-2 px-3 font-mono text-xs text-accounting-indigo group-hover:text-accounting-green font-bold">
                          {emp.rfc}
                        </td>
                        <td className="py-2 px-3 text-accounting-indigo group-hover:text-accounting-green">
                          {emp.nom_emp}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginador Catálogo */}
            {dataSimple?.pagination && dataSimple.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-accounting-indigo/20 pt-4 mt-4 font-mono text-xs text-accounting-graphite">
                <button
                  onClick={() => setPageSimple((p) => Math.max(1, p - 1))}
                  disabled={pageSimple === 1}
                  className="
                    flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
                    hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
                  "
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
                
                <span>
                  Página {pageSimple} de {dataSimple.pagination.totalPages}
                </span>

                <button
                  onClick={() => setPageSimple((p) => Math.min(dataSimple.pagination.totalPages, p + 1))}
                  disabled={pageSimple === dataSimple.pagination.totalPages}
                  className="
                    flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
                    hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
                  "
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          VISTA: BÚSQUEDA AVANZADA (NÓMINAS)
          ========================================== */}
      {activeTab === 'advanced' && (
        <div className="flex flex-col gap-6 flex-1 justify-between">
          
          {/* Formulario de Filtros */}
          <form onSubmit={handleAdvancedSearchSubmit} className="bg-white/90 border border-accounting-indigo/15 p-4 rounded-sm shadow-sm flex flex-col gap-3">
            
            {/* 1. SECCIÓN: IDENTIFICACIÓN Y EDAD */}
            <div className="border border-accounting-indigo/10 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPersonal(!showPersonal)}
                className="w-full bg-accounting-paper/30 px-3 py-2 flex items-center justify-between text-xs font-mono font-bold text-accounting-indigo hover:bg-accounting-paper/50"
              >
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  DATOS PERSONALES Y EDAD
                </span>
                {showPersonal ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showPersonal && (
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Nombre o RFC</label>
                    <input
                      type="text"
                      value={advancedFilters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      placeholder="Ej. GILBERTO"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Entidad Fed. (Clave)</label>
                    <input
                      type="number"
                      value={advancedFilters.ent_fed}
                      onChange={(e) => handleFilterChange('ent_fed', e.target.value)}
                      placeholder="Ej. 10"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Edad Mínima</label>
                    <input
                      type="number"
                      value={advancedFilters.edad_min}
                      onChange={(e) => handleFilterChange('edad_min', e.target.value)}
                      placeholder="Ej. 18"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Edad Máxima</label>
                    <input
                      type="number"
                      value={advancedFilters.edad_max}
                      onChange={(e) => handleFilterChange('edad_max', e.target.value)}
                      placeholder="Ej. 65"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. SECCIÓN: CENTRO DE TRABAJO Y ADSCRIPCIÓN */}
            <div className="border border-accounting-indigo/10 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCT(!showCT)}
                className="w-full bg-accounting-paper/30 px-3 py-2 flex items-center justify-between text-xs font-mono font-bold text-accounting-indigo hover:bg-accounting-paper/50"
              >
                <span className="flex items-center gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  CENTRO DE TRABAJO Y ADSCRIPCIÓN
                </span>
                {showCT ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showCT && (
                <div className="p-3 bg-white flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Búsqueda General C.T. (Clave parcial)</label>
                      <input
                        type="text"
                        value={advancedFilters.ct_search}
                        onChange={(e) => handleFilterChange('ct_search', e.target.value)}
                        placeholder="Ej. ES o 52"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Categoría Puesto</label>
                      <input
                        type="text"
                        value={advancedFilters.cat_puesto}
                        onChange={(e) => handleFilterChange('cat_puesto', e.target.value)}
                        placeholder="Ej. E0281"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="border-t border-dashed border-accounting-indigo/10 pt-2 grid grid-cols-2 sm:grid-cols-6 gap-3">
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">C.T. Clasif</label>
                      <input
                        type="text"
                        value={advancedFilters.ct_clasif}
                        onChange={(e) => handleFilterChange('ct_clasif', e.target.value)}
                        placeholder="Ej. E"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">C.T. ID</label>
                      <input
                        type="text"
                        value={advancedFilters.ct_id}
                        onChange={(e) => handleFilterChange('ct_id', e.target.value)}
                        placeholder="Ej. ES"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">C.T. Secuencial</label>
                      <input
                        type="number"
                        value={advancedFilters.ct_secuencial}
                        onChange={(e) => handleFilterChange('ct_secuencial', e.target.value)}
                        placeholder="52"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">C.T. Dígito Ver.</label>
                      <input
                        type="text"
                        value={advancedFilters.ct_digito_ver}
                        onChange={(e) => handleFilterChange('ct_digito_ver', e.target.value)}
                        placeholder="Ej. B"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">Unidad</label>
                      <input
                        type="number"
                        value={advancedFilters.unidad}
                        onChange={(e) => handleFilterChange('unidad', e.target.value)}
                        placeholder="15"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">Subunidad</label>
                      <input
                        type="number"
                        value={advancedFilters.subunidad}
                        onChange={(e) => handleFilterChange('subunidad', e.target.value)}
                        placeholder="4"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. SECCIÓN: CONCEPTOS DE NÓMINA */}
            <div className="border border-accounting-indigo/10 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowConceptos(!showConceptos)}
                className="w-full bg-accounting-paper/30 px-3 py-2 flex items-center justify-between text-xs font-mono font-bold text-accounting-indigo hover:bg-accounting-paper/50"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  CONCEPTOS ASOCIADOS (P/D)
                </span>
                {showConceptos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showConceptos && (
                <div className="p-3 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Código Concepto</label>
                    <input
                      type="text"
                      value={advancedFilters.concepto}
                      onChange={(e) => handleFilterChange('concepto', e.target.value)}
                      placeholder="Ej. 1 o 19"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Tipo Movimiento</label>
                    <select
                      value={advancedFilters.concepto_tipo}
                      onChange={(e) => handleFilterChange('concepto_tipo', e.target.value)}
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none bg-white"
                    >
                      <option value="">Cualquiera</option>
                      <option value="P">Percepción (+)</option>
                      <option value="D">Deducción (-)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Importe Mínimo ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={advancedFilters.concepto_importe_min}
                      onChange={(e) => handleFilterChange('concepto_importe_min', e.target.value)}
                      placeholder="Ej. 500"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Importe Máximo ($)</label>
                    <input
                      type="number"
                      step="any"
                      value={advancedFilters.concepto_importe_max}
                      onChange={(e) => handleFilterChange('concepto_importe_max', e.target.value)}
                      placeholder="Ej. 5000"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. SECCIÓN: IMPORTES Y CHEQUE */}
            <div className="border border-accounting-indigo/10 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowImportes(!showImportes)}
                className="w-full bg-accounting-paper/30 px-3 py-2 flex items-center justify-between text-xs font-mono font-bold text-accounting-indigo hover:bg-accounting-paper/50"
              >
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  IMPORTES TOTALES DEL RECIBO
                </span>
                {showImportes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showImportes && (
                <div className="p-3 bg-white flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                    <div className="md:col-span-2">
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Líquido Neto Mín.</label>
                      <input
                        type="number"
                        value={advancedFilters.neto_min}
                        onChange={(e) => handleFilterChange('neto_min', e.target.value)}
                        placeholder="Ej. 3000"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Líquido Neto Máx.</label>
                      <input
                        type="number"
                        value={advancedFilters.neto_max}
                        onChange={(e) => handleFilterChange('neto_max', e.target.value)}
                        placeholder="Ej. 15000"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">Percep. Mín.</label>
                      <input
                        type="number"
                        value={advancedFilters.perc_min}
                        onChange={(e) => handleFilterChange('perc_min', e.target.value)}
                        placeholder="Ej. 4000"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[8px] uppercase tracking-wider text-accounting-graphite mb-1">Deducc. Máx.</label>
                      <input
                        type="number"
                        value={advancedFilters.ded_max}
                        onChange={(e) => handleFilterChange('ded_max', e.target.value)}
                        placeholder="Ej. 2000"
                        className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 5. SECCIÓN: PLAZA Y CONDICIONES */}
            <div className="border border-accounting-indigo/10 rounded-sm overflow-hidden">
              <button
                type="button"
                onClick={() => setShowPlaza(!showPlaza)}
                className="w-full bg-accounting-paper/30 px-3 py-2 flex items-center justify-between text-xs font-mono font-bold text-accounting-indigo hover:bg-accounting-paper/50"
              >
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  CONDICIONES DE PLAZA
                </span>
                {showPlaza ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {showPlaza && (
                <div className="p-3 grid grid-cols-1 sm:grid-cols-5 gap-3 bg-white">
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Nivel Sueldo Mín.</label>
                    <input
                      type="number"
                      value={advancedFilters.nivel_sueldo_min}
                      onChange={(e) => handleFilterChange('nivel_sueldo_min', e.target.value)}
                      placeholder="Ej. 3"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Nivel Sueldo Máx.</label>
                    <input
                      type="number"
                      value={advancedFilters.nivel_sueldo_max}
                      onChange={(e) => handleFilterChange('nivel_sueldo_max', e.target.value)}
                      placeholder="Ej. 10"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Horas Mínimas</label>
                    <input
                      type="number"
                      value={advancedFilters.horas_min}
                      onChange={(e) => handleFilterChange('horas_min', e.target.value)}
                      placeholder="0"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Horas Máximas</label>
                    <input
                      type="number"
                      value={advancedFilters.horas_max}
                      onChange={(e) => handleFilterChange('horas_max', e.target.value)}
                      placeholder="40"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[9px] uppercase tracking-wider text-accounting-graphite mb-1">Motivo Mov.</label>
                    <input
                      type="number"
                      value={advancedFilters.mot_mov}
                      onChange={(e) => handleFilterChange('mot_mov', e.target.value)}
                      placeholder="Ej. 10"
                      className="w-full border border-accounting-indigo/20 rounded-sm px-2 py-1 text-xs focus:ring-1 focus:ring-accounting-green focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex gap-2 justify-end mt-2 pt-2 border-t border-accounting-indigo/10">
              <button
                type="button"
                onClick={handleClearFilters}
                className="
                  px-3 py-1.5 bg-accounting-paper text-accounting-indigo font-sans text-xs rounded-sm font-semibold border border-accounting-indigo/20
                  hover:bg-accounting-paper/85 transition-colors focus:outline-none
                "
              >
                Limpiar Filtros
              </button>
              <button
                type="submit"
                className="
                  px-5 py-1.5 bg-accounting-indigo text-accounting-paper font-sans text-xs rounded-sm font-semibold flex items-center gap-1
                  hover:bg-accounting-indigo/90 focus:outline-none transition-colors
                "
              >
                <Search className="w-3.5 h-3.5" />
                Filtrar Libros
              </button>
            </div>
          </form>

          {/* Tabla de Resultados Avanzados */}
          <div className="flex-1 flex flex-col justify-between min-h-[340px]">
            {isLoadingAdvanced ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-accounting-graphite">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accounting-indigo"></div>
                <p className="font-mono text-xs">Consultando libros contables filtrados...</p>
              </div>
            ) : isErrorAdvanced ? (
              <div className="text-center py-20 text-accounting-red font-serif text-sm bg-white/50 border border-accounting-indigo/10 rounded-sm">
                Error al consultar nóminas filtradas. Revise los parámetros.
              </div>
            ) : (!dataAdvanced?.data || dataAdvanced.data.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-accounting-indigo/10 bg-white/20 rounded-sm">
                <Inbox className="w-10 h-10 text-accounting-indigo/20 mb-2" />
                <span className="font-serif text-sm font-bold text-accounting-indigo mb-1">Sin Registros Contables</span>
                <p className="text-xs text-accounting-graphite max-w-xs px-4">
                  Ningún recibo coincide con los filtros aplicados en el balance de este período.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left font-sans">
                  <thead>
                    <tr className="border-b border-accounting-indigo/30 text-[9px] uppercase tracking-wider text-accounting-graphite font-bold font-mono">
                      <th className="py-2 px-2">RFC / Nombre</th>
                      <th className="py-2 px-2 text-center">U / Sub</th>
                      <th className="py-2 px-2 text-center">C.T.</th>
                      <th className="py-2 px-2 text-center">Edad</th>
                      <th className="py-2 px-2 text-right">Líquido Neto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-accounting-indigo/10 text-xs">
                    {dataAdvanced.data.map((reg) => (
                      <tr
                        key={reg.num_cons}
                        onClick={() => handleRowClick(reg.rfc, reg.qna_pago)}
                        className="bg-white hover:bg-accounting-paper/50 cursor-pointer transition-colors duration-150 group"
                      >
                        <td className="py-2 px-2 max-w-[150px] truncate text-accounting-indigo group-hover:text-accounting-green">
                          <span className="font-mono text-xs font-bold block">{reg.rfc}</span>
                          <span className="text-[10px] text-accounting-graphite group-hover:text-accounting-green">{reg.nom_emp}</span>
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-accounting-indigo group-hover:text-accounting-green">
                          {reg.unidad}/{reg.subunidad}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-accounting-indigo group-hover:text-accounting-green">
                          {reg.ct_clasif}-{reg.ct_id}-{reg.ct_secuencial}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-accounting-indigo group-hover:text-accounting-green font-bold">
                          {reg.edad !== null && reg.edad !== undefined ? `${reg.edad} a.` : 'N/D'}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-accounting-green font-bold">
                          {formatCurrency(reg.tot_net_cheque)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Paginador Avanzado */}
            {dataAdvanced?.pagination && dataAdvanced.pagination.totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-accounting-indigo/20 pt-4 mt-4 font-mono text-xs text-accounting-graphite">
                <button
                  type="button"
                  onClick={() => setPageAdvanced((p) => Math.max(1, p - 1))}
                  disabled={pageAdvanced === 1}
                  className="
                    flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
                    hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
                  "
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
                
                <span>
                  Página {pageAdvanced} de {dataAdvanced.pagination.totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPageAdvanced((p) => Math.min(dataAdvanced.pagination.totalPages, p + 1))}
                  disabled={pageAdvanced === dataAdvanced.pagination.totalPages}
                  className="
                    flex items-center gap-1 px-3 py-1.5 bg-white border border-accounting-indigo/20 rounded-sm
                    hover:bg-accounting-paper/40 disabled:opacity-50 disabled:hover:bg-white transition-colors duration-150
                  "
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
