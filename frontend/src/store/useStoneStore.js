import { create } from 'zustand'

export const useStoneStore = create((set) => ({
  piedras: [],
  activePiedra: null,
  estadosHistorial: [], // Cache for active piedra history
  
  // Actions
  setPiedras: (piedras) => set({ piedras }),
  setActivePiedra: (piedra) => set({ activePiedra: piedra }),
  setEstadosHistorial: (historial) => set({ estadosHistorial: historial }),
  
  // To update a single stone after its state changes
  updatePiedraState: (piedraId, newState) => set((state) => ({
    piedras: state.piedras.map(p => 
      p.id === piedraId ? { ...p, estado_actual: newState } : p
    ),
    activePiedra: state.activePiedra?.id === piedraId 
      ? { ...state.activePiedra, estado_actual: newState } 
      : state.activePiedra
  }))
}))
