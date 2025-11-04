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
    if (!data.user || !data.session) {
        throw new Error('Sign in failed: no user or session returned.');
    }

    const user = { id: data.user.id, email: data.user.email ?? null };
    
    // If the session's Authenticator Assurance Level is 'aal1', it means a second factor is required.
    if (data.session.aal === 'aal1') {
        // We need to get the factor ID to challenge it.
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        
        // Check if there's a TOTP factor available to challenge.
        if (factorsError || !factorsData?.totp || factorsData.totp.length === 0) {
             throw new Error(factorsError?.message || '2FA is required, but no TOTP factor could be found.');
        }
        // Return that MFA is required, along with the first available TOTP factor ID.
        return { user, mfaRequired: true, factorId: factorsData.totp[0].id };
    }

    // If AAL is not 'aal1', the user is fully authenticated (or MFA is not enabled).
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

export const resetUserPassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        throw new Error(error.message);
    }
};

export const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
        throw new Error(error.message);
    }
    // After a successful password change, sign out to invalidate old tokens.
    await signOut();
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
    const totpFactor = data.totp.find(f => f.status === 'verified');
    return { isEnabled: !!totpFactor, factorId: totpFactor?.id || null };
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

export const verifyAndUnenrollMfa = async (factorId: string, code: string) => {
    // First, verify the code to get an AAL2 session
    await challengeAndVerifyMfa(factorId, code);
    // If verification is successful, unenroll
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) throw new Error(error.message);
}