import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/authService';
// Fix: Replaced Firebase v9 modular imports with v8 compatible imports.
// import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import firebase from 'firebase/app';
import 'firebase/auth';
import { auth } from '../services/firebase';

interface UserContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  logout: () => void;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fix: Switched to v8 `auth.onAuthStateChanged` method and used `firebase.User` for typing.
    const unsubscribe = auth.onAuthStateChanged((firebaseUser: firebase.User | null) => {
        if (firebaseUser) {
            setUser({ id: firebaseUser.uid, email: firebaseUser.email! });
        } else {
            setUser(null);
        }
        setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await authService.logout();
    // onAuthStateChanged will handle setting the user to null
  };

  return (
    <UserContext.Provider value={{ user, setUser, isLoading, logout }}>
      {children}
    </UserContext.Provider>
  );
};
