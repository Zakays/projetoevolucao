export interface AuditEntry {
  id: string;
  timestamp: string; // ISO
  command: any;
  result: any;
  actor?: string;
}

const AUDIT_KEY = 'glowup-audit-log';

const genId = () => {
  try { return (crypto as any).randomUUID(); } catch (e) { return 'a_' + Math.random().toString(36).slice(2,9); }
};

export function pushAudit(entry: Omit<AuditEntry, 'id' | 'timestamp'>) {
  try {
    const now = new Date().toISOString();
    const full: AuditEntry = { id: genId(), timestamp: now, ...entry } as AuditEntry;
    const raw = localStorage.getItem(AUDIT_KEY);
    const arr: AuditEntry[] = raw ? JSON.parse(raw) : [];
    arr.push(full);
    // keep last 200 entries to avoid huge storage
    const sliced = arr.slice(-200);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(sliced));
    return full;
  } catch (err) {
    console.warn('Failed pushing audit', err);
    return null;
  }
}

export function getAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

export function clearAuditLog() {
  try { localStorage.removeItem(AUDIT_KEY); return true; } catch (e) { return false; }
}
