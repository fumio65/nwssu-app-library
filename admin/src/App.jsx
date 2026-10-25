import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'

function ProtectedAdmin() {
  const { session, isAdmin, loading } = useAuth()

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#f5f6f5]">
      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (!session) return <Navigate to="/login" replace />

  // Authenticated but not an admin — show access denied
  if (!isAdmin) return <Navigate to="/login?denied=1" replace />

  return <AdminDashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/" element={<ProtectedAdmin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
