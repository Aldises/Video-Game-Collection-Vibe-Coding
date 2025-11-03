import { User } from '../types';
import { auth } from './firebase';
import { dbService } from './dbService';
// Fix: Removed Firebase v9 modular imports as they are not available in the project's Firebase version.
// import { 
//     createUserWithEmailAndPassword, 
//     signInWithEmailAndPassword,
//     signOut,
//     AuthErrorCodes
// } from 'firebase/auth';

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    try {
      // Fix: Switched to v8 `auth.signInWithEmailAndPassword` method.
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      if (!userCredential.user) {
        throw new Error("Login failed: user data not available.");
      }
      return { id: userCredential.user.uid, email: userCredential.user.email! };
    } catch (error: any) {
        // Fix: Replaced v9 AuthErrorCodes.INVALID_LOGIN_CREDENTIALS with equivalent v8 error code strings.
        if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-email') {
            throw new Error('Invalid email or password.');
        }
        throw new Error('An unexpected error occurred during login.');
    }
  },

  signup: async (email: string, password: string): Promise<User> => {
     if (!email || !password) {
        throw new Error('Email and password are required.');
     }
    try {
        // Fix: Switched to v8 `auth.createUserWithEmailAndPassword` method.
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        if (!userCredential.user) {
            throw new Error("Signup failed: user data not available.");
        }
        const { uid } = userCredential.user;
        // Create a corresponding user document in Firestore
        await dbService.createUser(uid, email);
        return { id: uid, email: userCredential.user.email! };
    } catch (error: any) {
        // Fix: Replaced v9 AuthErrorCodes.EMAIL_EXISTS with its equivalent v8 string.
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('An account with this email already exists. Please log in.');
        }
        throw new Error('An unexpected error occurred during signup.');
    }
  },

  logout: async (): Promise<void> => {
    // Fix: Switched to v8 `auth.signOut` method.
    await auth.signOut();
  },
};
