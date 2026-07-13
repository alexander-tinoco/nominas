import { useState, useEffect } from 'react';

export const EMPTY_FILTERS = {
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

export const useAdvancedNominaFilters = () => {
  const [advancedFilters, setAdvancedFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
  const [pageAdvanced, setPageAdvanced] = useState(1);
  const limitAdvanced = 8;

  // Resetear página avanzada al cambiar filtros aplicados
  useEffect(() => {
    setPageAdvanced(1);
  }, [appliedFilters]);

  const handleAdvancedSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Filtrar campos vacíos antes de aplicar
    const cleanFilters = Object.fromEntries(
      Object.entries(advancedFilters).filter(([_, val]) => val !== '')
    );
    setAppliedFilters(cleanFilters);
  };

  const handleClearFilters = () => {
    setAdvancedFilters(EMPTY_FILTERS);
    setAppliedFilters({});
  };

  const handleFilterChange = (key: string, value: string) => {
    setAdvancedFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return {
    advancedFilters,
    appliedFilters,
    pageAdvanced,
    setPageAdvanced,
    limitAdvanced,
    handleFilterChange,
    handleClearFilters,
    handleAdvancedSearchSubmit
  };
};
