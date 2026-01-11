// Auth functionality removed — stubs remain so imports do not break.

export async function handleRedirectHash(): Promise<boolean> {
  return false;
}

export function persistSessionToLocalStorage(_session: any) { /* noop */ }
export function removePersistedSession() { /* noop */ }
export function subscribeAuthPersistence() { /* noop */ }

export async function initAuthFlow() {
  return false;
}

export async function signInWithGoogle() {
  throw new Error('Auth disabled in this branch');
}

export async function signOut() { /* noop */ }

export async function getSession() { return null; }
export async function getUser() { return null; }

export function onAuthStateChange(_cb: (event: string, session: any) => void) {
  return { data: null } as any;
}

export default {
  initAuthFlow,
  signInWithGoogle,
  signOut,
  getSession,
  onAuthStateChange,
};
