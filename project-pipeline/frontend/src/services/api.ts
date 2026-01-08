// Axios API client with JWT interceptors
import axios, { AxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor - add JWT token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle 401 - unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      // Clear auth data
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')

      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default api
