import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase } from './supabase';

/** Must match a URL in Supabase → Authentication → URL Configuration → Redirect URLs */
export function getOAuthRedirectUri(): string {
  return makeRedirectUri({ path: 'auth/callback' });
}

type Provider = 'google' | 'apple';

export async function signInWithOAuthProvider(provider: Provider): Promise<{ error: Error | null }> {
  const redirectTo = getOAuthRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });

  if (error) {
    return { error: error as Error };
  }
  if (!data.url) {
    return { error: new Error('No OAuth URL returned') };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== 'success' || !result.url) {
    return { error: null };
  }

  const url = result.url;

  try {
    const parsed = new URL(url);
    const code = parsed.searchParams.get('code');
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        return { error: exchangeError as Error };
      }
      return { error: null };
    }
  } catch {
    // fall through to hash parsing
  }

  const hash = new URL(url).hash.replace(/^#/, '');
  const params = new URLSearchParams(hash);
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (access_token && refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({ access_token, refresh_token });
    if (sessionError) {
      return { error: sessionError as Error };
    }
    return { error: null };
  }

  return { error: new Error('Could not complete sign-in from redirect URL') };
}
