// Main App component with React Router setup
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import ProjectCreate from './pages/ProjectCreate'
import ProjectEdit from './pages/ProjectEdit'
import PhaseDetail from './pages/PhaseDetail'
import PhaseCreate from './pages/PhaseCreate'
import PhaseEdit from './pages/PhaseEdit'
import Chat from './pages/Chat'
import BudgetOverview from './pages/BudgetOverview'
import Reports from './pages/Reports'
import SeedGarden from './pages/SeedGarden'
import SeedGeneration from './pages/SeedGeneration'
import SeedDetail from './pages/SeedDetail'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public route - Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              }
            />
            <Route
              path="/projects/create"
              element={
                <Layout>
                  <ProjectCreate />
                </Layout>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <Layout>
                  <ProjectDetail />
                </Layout>
              }
            />
            <Route
              path="/projects/:projectId/edit"
              element={
                <Layout>
                  <ProjectEdit />
                </Layout>
              }
            />
            <Route
              path="/projects/:projectId/phases/create"
              element={
                <Layout>
                  <PhaseCreate />
                </Layout>
              }
            />
            <Route
              path="/phases/:phaseId"
              element={
                <Layout>
                  <PhaseDetail />
                </Layout>
              }
            />
            <Route
              path="/phases/:phaseId/edit"
              element={
                <Layout>
                  <PhaseEdit />
                </Layout>
              }
            />
            <Route
              path="/chat"
              element={
                <Layout>
                  <Chat />
                </Layout>
              }
            />
            <Route
              path="/budget"
              element={
                <Layout>
                  <BudgetOverview />
                </Layout>
              }
            />
            <Route
              path="/reports"
              element={
                <Layout>
                  <Reports />
                </Layout>
              }
            />
            <Route
              path="/seeds"
              element={
                <Layout>
                  <SeedGarden />
                </Layout>
              }
            />
            <Route
              path="/seeds/generate"
              element={
                <Layout>
                  <SeedGeneration />
                </Layout>
              }
            />
            <Route
              path="/seeds/:id"
              element={
                <Layout>
                  <SeedDetail />
                </Layout>
              }
            />
          </Route>

          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </QueryClientProvider>
  )
}
