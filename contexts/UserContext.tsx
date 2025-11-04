import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { User } from '../types'
import { supabase } from '../services/supabaseClient'

interface UserContextType {
  user: User | null
  loading: boolean
}

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
})

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isPasswordRecovery = window.location.hash.includes('type=recovery')
      if (isPasswordRecovery) {
        setUser(null)
        setLoading(false)
        return
      }

      if (session) {
        const aal = session.aal
        const currentUser = session.user
        console.log('🔐 Auth event:', _event, 'AAL:', aal)

        // If AAL is 'aal1', it means the user has completed the first factor
        // but not the second one yet. We should NOT set the user in the context
        // as they are not fully authenticated. The LoginPage handles this state.
        if (aal === 'aal1') {
          console.log('🟠 AAL1 → MFA pending. User is not fully authenticated.')
          setUser(null)
        } else {
          // If AAL is 'aal2' (MFA complete) or undefined (for non-MFA users),
          // the user is fully authenticated.
          console.log('✅ Session is valid. User is authenticated.')
          setUser(currentUser ? { id: currentUser.id, email: currentUser.email || null } : null)
        }
      } else {
        // If there is no session, the user is logged out.
        setUser(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  )
}
