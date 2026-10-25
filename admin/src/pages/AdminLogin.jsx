import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, Eye, EyeOff, ShieldX, Lock, Mail, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session, isAdmin, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [accessDenied, setAccessDenied] = useState(false)
  const [touched, setTouched] = useState({})

  // If user is already authenticated + admin, redirect to dashboard
  useEffect(() => {
    if (!authLoading && session && isAdmin) {
      navigate('/', { replace: true })
    }
  }, [authLoading, session, isAdmin, navigate])

  // Check if redirected here because of access denied
  useEffect(() => {
    if (searchParams.get('denied') === '1') {
      setAccessDenied(true)
      // Sign out the non-admin user so they can try a different account
      supabase.auth.signOut()
    }
  }, [searchParams])

  function validateEmail(val) {
    if (!val.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address'
    return null
  }

  function validatePassword(val) {
    if (!val) return 'Password is required'
    if (val.length < 6) return 'Password must be at least 6 characters'
    return null
  }

  function handleBlur(field) {
    setTouched((prev) => ({ ...prev, [field]: true }))
    if (field === 'email') {
      const err = validateEmail(email)
      setFieldErrors((prev) => ({ ...prev, email: err }))
    }
    if (field === 'password') {
      const err = validatePassword(password)
      setFieldErrors((prev) => ({ ...prev, password: err }))
    }
  }

  function handleEmailChange(val) {
    setEmail(val)
    setAccessDenied(false)
    setError(null)
    if (touched.email) {
      setFieldErrors((prev) => ({ ...prev, email: validateEmail(val) }))
    }
  }

  function handlePasswordChange(val) {
    setPassword(val)
    setError(null)
    if (touched.password) {
      setFieldErrors((prev) => ({ ...prev, password: validatePassword(val) }))
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)
    setAccessDenied(false)

    // Validate all fields
    const emailErr = validateEmail(email)
    const passErr = validatePassword(password)
    setFieldErrors({ email: emailErr, password: passErr })
    setTouched({ email: true, password: true })

    if (emailErr || passErr) return

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        const msg = error.message?.toLowerCase() ?? ''
        if (msg.includes('invalid login credentials') || msg.includes('invalid_grant')) {
          setError('Invalid email or password.')
        } else if (msg.includes('email not confirmed')) {
          setError('Email not confirmed. Check your inbox for a confirmation link.')
        } else {
          setError(`Sign-in failed: ${error.message}`)
        }
      }
      // If sign-in succeeds, AuthContext will check admin status.
      // App.jsx redirects non-admins back here with ?denied=1
      // and admins get sent to the dashboard.
    } catch {
      setError(
        'Could not reach the server. The Supabase project may be paused, or check your internet connection.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f6f5] flex items-center justify-center px-4">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, #06433C 1px, transparent 0)`,
        backgroundSize: '24px 24px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative bg-white rounded-2xl border border-gray-100 w-full max-w-[380px] shadow-sm overflow-hidden"
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-brand-600 via-brand-400 to-brand-600" />

        <div className="p-7">
          {/* Header */}
          <div className="flex items-center gap-3 mb-7">
            <img
              src="/logo.png"
              alt="NwSSU Connect"
              className="w-11 h-11 rounded-xl object-cover border border-gray-100 shrink-0"
            />
            <div>
              <p className="text-[15px] font-bold text-gray-900 leading-tight">NwSSU Connect</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Admin Dashboard</p>
            </div>
          </div>

          {/* Access denied banner */}
          <AnimatePresence>
            {accessDenied && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl px-3.5 py-3">
                  <ShieldX size={15} className="shrink-0 mt-0.5 text-amber-600" />
                  <div>
                    <p className="font-semibold mb-0.5">Access denied</p>
                    <p className="text-amber-700 leading-relaxed">
                      This account doesn't have admin privileges. Contact the system administrator if you believe this is an error.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* General error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 overflow-hidden"
              >
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl px-3.5 py-3">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="flex flex-col gap-4" noValidate>
            {/* Email */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="admin@nwssu.edu.ph"
                  autoComplete="email"
                  className={`w-full h-11 pl-10 pr-3 text-sm rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-300 ${
                    touched.email && fieldErrors.email
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-brand-200 focus:border-brand-400'
                  }`}
                />
              </div>
              <AnimatePresence>
                {touched.email && fieldErrors.email && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[11px] text-red-500 mt-1 ml-1"
                  >
                    {fieldErrors.email}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold text-gray-500 block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className={`w-full h-11 pl-10 pr-10 text-sm rounded-xl border bg-gray-50 focus:outline-none focus:ring-2 focus:bg-white transition-all placeholder:text-gray-300 ${
                    touched.password && fieldErrors.password
                      ? 'border-red-300 focus:ring-red-200'
                      : 'border-gray-200 focus:ring-brand-200 focus:border-brand-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-0.5"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <AnimatePresence>
                {touched.password && fieldErrors.password && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-[11px] text-red-500 mt-1 ml-1"
                  >
                    {fieldErrors.password}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-brand-600 text-white text-sm font-semibold disabled:opacity-60 hover:bg-brand-700 active:scale-[0.98] transition-all mt-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-[10px] text-gray-300 text-center mt-6">
            Authorized personnel only
          </p>
        </div>
      </motion.div>
    </div>
  )
}
