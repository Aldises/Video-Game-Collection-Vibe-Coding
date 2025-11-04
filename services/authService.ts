import { AuthCredentials, SignInResult, User } from '../types';
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

  // Set a flag to indicate that the user has just signed up and is awaiting email confirmation.
  sessionStorage.setItem('awaiting_confirmation', 'true');

  return { id: data.user.id, email: data.user.email ?? null };
};

export const signIn = async ({ email, password }: AuthCredentials): Promise<SignInResult> => {
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

    const user = { id: data.user.id, email: data.user.email ?? null };
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (mfaData?.nextLevel === 'aal2') {
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError || !factorsData?.totp[0]) {
             throw new Error(factorsError?.message || 'Could not retrieve MFA factor.');
        }
        return { user, mfaRequired: true, factorId: factorsData.totp[0].id };
    }

    return { user, mfaRequired: false };
};

export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        throw new Error(error.message);
    }
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin, // Or a specific password reset page
    });
    if (error) {
        throw new Error(error.message);
    }
}

export const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        throw new Error(error.message);
    }
}

export const verifyMfa = async (factorId: string, code: string): Promise<void> => {
    const { error: challengeError, data: challengeData } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw new Error(challengeError.message);
    
    const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code
    });
    if (verifyError) throw new Error(verifyError.message);
}

// --- 2FA Management ---
export const getMfaStatus = async (): Promise<{ isEnabled: boolean; factorId: string | null }> => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    if (error) {
        console.error("Error fetching MFA status:", error);
        return { isEnabled: false, factorId: null };
    }
    const totpFactor = data.totp[0];
    return { isEnabled: !!totpFactor && totpFactor.status === 'verified', factorId: totpFactor?.id || null };
};

export const enrollMfa = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
    });
    if (error) throw new Error(error.message);
    return data;
}

export const challengeAndVerifyMfa = async (factorId: string, code: string) => {
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) throw new Error(challengeError.message);

    const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
    });
    if (verifyError) throw new Error(verifyError.message);
}

export const unenrollMfa = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message);
}