import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Grid, AlertCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Invalid email or password.')
    } else {
      navigate('/')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#f5f6f5] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 p-8 w-full max-w-sm shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
            <Grid size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">App Library Admin</p>
            <p className="text-xs text-gray-400">NwSSU</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@nwssu.edu.ph"
              required
              className="w-full h-11 px-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-gray-300"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 block mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-11 px-3 text-sm rounded-xl border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent placeholder:text-gray-300"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-brand-700 transition-colors mt-1"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>


      </motion.div>
    </div>
  )
}
