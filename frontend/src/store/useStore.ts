import { create } from 'zustand';

interface DashboardState {
  selectedQna: number;
  selectedRfc: string | null;
  selectedNumCons: number | null;
  setSelectedQna: (qna: number) => void;
  setSelectedRfc: (rfc: string | null) => void;
  setSelectedNumCons: (numCons: number | null) => void;
}

export const useStore = create<DashboardState>((set) => ({
  selectedQna: 201806, // Default quincena desde el conjunto de datos cargado
  selectedRfc: null,
  selectedNumCons: null,
  setSelectedQna: (qna) => set({ selectedQna: qna }),
  setSelectedRfc: (rfc) => set({ selectedRfc: rfc }),
  setSelectedNumCons: (numCons) => set({ selectedNumCons: numCons }),
}));
