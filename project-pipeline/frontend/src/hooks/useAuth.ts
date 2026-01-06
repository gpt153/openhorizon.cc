import { useMutation } from '@tanstack/react-query'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import type { AuthResponse } from '../types'
import { connectSocket, disconnectSocket } from '../lib/socket'

export const useAuth = () => {
  const { setAuth, clearAuth } = useAuthStore()

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await api.post<AuthResponse>('/auth/login', data)
      return response.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      connectSocket(data.user.id)
    },
  })

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // No backend logout endpoint, just clear local state
      return Promise.resolve()
    },
    onSuccess: () => {
      disconnectSocket()
      clearAuth()
    },
  })

  return {
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
  }
}
