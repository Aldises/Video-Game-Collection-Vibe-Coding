import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabaseClient';

interface UserContextType {
  user: User | null;
  loading: boolean;
}

export const UserContext = createContext<UserContextType>({ 
  user: null, 
  loading: true,
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const isPasswordRecovery = window.location.hash.includes('type=recovery');

      // Do not set a user session if they are in the middle of a password reset.
      // The App component is responsible for showing the password reset page.
      // This prevents the race condition where the user is logged in before the reset page can be shown.
      if (isPasswordRecovery) {
        setUser(null);
        setLoading(false);
        return;
      }

      // If aal is 'aal1', the user is in a partially authenticated state (waiting for MFA).
      // We treat them as not logged in until they complete the second factor.
      if (session?.aal === 'aal1') {
        setUser(null);
      } else {
        const currentUser = session?.user;
        setUser(currentUser ? { id: currentUser.id, email: currentUser.email || null } : null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
};