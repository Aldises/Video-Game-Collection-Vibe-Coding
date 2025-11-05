import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { User, Profile } from '../types'
import { supabase } from '../services/supabaseClient'
import { getUserProfile } from '../services/dbService';

interface UserContextType {
  user: User | null
  loading: boolean,
  refetchUser: () => void;
}

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refetchUser: () => {},
})

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = useCallback(async (userId: string, email: string | null) => {
    try {
        const profile = await getUserProfile(userId);
        setUser({ id: userId, email, profile });
    } catch (error) {
        console.error("Failed to fetch user profile, setting basic user object.", error);
        setUser({ id: userId, email, profile: null });
    }
  }, []);
  
  const refetchUser = useCallback(async () => {
    if (user) {
        setLoading(true);
        await fetchUserProfile(user.id, user.email);
        setLoading(false);
    }
  }, [user, fetchUserProfile]);

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
          await fetchUserProfile(currentUser.id, currentUser.email || null);
        } else {
          setUser(null);
        }
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchUserProfile])

  return (
    <UserContext.Provider value={{ user, loading, refetchUser }}>
      {children}
    </UserContext.Provider>
  )
}