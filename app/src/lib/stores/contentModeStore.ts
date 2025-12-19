import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ContentMode = 'working' | 'formal'

interface ContentModeState {
  mode: ContentMode
  setMode: (mode: ContentMode) => void
  toggleMode: () => void
  isWorking: boolean
  isFormal: boolean
}

export const useContentModeStore = create<ContentModeState>()(
  persist(
    (set, get) => ({
      mode: 'working', // Default to working mode

      setMode: (mode: ContentMode) => set({ mode }),

      toggleMode: () => {
        const currentMode = get().mode
        set({ mode: currentMode === 'working' ? 'formal' : 'working' })
      },

      // Computed getters for convenience
      get isWorking() {
        return get().mode === 'working'
      },

      get isFormal() {
        return get().mode === 'formal'
      },
    }),
    {
      name: 'content-mode-storage',
      partialize: (state) => ({ mode: state.mode }),
    }
  )
)
