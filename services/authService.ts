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
  
  // The database trigger 'on_auth_user_created' is now solely responsible for creating the profile.
  // This avoids RLS (Row Level Security) issues on the client-side immediately after sign-up,
  // which was the cause of the '[object Object]' error.

  sessionStorage.setItem('awaiting_confirmation', 'true');
  // The returned user object here is temporary until the context fetches the full profile.
  return { id: data.user.id, email: data.user.email ?? null, profile: null };
};

export const signIn = async ({ email, password }: AuthCredentials): Promise<SignInResult> => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const session = data.session;

  // Case 1: MFA is required.
  // The session exists but has an Authenticator Assurance Level (AAL) of 1.
  if (session && session.aal === 'aal1') {
    // We need to find the user's verified TOTP factor to challenge it.
    const { data: mfaData, error: mfaError } = await supabase.auth.mfa.listFactors();
    if (mfaError) throw new Error(mfaError.message);
    
    const verifiedFactor = mfaData?.totp.find(f => f.status === 'verified');
    if (!verifiedFactor) throw new Error('2FA is required, but no verified factor found for this user.');
    
    // The user is partially logged in. Return the required info for the next step.
    return { user: null, mfaRequired: true, factorId: verifiedFactor.id };
  }

  // Case 2: Standard login successful (no MFA).
  if (session && data.user) {
    // FIX: Property 'profile' is missing in type '{ id: any; email: any; }' but required in type 'User'.
    const user = { id: data.user.id, email: data.user.email ?? null, profile: null };
    return { user, mfaRequired: false };
  }
  
  // Case 3: Login failed for other reasons.
  throw new Error('Sign in failed: unexpected response from server.');
};


export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw new Error(error.message);
};

export const resetUserPassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
};

export const updatePassword = async (newPassword: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  await signOut();
};

export const verifyMfa = async (factorId: string, code: string): Promise<void> => {
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) throw new Error(error.message);
  // On success, this automatically elevates the session to AAL2 and
  // triggers an onAuthStateChange event.
};

// --- 2FA Management ---
export const getMfaStatus = async (): Promise<{ isEnabled: boolean; factorId: string | null }> => {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) {
    console.error('Error fetching MFA status:', error);
    return { isEnabled: false, factorId: null };
  }
  const totpFactor = data.totp.find((f) => f.status === 'verified');
  return { isEnabled: !!totpFactor, factorId: totpFactor?.id || null };
};

export const enrollMfa = async () => {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
  });
  if (error) throw new Error(error.message);
  return data;
};

export const challengeAndVerifyMfa = async (factorId: string, code: string) => {
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw new Error(challengeError.message);

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) throw new Error(verifyError.message);
};

export const verifyAndUnenrollMfa = async (factorId: string, code: string) => {
  await challengeAndVerifyMfa(factorId, code);
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw new Error(error.message);
};
