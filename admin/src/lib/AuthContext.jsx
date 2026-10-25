import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined)  // undefined = loading
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminChecked, setAdminChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) checkAdmin(session.user.id)
      else setAdminChecked(true)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session)
      if (session) {
        checkAdmin(session.user.id)
      } else {
        setIsAdmin(false)
        setAdminChecked(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function checkAdmin(userId) {
    setAdminChecked(false)
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    setIsAdmin(!error && !!data)
    setAdminChecked(true)
  }

  const loading = session === undefined || (session && !adminChecked)

  return (
    <AuthContext.Provider value={{ session, isAdmin, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
