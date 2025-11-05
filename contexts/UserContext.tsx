import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { User, Profile } from '../types'
import { supabase } from '../services/supabaseClient'
import { getUserProfile } from '../services/dbService';

interface UserContextType {
  user: User | null
  loading: boolean,
  refetchUser: (isBackground?: boolean) => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refetchUser: () => {},
})

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refetchUser = useCallback(async (isBackground = false) => {
    if (!isBackground) {
        setLoading(true);
    }
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const profile = await getUserProfile(session.user.id);
            setUser({ id: session.user.id, email: session.user.email || null, profile });
        } else {
            setUser(null);
        }
    } catch (error) {
        console.error("Error during user refetch:", error);
        // We don't nullify the user on a failed refetch,
        // as it might be a temporary network issue.
        // The old user data will persist until a successful fetch or logout.
    } finally {
        if (!isBackground) {
            setLoading(false);
        }
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setLoading(true);
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
        
        if (aal === 'aal1') {
          console.log('🟠 AAL1 → MFA pending. User is not fully authenticated.')
          setUser(null)
        } else if (currentUser) {
          console.log('✅ Session is valid. User is authenticated.')
          try {
            const profile = await getUserProfile(currentUser.id);
            setUser({ id: currentUser.id, email: currentUser.email || null, profile });
          } catch (error: any) {
              console.error("Failed to fetch user profile, setting basic user object.", {
                  message: error.message,
                  stack: error.stack,
                  fullError: error
              });
              setUser({ id: currentUser.id, email: currentUser.email || null, profile: null });
          }
        } else {
          setUser(null);
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, []) // Empty dependency array ensures this effect runs only once on mount.

  return (
    <UserContext.Provider value={{ user, loading, refetchUser }}>
      {children}
    </UserContext.Provider>
  )
}
