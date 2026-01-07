// Zustand auth store with persistence
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user: User, token: string) => {
        // Store token in localStorage for API interceptor
        localStorage.setItem('auth_token', token)

        set({
          user,
          token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        // Clear Zustand persist storage FIRST to prevent re-creation
        localStorage.removeItem('auth-storage')

        // Update state to null
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })

        // Finally clear all remaining localStorage
        localStorage.clear()
      },

      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage', // key in localStorage
    }
  )
)
