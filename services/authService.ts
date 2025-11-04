import { AuthCredentials, User } from '../types';
import { supabase } from './supabaseClient';

export const signUp = async ({ email, password }: AuthCredentials): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }
  if (!data.user) {
    throw new Error('Sign up failed: no user returned.');
  }

  return { id: data.user.id, email: data.user.email ?? null };
};

export const signIn = async ({ email, password }: AuthCredentials): Promise<User> => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }
    if (!data.user) {
        throw new Error('Sign in failed: no user returned.');
    }

    return { id: data.user.id, email: data.user.email ?? null };
};

export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw new Error(error.message);
    }
};