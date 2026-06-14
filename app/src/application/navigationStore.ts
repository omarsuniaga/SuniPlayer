import { create } from 'zustand'

export type AppView = 'inicio' | 'reproductor' | 'libreria' | 'show' | 'edit' | 'perfil'

type NavigationState = {
  currentView: AppView
}

type NavigationActions = {
  navigate: (view: AppView) => void
  reset: () => void
}

const initialState: NavigationState = {
  currentView: 'libreria',
}

export const useNavigationStore = create<NavigationState & NavigationActions>((set) => ({
  ...initialState,
  navigate: (view) => set({ currentView: view }),
  reset: () => set(initialState),
}))
