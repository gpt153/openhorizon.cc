import { create } from 'zustand'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('auth_token'),

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('auth_token', token)
    set({ user, token })
  },

  clearAuth: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('auth_token')
    set({ user: null, token: null })
  },

  isAuthenticated: () => !!get().token,
}))
