import { getSupabase } from './supabase';
import { storage } from './storage';

type MaybeSession = { access_token?: string; refresh_token?: string } | null;

function parseHashTokens(hash: string): MaybeSession {
  if (!hash) return null;
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  const params = new URLSearchParams(cleaned.replace(/^\/?/, ''));
  const access = params.get('access_token') || params.get('accessToken') || params.get('access-token');
  const refresh = params.get('refresh_token') || params.get('refreshToken') || params.get('refresh-token');
  if (access || refresh) return { access_token: access || '', refresh_token: refresh || '' };
  return null;
}

export async function handleRedirectHash(): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    // Try SDK helper first (some SDK versions provide getSessionFromUrl)
    try {
      if (typeof (supabase.auth as any).getSessionFromUrl === 'function') {
        const urlRes: any = await (supabase.auth as any).getSessionFromUrl();
        if (urlRes?.data?.session) {
          try { history.replaceState(null, '', window.location.pathname + window.location.search + '#/'); } catch (e) { /* noop */ }
          return true;
        }
      }
    } catch (e) {
      // ignore and fallback to manual parsing
    }

    // Manual parsing fallback: check both hash and querystring for tokens
    const tokens = parseHashTokens(hash) || parseHashTokens(search.replace(/^\?/, ''));
    if (!tokens) return false;
    const payload = { access_token: tokens.access_token || '', refresh_token: tokens.refresh_token || '' };
    try {
      const res = await supabase.auth.setSession(payload as any);
      // clean hash/search
      try { history.replaceState(null, '', window.location.pathname + window.location.search + '#/'); } catch (e) { /* noop */ }
      return !!(res as any)?.data?.session;
    } catch (e) {
      console.warn('DEBUG: setSession from hash failed', e);
      return false;
    }
  } catch (e) {
    console.warn('DEBUG: handleRedirectHash failed', e);
    return false;
  }
}

export function persistSessionToLocalStorage(session: any) {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const project = url ? new URL(url).hostname.split('.')[0] : 'supabase';
    const keyName = `sb-${project}-auth-token`;
    localStorage.setItem(keyName, JSON.stringify(session));
  } catch (e) { /* noop */ }
}

export function removePersistedSession() {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL as string;
    const project = url ? new URL(url).hostname.split('.')[0] : 'supabase';
    const keyName = `sb-${project}-auth-token`;
    localStorage.removeItem(keyName);
  } catch (e) { /* noop */ }
}

export function subscribeAuthPersistence() {
  try {
    const supabase = getSupabase();
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session && (session as any).user) {
        persistSessionToLocalStorage(session);
      } else {
        removePersistedSession();
      }
    });
  } catch (e) { /* noop */ }
}

export async function initAuthFlow() {
  const restored = await handleRedirectHash();
  subscribeAuthPersistence();
  return restored;
}

export async function signInWithGoogle() {
  try {
    const supabase = getSupabase();
    const redirectTo = window.location.origin + '/#/';
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (error) throw error;
  } catch (e) {
    console.warn('DEBUG: signInWithGoogle failed', e);
    throw e;
  }
}

export async function signOut() {
  try {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    removePersistedSession();
  } catch (e) {
    console.warn('DEBUG: signOut failed', e);
  }
}

export async function getSession() {
  try {
    const supabase = getSupabase();
    const r: any = await supabase.auth.getSession();
    try {
      console.debug('auth.getSession ->', JSON.stringify(r));
    } catch (e) {
      console.debug('auth.getSession -> (non-serializable)', r);
    }
    return r; // return full response so caller can inspect data and error
  } catch (e) {
    return null;
  }
}

export async function getUser() {
  try {
    const supabase = getSupabase();
    const r: any = await supabase.auth.getUser();
    try {
      console.debug('auth.getUser ->', JSON.stringify(r));
    } catch (e) {
      console.debug('auth.getUser -> (non-serializable)', r);
    }
    return r?.data?.user ?? null;
  } catch (e) {
    return null;
  }
}

export function onAuthStateChange(cb: (event: string, session: any) => void) {
  try {
    const supabase = getSupabase();
    return supabase.auth.onAuthStateChange(cb);
  } catch (e) {
    return { data: null } as any;
  }
}

export default {
  initAuthFlow,
  signInWithGoogle,
  signOut,
  getSession,
  onAuthStateChange,
};
