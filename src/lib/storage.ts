import {
  AppData, Habit, HabitCompletion, DailyStats, MonthlyChart, UserSettings,
  StudyData, RecordsData, ExtendedAppData, Flashcard, QuizResult, Book,
  VocabularyWord, Course, StudyNote, PomodoroSession, InspirationQuote,
  UploadedFile, PhotoGallery, ProgressComparison, CommunityPost, FinancialEntry,
  BodyMeasurement, QuizQuestion, JournalEntry, AIMessage, Vice, ViceCompletion
} from '@/types';

// IndexedDB helpers for storing file blobs
import { saveUploadBlob, getUploadBlob, deleteUploadBlob } from '@/lib/idb';

// lightweight import for importData validation
import { ExtendedAppDataSchema } from '@/lib/schemas';
import { initSupabase, getSupabase } from './supabase';
import { saveData as saveDataRemote, loadData as loadDataRemote } from './persistence';

const STORAGE_KEY = 'glow-up-organizer-data';
const STORAGE_VERSION = '1.0.0';

// Safe ID generator: prefer crypto.randomUUID when available
const generateId = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch (e) {
    // ignore
  }
  return 'id_' + Math.random().toString(36).slice(2, 9);
};

// Dados padrão iniciais
const defaultSettings: UserSettings = {
  theme: 'system',
  soundEnabled: true,
  animationsEnabled: true,
  minimalMode: false,
  dailyMotivation: '',
  // AI defaults (empty by default)
  // Store only a list of API keys (one per line in settings)
  aiApiKeys: [],
  // Allow user to enable/disable the in-app AI chat
  aiChatEnabled: false,
  // Defaults for auto-generated motivation
  motivationTone: 'encorajador',
  motivationLength: 'short',
  notifications: {
    habitReminders: true,
    workoutReminders: true,
    journalReminders: true,
  },
  testsEnabled: false,
};

const defaultStudyData: StudyData = {
  flashcards: [],
  quizResults: [],
  quizQuestions: [],
  books: [],
  vocabulary: [],
  courses: [],
  studyNotes: [],
  pomodoroSessions: [],
  quotes: [],
};

const defaultRecordsData: RecordsData = {
  uploadedFiles: [],
  galleries: [],
  progressComparisons: [],
  communityPosts: [],
};

const defaultData: ExtendedAppData = {
  habits: [],
  habitCompletions: [],
  monthlyCharts: [],
  workouts: [],
  bodyMeasurements: [],
  journalEntries: [],
  goals: [],
  settings: defaultSettings,
  lastUpdated: new Date().toISOString(),
  version: STORAGE_VERSION,
  study: defaultStudyData,
  records: defaultRecordsData,
  finances: [],
  aiConversations: [],
  // Vices feature
  vices: [],
  viceCompletions: [],
};

// Utilitários de data
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const formatDateTime = (date: Date): string => {
  return date.toISOString();
};

export const parseDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

export const isToday = (dateString: string): boolean => {
  return dateString === formatDate(new Date());
};

export const getWeekDay = (dateString: string): number => {
  return parseDate(dateString).getDay();
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

// Gerenciamento de dados locais
export class LocalStorageManager {
  private static instance: LocalStorageManager;
  private data: ExtendedAppData;

  private midnightTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private midnightIntervalId: ReturnType<typeof setInterval> | null = null;

  private constructor() {
    this.data = this.loadData();
    this.setupMidnightReset();

    // run async migrations (non-blocking)
    this.runMigrations();

    // Attempt to restore data from remote Supabase (single-user) — do not block constructor
    // This will silently fallback to local data if the backend is not available
    this.loadFromRemote();

    // initialize sync queue and listeners
    try { this.loadSyncQueue(); } catch (e) { /* noop */ }
    try {
      // Process queue shortly after startup if online
      setTimeout(() => { try { this.processSyncQueue().catch(() => {}); } catch (e) {} }, 500);
      if (typeof window !== 'undefined') {
        window.addEventListener('online', async () => {
          try {
            await this.processSyncQueue();
            await this.pullFromServer(true);
          } catch (e) {}
        });
        // visibility change: we'll adjust polling when app goes to background/foreground
        try {
          document.addEventListener('visibilitychange', () => { try { this.onVisibilityChange(); } catch (e) {} });
        } catch (e) { /* noop */ }
      }

      // Initialize polling for remote changes (adaptive frequency)
      try { this.setupPolling(); } catch (e) { /* noop */ }
    } catch (e) {
      // noop
    }
  }

  public static getInstance(): LocalStorageManager {
    if (!LocalStorageManager.instance) {
      LocalStorageManager.instance = new LocalStorageManager();
    }
    return LocalStorageManager.instance;
  }

  // Public accessor for tests and debug (implemented later to return a shallow copy)
  // (removed duplicate implementation)

  private loadData(): ExtendedAppData {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migração de versão se necessário
        return { ...defaultData, ...parsed, version: STORAGE_VERSION };
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
    return { ...defaultData };
  }

  // Run background migrations (non-blocking)
  private async runMigrations(): Promise<void> {
    try {
      await this.migratePreviewUrlsToIdb();
    } catch (err) {
      console.error('Migration error:', err);
    }
  }

  // Convert any data-URL `previewUrl` stored in uploadedFiles into binary blobs in IndexedDB
  private async migratePreviewUrlsToIdb(): Promise<void> {
    const files = this.data.records?.uploadedFiles || [];
    let madeChanges = false;

    for (const f of files) {
      const preview = (f as any).previewUrl;
      if (preview && typeof preview === 'string' && preview.startsWith('data:')) {
        try {
          const blob = this.dataURLToBlob(preview);
          // store blob in idb under the file id (generate if missing)
          if (!f.id) {
            (f as any).id = generateId();
          }
          await saveUploadBlob(f.id, blob);
          // Remove the heavy data URL from stored metadata
          delete (f as any).previewUrl;
          madeChanges = true;
        } catch (err) {
          console.error('Failed converting preview for file', f.filename, err);
        }
      }
    }

    if (madeChanges) this.saveData();
  }

  private dataURLToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const meta = parts[0];
    const base64 = parts[1];
    const mimeMatch = meta.match(/data:(.*);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const binary = atob(base64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8[i] = binary.charCodeAt(i);
    }
    return new Blob([u8], { type: mime });
  }

  // --- Sync queue implementation (offline-first) ---
  // Simple mutation queue persisted to localStorage. We enqueue a "snapshot"
  // of the latest app data (coalesced) and attempt to push it to the server
  // when online. This keeps the implementation minimal while enabling
  // reliable offline writes (habits, completions, etc.).

  private SYNC_QUEUE_KEY = STORAGE_KEY + ':syncQueue';

  private syncQueue: Array<{ id: string; type: 'snapshot'; payload: any; retries: number; status: 'pending' | 'in-flight' | 'failed' | 'done'; createdAt: string }> = [];
  private processingSync = false;

  private loadSyncQueue(): void {
    try {
      const raw = localStorage.getItem(this.SYNC_QUEUE_KEY);
      if (!raw) {
        this.syncQueue = [];
        return;
      }
      this.syncQueue = JSON.parse(raw);
    } catch (err) {
      this.syncQueue = [];
    }
  }

  private saveSyncQueue(): void {
    try {
      localStorage.setItem(this.SYNC_QUEUE_KEY, JSON.stringify(this.syncQueue));
      try {
        window.dispatchEvent(new CustomEvent('glowup:sync-status', { detail: { status: this.getSyncStatus(), queueLength: this.syncQueue.length } }));
      } catch (e) { /* noop */ }
    } catch (err) {
      console.error('Failed to persist sync queue', err);
    }
  }

  private enqueueSnapshot(): void {
    const op = {
      id: generateId(),
      type: 'snapshot' as const,
      payload: { data: { ...this.data }, createdAt: new Date().toISOString() },
      retries: 0,
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
    };

    // Coalesce: if there's already a pending snapshot, replace it with the new one
    const existingIndex = this.syncQueue.findIndex(q => q.type === 'snapshot' && q.status === 'pending');
    if (existingIndex !== -1) {
      this.syncQueue[existingIndex] = op;
    } else {
      this.syncQueue.push(op);
    }
    this.saveSyncQueue();
  }

  public getSyncQueue(): any[] {
    return [...this.syncQueue];
  }

  private getSyncStatus(): 'idle' | 'pending' | 'syncing' | 'failed' {
    if (this.syncQueue.length === 0) return 'idle';
    if (this.syncQueue.some(q => q.status === 'in-flight')) return 'syncing';
    if (this.syncQueue.some(q => q.status === 'failed')) return 'failed';
    return 'pending';
  }

  public async processSyncQueue(): Promise<void> {
    if (this.processingSync) return;
    this.processingSync = true;
    try {
      this.loadSyncQueue();

      if (this.syncQueue.length === 0) return;
      if (typeof navigator !== 'undefined' && !navigator.onLine) return; // wait until online

      // Process in FIFO order
      while (this.syncQueue.length > 0) {
        const op = this.syncQueue[0];
        if (!op) break;

        // Ensure we're online
        if (typeof navigator !== 'undefined' && !navigator.onLine) break;

        op.status = 'in-flight';
        this.saveSyncQueue();

        try {
          if (op.type === 'snapshot') {
            const success = await saveDataRemote(STORAGE_KEY, op.payload.data);
            if (success) {
              // remove op
              this.syncQueue.shift();
            } else {
              // remote save failed (likely network) — retry later
              op.retries = (op.retries || 0) + 1;
              op.status = op.retries >= 3 ? 'failed' : 'pending';

              // push to end if still pending to avoid tight loops
              this.syncQueue.shift();
              if (op.status === 'pending') this.syncQueue.push(op);
            }
          }
        } catch (err) {
          // On exception, increment retries and push to end
          op.retries = (op.retries || 0) + 1;
          op.status = op.retries >= 3 ? 'failed' : 'pending';
          this.syncQueue.shift();
          if (op.status === 'pending') this.syncQueue.push(op);
        }

        this.saveSyncQueue();

        // Small delay between attempts to avoid flooding
        await new Promise(res => setTimeout(res, 200));
      }
    } finally {
      this.processingSync = false;
      this.saveSyncQueue();
    }
  }

  public async forceSyncNow(): Promise<void> {
    // Helper to force sync immediately (used by UI/tests)
    await this.processSyncQueue();
  }

  // --- Polling for remote changes (fallback when realtime not available) ---
  private pollingIntervalMs: number = Math.max(1000, Number(import.meta.env.VITE_POLL_INTERVAL_MS || 2000));
  private pollingTimer: ReturnType<typeof setInterval> | null = null;
  private pollingHiddenIntervalMs = 30_000; // slower interval when page is hidden

  private setupPolling(): void {
    try {
      // ensure we have a reasonable minimum
      this.pollingIntervalMs = Math.max(1000, Number(import.meta.env.VITE_POLL_INTERVAL_MS || 2000));
      // start polling behavior (only in window env)
      if (typeof window === 'undefined') return;
      // start when online
      if (typeof navigator !== 'undefined' && navigator.onLine) this.startPolling();

      // adjust polling when going online/offline
      try {
        window.addEventListener('online', () => { try { this.startPolling(); } catch (e) {} });
        window.addEventListener('offline', () => { try { this.stopPolling(); } catch (e) {} });
      } catch (e) { /* noop */ }
    } catch (e) {
      // noop
    }
  }

  // backoff/failure tracking
  private consecutivePollFailures = 0;
  private maxFailuresBeforeBackoff = 3;
  private backoffMultiplier = 2;

  public startPolling(): void {
    try {
      if (this.pollingTimer) {
        clearTimeout(this.pollingTimer as any);
        this.pollingTimer = null;
      }

      if (typeof navigator !== 'undefined' && !navigator.onLine) return;

      const interval = (typeof document !== 'undefined' && document.hidden) ? this.pollingHiddenIntervalMs : this.pollingIntervalMs;

      // run an immediate pull so UI gets up-to-date quickly
      (async () => {
        try {
          if (typeof navigator === 'undefined' || navigator.onLine) {
            const ok = await this.pullFromServer(false);
            if (ok) {
              this.consecutivePollFailures = 0;
            } else {
              this.consecutivePollFailures++;
            }
          }
        } catch (e) {
          this.consecutivePollFailures++;
        }
      })();

      // polling loop using setTimeout to allow dynamic intervals/backoff
      const pollLoop = async () => {
        try {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            // schedule retry later
            this.pollingTimer = setTimeout(pollLoop, Math.max(1000, this.pollingHiddenIntervalMs));
            return;
          }

          // apply lightweight backoff if failures accumulate
          let effectiveInterval = interval;
          if (this.consecutivePollFailures >= this.maxFailuresBeforeBackoff) {
            effectiveInterval = Math.min(60_000, interval * Math.pow(this.backoffMultiplier, this.consecutivePollFailures - this.maxFailuresBeforeBackoff + 1));
          }

          const ok = await this.pullFromServer(false);
          if (ok) {
            this.consecutivePollFailures = 0;
          } else {
            this.consecutivePollFailures++;
          }

          this.pollingTimer = setTimeout(pollLoop, Math.max(1000, effectiveInterval));
        } catch (e) {
          this.consecutivePollFailures++;
          this.pollingTimer = setTimeout(pollLoop, Math.max(1000, interval * this.backoffMultiplier));
        }
      };

      // start loop
      this.pollingTimer = setTimeout(pollLoop, Math.max(1000, interval));
    } catch (e) {
      // noop
    }
  }

  public stopPolling(): void {
    try {
      if (this.pollingTimer) {
        clearTimeout(this.pollingTimer as any);
        this.pollingTimer = null;
      }
    } catch (e) { /* noop */ }
  }

  public setPollIntervalMs(ms: number): void {
    this.pollingIntervalMs = Math.max(1000, Math.floor(ms));
    // restart with new interval
    try { this.startPolling(); } catch (e) { /* noop */ }
  }

  private onVisibilityChange(): void {
    try {
      // restart polling with different interval when hidden/visible
      if (typeof document === 'undefined') return;
      if (document.hidden) {
        // slow down
        this.stopPolling();
        this.pollingTimer = setInterval(async () => {
          try { if (typeof navigator === 'undefined' || !navigator.onLine) return; await this.pullFromServer(false); } catch (e) {}
        }, this.pollingHiddenIntervalMs);
      } else {
        // resume default frequency
        this.startPolling();
      }
    } catch (e) {
      // noop
    }
  }

  /**
   * Pull data from remote storage and merge/replace local data.
   * If `force` is true, remote data replaces local data unconditionally.
   * Otherwise, remote data will replace local data only when remote.lastUpdated is newer.
   */
  public async pullFromServer(force = false): Promise<boolean> {
    try {
      const remote = await loadDataRemote(STORAGE_KEY);
      if (!remote || typeof remote !== 'object') return false;

      // If force => replace unconditionally
      if (force) {
        this.data = { ...defaultData, ...remote, version: STORAGE_VERSION } as ExtendedAppData;
        if (remote.study) this.data.study = { ...defaultStudyData, ...remote.study };
        if (remote.records) this.data.records = { ...defaultRecordsData, ...remote.records };
        this.saveData();
        try { window.dispatchEvent(new CustomEvent('glowup:remote-updated', { detail: { force: true, updatedAt: remote.lastUpdated ?? remote.updated_at } })); } catch (e) { }
        return true;
      }

      // Conservative replace: if remote lastUpdated is newer, replace local
      const remoteUpdated = remote && remote.lastUpdated ? new Date(remote.lastUpdated).getTime() : (remote && remote.updated_at ? new Date(remote.updated_at).getTime() : 0);
      const localUpdated = this.data && this.data.lastUpdated ? new Date(this.data.lastUpdated).getTime() : 0;

      // Debug hook: emit poll result so UI/tests can observe poll attempts
      try {
        try { console.debug('poll result', { key: STORAGE_KEY, remoteUpdated, localUpdated, remoteUpdatedRaw: remote.updated_at ?? remote.lastUpdated, remoteSnapshot: remote }); } catch (e) {}
        try { window.dispatchEvent(new CustomEvent('glowup:poll-result', { detail: { key: STORAGE_KEY, remoteUpdated, localUpdated, updated: remoteUpdated > localUpdated } })); } catch (e) {}
      } catch (e) {
        // noop
      }

      if (remoteUpdated > localUpdated) {
        this.data = { ...defaultData, ...remote, version: STORAGE_VERSION } as ExtendedAppData;
        if (remote.study) this.data.study = { ...defaultStudyData, ...remote.study };
        if (remote.records) this.data.records = { ...defaultRecordsData, ...remote.records };
        this.saveData();
        try { window.dispatchEvent(new CustomEvent('glowup:remote-updated', { detail: { force: false, updatedAt: remote.lastUpdated ?? remote.updated_at } })); } catch (e) { }
        return true;
      }

      return false;
    } catch (err) {
      console.error('pullFromServer failed', err);
      return false;
    }
  }

  private saveData(): void {
    try {
      this.data.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
      try {
        // Notify UI about data change so components can refresh
        window.dispatchEvent(new CustomEvent('glowup:data-changed'));
      } catch (e) {
        // noop in non-window environments
      }

      // Enqueue a snapshot for remote sync (coalesced)
      try {
        this.enqueueSnapshot();
      } catch (e) {
        // ignore enqueue failures
      }

      // If we're online, attempt to process the queue immediately (non-blocking)
      try {
        if (typeof navigator === 'undefined' || navigator.onLine) {
          this.processSyncQueue().catch(() => {});
        }
      } catch (e) {
        // ignore
      }
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
    }
  }

  // AI conversation helpers
  public getAIConversations(): AIMessage[] {
    return this.data.aiConversations ? [...this.data.aiConversations] : [];
  }

  public addAIMessage(msg: AIMessage): void {
    if (!this.data.aiConversations) this.data.aiConversations = [];
    this.data.aiConversations.push({ ...msg, createdAt: msg.createdAt || new Date().toISOString() });
    this.saveData();
  }

  public setAIConversations(messages: AIMessage[]): void {
    this.data.aiConversations = messages.map(m => ({ ...m, createdAt: m.createdAt || new Date().toISOString() }));
    this.saveData();
  }

  // Vices: manage vices and per-day completions
  public getVices(): Vice[] {
    return this.data.vices ? [...this.data.vices] : [];
  }

  public addVice(vice: Omit<Vice, 'id' | 'createdAt' | 'streak'>): Vice {
    const newVice: Vice = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      streak: 0,
      ...vice,
    } as Vice;
    if (!this.data.vices) this.data.vices = [];
    this.data.vices.push(newVice);
    this.saveData();
    return newVice;
  }

  public updateVice(id: string, updates: Partial<Vice>): boolean {
    if (!this.data.vices) return false;
    const idx = this.data.vices.findIndex(v => v.id === id);
    if (idx === -1) return false;
    this.data.vices[idx] = { ...this.data.vices[idx], ...updates };
    this.saveData();
    return true;
  }

  public deleteVice(id: string): boolean {
    if (!this.data.vices) return false;
    const before = this.data.vices.length;
    this.data.vices = this.data.vices.filter(v => v.id !== id);
    if (this.data.viceCompletions) {
      this.data.viceCompletions = this.data.viceCompletions.filter(c => c.viceId !== id);
    }
    this.saveData();
    return this.data.vices.length < before;
  }

  public getViceCompletions(viceId?: string): ViceCompletion[] {
    if (!this.data.viceCompletions) return [];
    return viceId ? this.data.viceCompletions.filter(c => c.viceId === viceId) : [...this.data.viceCompletions];
  }

  // Toggle a day's status: cycle/create/update/remove. Date expected YYYY-MM-DD
  public toggleViceDay(viceId: string, status: ViceCompletion['status'], date?: string, note?: string): boolean {
    const day = date ?? formatDate(new Date());
    if (!this.data.viceCompletions) this.data.viceCompletions = [];
    const existingIdx = this.data.viceCompletions.findIndex(c => c.viceId === viceId && c.date === day);
    if (existingIdx === -1) {
      const newEntry: ViceCompletion = { id: generateId(), viceId, date: day, status, note, recordedAt: new Date().toISOString() };
      this.data.viceCompletions.push(newEntry);
      this.updateViceStreak(viceId);
      this.saveData();
      return true;
    }

    const existing = this.data.viceCompletions[existingIdx];
    if (existing.status === status) {
      // toggle off
      this.data.viceCompletions.splice(existingIdx, 1);
      this.updateViceStreak(viceId);
      this.saveData();
      return true;
    }

    // update status
    this.data.viceCompletions[existingIdx] = { ...existing, status, note, recordedAt: new Date().toISOString() };
    this.updateViceStreak(viceId);
    this.saveData();
    return true;
  }

  // Return map date -> status for the given month (YYYY-MM)
  public getViceCalendarData(viceId: string, month?: string): Record<string, ViceCompletion['status']> {
    const res: Record<string, ViceCompletion['status']> = {};
    const comps = this.getViceCompletions(viceId);
    const prefix = month ? month + '-' : '';
    for (const c of comps) {
      if (!month || c.date.startsWith(month)) {
        res[c.date] = c.status;
      }
    }
    return res;
  }

  public getViceStreak(viceId: string): number {
    const vice = this.data.vices?.find(v => v.id === viceId);
    if (!vice) return 0;
    return vice.streak || 0;
  }

  private updateViceStreak(viceId: string): void {
    // Calculate consecutive clean days up to today
    const comps = (this.data.viceCompletions || []).filter(c => c.viceId === viceId);
    const compMap = new Map<string, ViceCompletion['status']>();
    for (const c of comps) compMap.set(c.date, c.status);

    let count = 0;

    // If there is any recorded relapse, consider the streak broken (strict semantics)
    if (comps.some(c => c.status === 'relapse')) {
      // explicit reset to 0
      count = 0;
    } else {
      let countLocal = 0;
      let day = new Date();
      while (true) {
        const dayStr = formatDate(day);
        const status = compMap.get(dayStr);
        if (status === 'clean') {
          countLocal++;
        } else {
          break;
        }
        // previous day
        day.setDate(day.getDate() - 1);
      }
      count = countLocal;
    }

    const idx = this.data.vices?.findIndex(v => v.id === viceId) ?? -1;
    if (idx !== -1 && this.data.vices) {
      this.data.vices[idx].streak = count;
      this.saveData();
    }
  }

  // Reset diário à meia-noite
  private setupMidnightReset(): void {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    this.midnightTimeoutId = setTimeout(() => {
      this.performMidnightReset();
      // Configurar reset diário
      this.midnightIntervalId = setInterval(() => {
        this.performMidnightReset();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  private performMidnightReset(): void {
    const today = formatDate(new Date());
    const currentMonth = getCurrentMonth();

    // Ensure current month chart exists (important at month boundary)
    if (!this.data.monthlyCharts.find(c => c.month === currentMonth)) {
      this.data.monthlyCharts.push(this.createMonthlyChart(currentMonth));
    }

    // Atualizar estatísticas do dia anterior (these stats will be saved into the month of that day)
    this.updateDailyStats();

    this.saveData();
  }

  private updateDailyStats(): void {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatDate(yesterday);
    
    const todayHabits = this.getTodayHabits(yesterdayStr);
    const completions = this.getHabitCompletions(yesterdayStr);
    
    const totalHabits = todayHabits.length;
    const completedHabits = completions.filter(c => c.status === 'completed').length;
    const totalPoints = todayHabits.reduce((sum, habit) => sum + habit.weight, 0);
    const earnedPoints = completions
      .filter(c => c.status === 'completed')
      .reduce((sum, completion) => {
        const habit = todayHabits.find(h => h.id === completion.habitId);
        return sum + (habit?.weight || 0);
      }, 0);
    
    const stats: DailyStats = {
      date: yesterdayStr,
      totalHabits,
      completedHabits,
      totalPoints,
      earnedPoints,
      percentage: totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0,
    };
    
    // Adicionar às estatísticas do mês do dia (yesterday), não necessariamente do mês atual
    const targetMonth = yesterdayStr.substring(0, 7); // YYYY-MM of yesterday
    let monthlyChart = this.data.monthlyCharts.find(chart => chart.month === targetMonth);
    
    if (!monthlyChart) {
      monthlyChart = this.createMonthlyChart(targetMonth);
      this.data.monthlyCharts.push(monthlyChart);
    }
    
    // Remover estatística existente do dia e adicionar a nova
    monthlyChart.dailyStats = monthlyChart.dailyStats.filter(s => s.date !== yesterdayStr);
    monthlyChart.dailyStats.push(stats);
    monthlyChart.dailyStats.sort((a, b) => a.date.localeCompare(b.date));
    
    this.updateMonthlyChartSummary(monthlyChart);
  }

  private createNewMonthlyChart(): void {
    const currentMonth = getCurrentMonth();
    const newChart = this.createMonthlyChart(currentMonth);
    this.data.monthlyCharts.push(newChart);
  }

  private createMonthlyChart(month: string): MonthlyChart {
    return {
      month,
      dailyStats: [],
      averagePerformance: 0,
      bestDay: '',
      worstDay: '',
      totalDays: 0,
      completedDays: 0,
    };
  }

  private updateMonthlyChartSummary(chart: MonthlyChart): void {
    const stats = chart.dailyStats;
    if (stats.length === 0) return;
    
    chart.totalDays = stats.length;
    chart.completedDays = stats.filter(s => s.percentage >= 80).length;
    chart.averagePerformance = Math.round(
      stats.reduce((sum, s) => sum + s.percentage, 0) / stats.length
    );
    
    const sortedByPerformance = [...stats].sort((a, b) => b.percentage - a.percentage);
    chart.bestDay = sortedByPerformance[0]?.date || '';
    chart.worstDay = sortedByPerformance[sortedByPerformance.length - 1]?.date || '';
  }

  /**
   * Reset storage internals for tests: clears data and cancels scheduled timers.
   */
  public resetForTests(): void {
    this.data = { ...defaultData };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // noop
    }

    if (this.midnightTimeoutId) {
      try { clearTimeout(this.midnightTimeoutId as any); } catch (e) { /* noop */ }
      this.midnightTimeoutId = null;
    }

    if (this.midnightIntervalId) {
      try { clearInterval(this.midnightIntervalId as any); } catch (e) { /* noop */ }
      this.midnightIntervalId = null;
    }
  }

  // Métodos públicos para gerenciar dados
  public getData(): ExtendedAppData {
    return { ...this.data };
  }

  public exportData(): string {
    return JSON.stringify(this.data, null, 2);
  }

  public importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      // Basic shape validation (no heavy zod for now—simplify)
      if (imported && typeof imported === 'object') {
        // OK—looks like an object
      } else {
        console.error('Import validation failed: expected object');
        return false;
      }

      this.data = { ...defaultData, ...imported, version: STORAGE_VERSION };

      // Deep-merge nested study section to ensure missing arrays fall back to defaults
      if (imported.study) {
        this.data.study = { ...defaultStudyData, ...imported.study };
      }

      this.saveData();
      return true;
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return false;
    }
  }

  // Attempt to load persisted app data from remote Supabase (single-user key)
  // This silently falls back to local storage if the server is unreachable
  private async loadFromRemote(): Promise<void> {
    try {
      const remote = await loadDataRemote(STORAGE_KEY);
      if (remote && typeof remote === 'object') {
        this.data = { ...defaultData, ...remote, version: STORAGE_VERSION };
        if (remote.study) this.data.study = { ...defaultStudyData, ...remote.study };
        if (remote.records) this.data.records = { ...defaultRecordsData, ...remote.records };
        this.saveData();
      }
    } catch (err) {
      // silent fallback to local-only mode
    }
  }

  // Métodos para hábitos
  public getHabits(): Habit[] {
    return [...this.data.habits];
  }

  public addHabit(habit: Omit<Habit, 'id' | 'createdAt' | 'streak'>): Habit {
    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      createdAt: formatDateTime(new Date()),
      streak: 0,
    };
    
    this.data.habits.push(newHabit);
    this.saveData();
    return newHabit;
  }

  public updateHabit(id: string, updates: Partial<Habit>): boolean {
    const index = this.data.habits.findIndex(h => h.id === id);
    if (index === -1) return false;
    
    this.data.habits[index] = { ...this.data.habits[index], ...updates };
    this.saveData();
    return true;
  }

  public deleteHabit(id: string): boolean {
    const index = this.data.habits.findIndex(h => h.id === id);
    if (index === -1) return false;
    
    this.data.habits.splice(index, 1);
    // Remover completions relacionados
    this.data.habitCompletions = this.data.habitCompletions.filter(c => c.habitId !== id);
    this.saveData();
    return true;
  }

  public getTodayHabits(date?: string): Habit[] {
    const targetDate = date || formatDate(new Date());
    const weekDay = getWeekDay(targetDate);
    
    return this.data.habits.filter(habit => 
      habit.daysOfWeek.includes(weekDay)
    );
  }

  // Métodos para completions de hábitos
  public getHabitCompletions(date?: string): HabitCompletion[] {
    const targetDate = date || formatDate(new Date());
    return this.data.habitCompletions.filter(c => c.date === targetDate);
  }

  public completeHabit(habitId: string, status: HabitCompletion['status'], justification?: string): boolean {
    const today = formatDate(new Date());
    const existingIndex = this.data.habitCompletions.findIndex(
      c => c.habitId === habitId && c.date === today
    );
    
    const completion: HabitCompletion = {
      id: existingIndex >= 0 ? this.data.habitCompletions[existingIndex].id : generateId(),
      habitId,
      date: today,
      status,
      justification,
      completedAt: status === 'completed' ? formatDateTime(new Date()) : undefined,
    };
    
    if (existingIndex >= 0) {
      this.data.habitCompletions[existingIndex] = completion;
    } else {
      this.data.habitCompletions.push(completion);
    }
    
    // Atualizar streak
    this.updateHabitStreak(habitId);
    this.saveData();
    return true;
  }

  private updateHabitStreak(habitId: string): void {
    const habit = this.data.habits.find(h => h.id === habitId);
    if (!habit) return;
    
    const completions = this.data.habitCompletions
      .filter(c => c.habitId === habitId)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    let streak = 0;
    const today = formatDate(new Date());
    
    for (let i = 0; i < completions.length; i++) {
      const completion = completions[i];
      const expectedDate = new Date();
      expectedDate.setDate(expectedDate.getDate() - i);
      const expectedDateStr = formatDate(expectedDate);
      
      if (completion.date !== expectedDateStr) break;
      
      if (completion.status === 'completed' || completion.status === 'justified') {
        streak++;
      } else {
        break;
      }
    }
    
    habit.streak = streak;
    if (completions.length > 0 && completions[0].status === 'completed') {
      habit.lastCompleted = completions[0].date;
    }
  }

  // Métodos para estatísticas
  public getDailyStats(date?: string): DailyStats | null {
    const targetDate = date || formatDate(new Date());
    const currentMonth = targetDate.substring(0, 7); // YYYY-MM
    
    const monthlyChart = this.data.monthlyCharts.find(chart => chart.month === currentMonth);
    return monthlyChart?.dailyStats.find(stats => stats.date === targetDate) || null;
  }

  public getMonthlyChart(month?: string): MonthlyChart | null {
    const targetMonth = month || getCurrentMonth();
    return this.data.monthlyCharts.find(chart => chart.month === targetMonth) || null;
  }

  public getAllMonthlyCharts(): MonthlyChart[] {
    return [...this.data.monthlyCharts].sort((a, b) => b.month.localeCompare(a.month));
  }

  // Métodos para Body Measurements
  public getBodyMeasurements(): BodyMeasurement[] {
    return [...this.data.bodyMeasurements];
  }

  public addBodyMeasurement(measurement: Omit<BodyMeasurement, 'id' | 'createdAt' | 'updatedAt'>): BodyMeasurement {
    const now = formatDateTime(new Date());
    const newMeasurement: BodyMeasurement = {
      ...measurement,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.data.bodyMeasurements = this.data.bodyMeasurements || [];
    this.data.bodyMeasurements.push(newMeasurement);
    this.saveData();
    return newMeasurement;
  }

  public updateBodyMeasurement(id: string, updates: Partial<BodyMeasurement>): boolean {
    const index = this.data.bodyMeasurements.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.data.bodyMeasurements[index] = { ...this.data.bodyMeasurements[index], ...updates, updatedAt: formatDateTime(new Date()) };
    this.saveData();
    return true;
  }

  public deleteBodyMeasurement(id: string): boolean {
    const index = this.data.bodyMeasurements.findIndex(m => m.id === id);
    if (index === -1) return false;

    this.data.bodyMeasurements.splice(index, 1);
    this.saveData();
    return true;
  }

  // Métodos para configurações
  public getSettings(): UserSettings {
    return { ...this.data.settings };
  }

  public updateSettings(updates: Partial<UserSettings>): void {
    this.data.settings = { ...this.data.settings, ...updates };
    this.saveData();
    try {
      // Notify any listeners (pages/components) about settings change.
      // Defer dispatch to the next tick to avoid updating other components while
      // the current component is still rendering (avoids React "setState in render" warnings).
      setTimeout(() => {
        try {
          window.dispatchEvent(new CustomEvent('glowup:settings-changed', { detail: this.data.settings }));
          if (typeof console !== 'undefined' && typeof console.debug === 'function') {
            try { console.debug('storage.updateSettings: dispatched glowup:settings-changed', updates, this.data.settings); } catch (e) { /* noop */ }
          }
        } catch (err) {
          // noop - environments without window might throw
        }
      }, 0);
    } catch (e) {
      // noop - environments without window might throw
    }
  }

  /* Remote sync helpers (Supabase)
   * Usage: call initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY) once on app startup
   */
  public async backupToSupabase(_userId?: string): Promise<boolean> {
    try {
      // Use server API which performs an upsert into user_data (service role key)
      const ok = await saveDataRemote(STORAGE_KEY, this.data);
      return !!ok;
    } catch (err) {
      console.error('backupToSupabase failed', err);
      return false;
    }
  }

  public async restoreFromSupabase(_userId?: string): Promise<boolean> {
    try {
      const remote = await loadDataRemote(STORAGE_KEY);
      if (!remote || typeof remote !== 'object') return false;

      // Use conservative merge: replace if remote is newer
      const remoteUpdated = remote && remote.lastUpdated ? new Date(remote.lastUpdated).getTime() : 0;
      const localUpdated = this.data && this.data.lastUpdated ? new Date(this.data.lastUpdated).getTime() : 0;
      if (remoteUpdated > localUpdated) {
        this.data = { ...defaultData, ...remote, version: STORAGE_VERSION } as ExtendedAppData;
        if (remote.study) this.data.study = { ...defaultStudyData, ...remote.study };
        if (remote.records) this.data.records = { ...defaultRecordsData, ...remote.records };
        this.saveData();
        return true;
      }
      return false;
    } catch (err) {
      console.error('restoreFromSupabase failed', err);
      return false;
    }
  }

  /**
   * Subscribe to Supabase realtime changes on the `user_data` table for the single-user key.
   * When a remote change occurs we pull from the server and replace local data when appropriate.
   */
  public subscribeToRealtime(): void {
    try {
      const supabase = getSupabase();
      if (!supabase) return;

      const channel = (supabase as any)
        .channel('public:user_data')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_data', filter: `key=eq.${STORAGE_KEY}` }, (_payload: any) => {
          // Pull remote data and apply if newer
          try { this.pullFromServer(true).catch(() => {}); } catch (e) { /* noop */ }
        })
        .subscribe();

      // store reference so we can unsubscribe later if needed
      (this as any)._supabaseChannel = channel;
    } catch (err) {
      // supabase not initialized or not available
    }
  }

  /**
   * Clear user-specific local data (habits, completions, ai conversations, etc.).
   * Keeps app-level defaults and settings structure.
   */
  public clearLocalUserData(): void {
    this.data.habits = [];
    this.data.habitCompletions = [];
    this.data.monthlyCharts = [];
    this.data.workouts = [];
    this.data.bodyMeasurements = [];
    this.data.journalEntries = [];
    this.data.goals = [];
    this.data.study = { ...defaultStudyData };
    this.data.records = { ...defaultRecordsData };
    this.data.finances = [];
    this.data.aiConversations = [];
    this.saveData();
  }

  /**
   * Remove completamente os dados locais (apaga a chave no localStorage)
   * e reinicia o objeto de dados para os defaults.
   */
  public clearAllLocalData(): void {
    try {
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
      this.data = { ...defaultData } as ExtendedAppData;
      // ensure settings fallback
      this.data.settings = { ...defaultSettings };
      try {
        window.dispatchEvent(new CustomEvent('glowup:data-changed'));
      } catch (e) { /* noop */ }
    } catch (e) {
      console.error('Failed to clear all local data', e);
    }
  }

  // Métodos para funcionalidades de estudo
  public getFlashcards(): Flashcard[] {
    return [...this.data.study.flashcards];
  }

  public getDueFlashcards(date?: string): Flashcard[] {
    const target = date || formatDate(new Date());
    return this.data.study.flashcards.filter(f => {
      if (!f.nextReview) return true;
      return f.nextReview <= target;
    });
  }

  public addFlashcard(flashcard: Omit<Flashcard, 'id' | 'createdAt' | 'lastReviewed' | 'nextReview' | 'interval' | 'ease' | 'streak'>): Flashcard {
    const now = formatDateTime(new Date());
    const newFlashcard: Flashcard = {
      ...flashcard,
      id: generateId(),
      createdAt: now,
      lastReviewed: now,
      nextReview: formatDate(new Date()),
      interval: 1,
      ease: 2.5,
      streak: 0,
    };
    
    this.data.study.flashcards.push(newFlashcard);
    this.saveData();
    return newFlashcard;
  }

  public updateFlashcard(id: string, updates: Partial<Flashcard>): boolean {
    const index = this.data.study.flashcards.findIndex(f => f.id === id);
    if (index === -1) return false;
    
    this.data.study.flashcards[index] = { ...this.data.study.flashcards[index], ...updates };
    this.saveData();
    return true;
  }

  public scheduleReviewResult(id: string, result: 'again' | 'hard' | 'good' | 'easy'): boolean {
    const index = this.data.study.flashcards.findIndex(f => f.id === id);
    if (index === -1) return false;

    const card = this.data.study.flashcards[index];
    const now = new Date();

    let interval = card.interval || 1;
    let ease = card.ease || 2.5;
    let streak = card.streak || 0;

    switch (result) {
      case 'again':
        interval = 1;
        ease = Math.max(1.3, (ease || 2.5) - 0.25);
        streak = 0;
        break;
      case 'hard':
        interval = Math.max(1, Math.floor((card.interval || 1) * 1.2));
        ease = Math.max(1.3, (ease || 2.5) - 0.15);
        streak = 0;
        break;
      case 'good':
        interval = Math.max(1, Math.floor((card.interval || 1) * (ease || 2.5)));
        // ease unchanged
        streak = (streak || 0) + 1;
        break;
      case 'easy':
        interval = Math.max(1, Math.floor((card.interval || 1) * (ease || 2.5) * 2.5));
        ease = Math.min(4.0, (ease || 2.5) + 0.15);
        streak = (streak || 0) + 1;
        break;
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval);

    card.lastReviewed = now.toISOString();
    card.nextReview = nextReview.toISOString().split('T')[0];
    card.interval = interval;
    card.ease = ease;
    card.streak = streak;

    this.data.study.flashcards[index] = card;
    this.saveData();
    return true;
  }

  public getBooks(): Book[] {
    return [...this.data.study.books];
  }

  public addBook(book: Omit<Book, 'id'>): Book {
    const newBook: Book = {
      ...book,
      id: generateId(),
    };
    
    this.data.study.books.push(newBook);
    this.saveData();
    return newBook;
  }

  public updateBook(id: string, updates: Partial<Book>): boolean {
    const index = this.data.study.books.findIndex(b => b.id === id);
    if (index === -1) return false;
    
    this.data.study.books[index] = { ...this.data.study.books[index], ...updates };
    this.saveData();
    return true;
  }

  public deleteBook(id: string): boolean {
    const index = this.data.study.books.findIndex(b => b.id === id);
    if (index === -1) return false;

    this.data.study.books.splice(index, 1);
    this.saveData();
    return true;
  }

  // Métodos para Quiz (perguntas e resultados)
  public getQuizQuestions(): QuizQuestion[] {
    return [...(this.data.study.quizQuestions || [])];
  }

  public addQuizQuestion(question: Omit<QuizQuestion, 'id' | 'createdAt'>): QuizQuestion {
    const now = formatDateTime(new Date());
    const newQuestion: QuizQuestion = {
      ...question,
      id: generateId(),
      createdAt: now,
    };

    // ensure array exists
    (this.data.study as any).quizQuestions = this.data.study?.quizQuestions || [];
    (this.data.study as any).quizQuestions.push(newQuestion);
    this.saveData();
    return newQuestion;
  }

  public updateQuizQuestion(id: string, updates: Partial<QuizQuestion>): boolean {
    const arr = (this.data.study as any).quizQuestions || [];
    const index = arr.findIndex((q: QuizQuestion) => q.id === id);
    if (index === -1) return false;
    arr[index] = { ...arr[index], ...updates };
    this.saveData();
    return true;
  }

  public deleteQuizQuestion(id: string): boolean {
    const arr = (this.data.study as any).quizQuestions || [];
    const index = arr.findIndex((q: QuizQuestion) => q.id === id);
    if (index === -1) return false;
    arr.splice(index, 1);
    this.saveData();
    return true;
  }

  public getQuizResults(): QuizResult[] {
    return [...(this.data.study.quizResults || [])];
  }

  public addQuizResult(result: Omit<QuizResult, 'id' | 'date'>): QuizResult {
    const newResult: QuizResult = {
      ...result,
      id: generateId(),
      date: formatDate(new Date()),
    };

    this.data.study.quizResults.push(newResult);
    this.saveData();
    return newResult;
  }

  /**
   * Return aggregated quiz statistics:
   * - totalAttempts
   * - averageScore (0-100)
   * - bestScore
   * - lastAttempt (YYYY-MM-DD or null)
   * - byCategory: { [category]: { attempts, averageScore } }
   */
  public getQuizStats() {
    const results = this.data.study.quizResults || [];
    const totalAttempts = results.length;

    if (totalAttempts === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        bestScore: 0,
        lastAttempt: null,
        byCategory: {},
      };
    }

    const totalScore = results.reduce((sum, r) => sum + r.score, 0);
    const averageScore = Math.round((totalScore / totalAttempts) * 10) / 10;
    const bestScore = Math.max(...results.map(r => r.score));
    const lastAttempt = results.slice(-1)[0].date || null;

    const byCategory: Record<string, { attempts: number; averageScore: number }> = {};

    results.forEach(r => {
      const cat = r.category || 'general';
      byCategory[cat] = byCategory[cat] || { attempts: 0, averageScore: 0 };
      byCategory[cat].attempts += 1;
      byCategory[cat].averageScore += r.score;
    });

    Object.keys(byCategory).forEach(cat => {
      const info = byCategory[cat];
      info.averageScore = Math.round((info.averageScore / info.attempts) * 10) / 10;
    });

    return {
      totalAttempts,
      averageScore,
      bestScore,
      lastAttempt,
      byCategory,
    };
  }

  // Pomodoro sessions
  public getPomodoroSessions(): PomodoroSession[] {
    return [...(this.data.study.pomodoroSessions || [])];
  }

  public addPomodoroSession(session: Omit<PomodoroSession, 'id' | 'date'>): PomodoroSession {
    const newSession: PomodoroSession = {
      ...session,
      id: generateId(),
      date: formatDate(new Date()),
    };
    this.data.study.pomodoroSessions.push(newSession);
    this.saveData();
    return newSession;
  }

  public getCourses(): Course[] {
    return [...this.data.study.courses];
  }

  public addCourse(course: Omit<Course, 'id'>): Course {
    const newCourse: Course = {
      ...course,
      id: generateId(),
    };
    
    this.data.study.courses.push(newCourse);
    this.saveData();
    return newCourse;
  }

  public updateCourse(id: string, updates: Partial<Course>): boolean {
    const index = this.data.study.courses.findIndex(c => c.id === id);

    if (index >= 0 && this.data.study.courses) {
      this.data.study.courses[index] = { ...this.data.study.courses[index], ...updates };
      this.saveData();
      return true;
    }

    return false;
  }

  public deleteCourse(id: string): boolean {
    const prevLength = this.data.study.courses.length;
    this.data.study.courses = this.data.study.courses.filter(c => c.id !== id);
    if (this.data.study.courses.length !== prevLength) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Financial entries
  public getFinancialEntries(): FinancialEntry[] {
    return [...(this.data.finances || [])];
  }

  public addFinancialEntry(entry: Omit<FinancialEntry, 'id' | 'createdAt'>): FinancialEntry {
    const now = formatDateTime(new Date());
    const newEntry: FinancialEntry = {
      ...entry,
      id: generateId(),
      createdAt: now,
    } as FinancialEntry;

    this.data.finances = this.data.finances || [];
    this.data.finances.push(newEntry);
    this.saveData();
    return newEntry;
  }

  public updateFinancialEntry(id: string, updates: Partial<FinancialEntry>): boolean {
    this.data.finances = this.data.finances || [];
    const idx = this.data.finances.findIndex(f => f.id === id);
    if (idx === -1) return false;
    this.data.finances[idx] = { ...this.data.finances[idx], ...updates };
    this.saveData();
    return true;
  }

  public deleteFinancialEntry(id: string): boolean {
    this.data.finances = this.data.finances || [];
    const prev = this.data.finances.length;
    this.data.finances = this.data.finances.filter(f => f.id !== id);
    if (this.data.finances.length !== prev) {
      this.saveData();
      return true;
    }
    return false;
  }

  public getMonthlyFinancialSummary(year: number, month: number): { income: number; expenses: number; profit: number; byCategory: Record<string, { income: number; expenses: number; net: number }> } {
    const entries = (this.data.finances || []).filter(f => {
      try {
        const d = new Date(f.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      } catch (e) { return false; }
    });

    let income = 0;
    let expenses = 0;
    const byCategory: Record<string, { income: number; expenses: number; net: number }> = {};

    entries.forEach(e => {
      const cat = e.category || 'Uncategorized';
      if (!byCategory[cat]) byCategory[cat] = { income: 0, expenses: 0, net: 0 };
      if (e.type === 'income') {
        income += e.amount;
        byCategory[cat].income += e.amount;
      } else {
        expenses += e.amount;
        byCategory[cat].expenses += e.amount;
      }
      byCategory[cat].net = byCategory[cat].income - byCategory[cat].expenses;
    });

    return { income, expenses, profit: income - expenses, byCategory };
  }

  /**
   * Return array of daily profit for a given year/month. The array index 0 corresponds to day 1.
   */
  public getDailyProfitForMonth(year: number, month: number): number[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const daily = new Array<number>(daysInMonth).fill(0);

    const entries = (this.data.finances || []).filter(f => {
      try {
        const d = new Date(f.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      } catch (e) { return false; }
    });

    entries.forEach(e => {
      try {
        const d = new Date(e.date + 'T00:00:00');
        const day = d.getDate();
        const idx = day - 1;
        if (e.type === 'income') {
          daily[idx] += e.amount;
        } else {
          daily[idx] -= e.amount;
        }
      } catch (err) {
        // ignore malformed
      }
    });

    // Round to 2 decimals
    return daily.map(v => Math.round(v * 100) / 100);
  }

  /**
   * Return array of daily breakdown objects for a given year/month.
   * Each index corresponds to day-1 and contains { income, expenses, profit }
   */
  public getDailyBreakdownForMonth(year: number, month: number): { income: number; expenses: number; profit: number }[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const daily = new Array(daysInMonth).fill(0).map(() => ({ income: 0, expenses: 0, profit: 0 }));

    const entries = (this.data.finances || []).filter(f => {
      try {
        const d = new Date(f.date + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      } catch (e) { return false; }
    });

    entries.forEach(e => {
      try {
        const d = new Date(e.date + 'T00:00:00');
        const day = d.getDate();
        const idx = day - 1;
        if (e.type === 'income') {
          daily[idx].income += e.amount;
        } else {
          daily[idx].expenses += e.amount;
        }
        daily[idx].profit = Math.round((daily[idx].income - daily[idx].expenses) * 100) / 100;
      } catch (err) {
        // ignore malformed
      }
    });

    return daily;
  }

  // Vocabulary management
  public getVocabulary(): VocabularyWord[] {
    return [...(this.data.study.vocabulary || [])];
  }

  public addVocabularyWord(word: Omit<VocabularyWord, 'id' | 'createdAt' | 'lastReviewed' | 'reviewCount' | 'nextReviewAt' | 'intervalDays'>): VocabularyWord {
    const now = formatDateTime(new Date());
    const newWord: VocabularyWord = {
      ...word,
      id: generateId(),
      createdAt: now,
      lastReviewed: '',
      reviewCount: 0,
      intervalDays: 1,
      nextReviewAt: now, // due immediately
    } as VocabularyWord;

    this.data.study.vocabulary = this.data.study.vocabulary || [];
    this.data.study.vocabulary.push(newWord);
    this.saveData();
    return newWord;
  }

  public updateVocabularyWord(id: string, updates: Partial<VocabularyWord>): boolean {
    const arr = this.data.study.vocabulary || [];
    const index = arr.findIndex((w: VocabularyWord) => w.id === id);
    if (index === -1) return false;
    arr[index] = { ...arr[index], ...updates };
    this.saveData();
    return true;
  }

  public deleteVocabularyWord(id: string): boolean {
    this.data.study.vocabulary = (this.data.study.vocabulary || []).filter(w => w.id !== id);
    this.saveData();
    return true;
  }

  public markVocabularyReviewed(id: string, success = true): boolean {
    const arr = this.data.study.vocabulary || [];
    const index = arr.findIndex((w: VocabularyWord) => w.id === id);
    if (index === -1) return false;

    const now = new Date();
    const nowDateStr = formatDate(now);

    // Prevent more than one review per day
    if (arr[index].lastReviewed === nowDateStr) {
      // Already reviewed today
      return false;
    }

    arr[index].lastReviewed = nowDateStr;
    arr[index].reviewCount = (arr[index].reviewCount || 0) + 1;

    const prevInterval = arr[index].intervalDays || 1;

    if (success) {
      // simple doubling schedule (1,2,4,8...)
      arr[index].intervalDays = Math.max(1, Math.round(prevInterval * 2));
    } else {
      // reset interval on failure
      arr[index].intervalDays = 1;
    }

    arr[index].nextReviewAt = formatDateTime(new Date(now.getTime() + (arr[index].intervalDays || 1) * 24 * 60 * 60 * 1000));

    this.saveData();
    return true;
  }

  public getDueVocabulary(referenceDate?: Date): VocabularyWord[] {
    const now = referenceDate || new Date();
    return (this.data.study.vocabulary || []).filter(w => {
      if (!w.nextReviewAt) return true;
      return new Date(w.nextReviewAt).getTime() <= now.getTime();
    });
  }

  public getDueVocabularyCount(): number {
    return this.getDueVocabulary().length;
  }

  // Métodos para funcionalidades de registros
  public getUploadedFiles(): UploadedFile[] {
    return [...this.data.records.uploadedFiles];
  }

  // Accept an optional Blob parameter for file binary storage in IndexedDB.
  public addUploadedFile(file: Omit<UploadedFile, 'id' | 'uploadDate' | 'previewUrl'> & { previewUrl?: string }, blob?: Blob): UploadedFile {
    const newFile: UploadedFile = {
      ...file,
      id: generateId(),
      uploadDate: formatDateTime(new Date()),
    } as UploadedFile;
    
    this.data.records.uploadedFiles.push(newFile);
    this.saveData();

    // If a blob is provided, store it in IndexedDB (async, non-blocking)
    if (blob) {
      saveUploadBlob(newFile.id, blob).catch(err => console.error('Failed saving blob to idb', err));
    } else if (file.previewUrl && typeof file.previewUrl === 'string' && file.previewUrl.startsWith('data:')) {
      // If caller passed a base64 preview, convert and store async (backwards compatibility)
      try {
        const b = this.dataURLToBlob(file.previewUrl);
        saveUploadBlob(newFile.id, b).catch(err => console.error('Failed saving migrated preview to idb', err));
        // Remove previewUrl from in-memory object to avoid storing heavy data in localStorage
        delete (newFile as any).previewUrl;
        this.saveData();
      } catch (err) {
        console.error('Failed converting preview data URL', err);
      }
    }

    return newFile;
  }

  public deleteUploadedFile(id: string): boolean {
    const index = this.data.records.uploadedFiles.findIndex(f => f.id === id);
    if (index === -1) return false;
    
    this.data.records.uploadedFiles.splice(index, 1);
    this.saveData();
    // Also delete blob from IndexedDB (async)
    deleteUploadBlob(id).catch(err => console.error('Failed deleting blob from idb', err));
    return true;
  }

  public updateUploadedFile(id: string, updates: Partial<UploadedFile>): boolean {
    const index = this.data.records.uploadedFiles.findIndex(f => f.id === id);
    if (index === -1) return false;

    this.data.records.uploadedFiles[index] = {
      ...this.data.records.uploadedFiles[index],
      ...updates,
      // preserve id and uploadDate unless explicitly overwritten
      id: this.data.records.uploadedFiles[index].id,
      uploadDate: updates.uploadDate || this.data.records.uploadedFiles[index].uploadDate,
    };

    this.saveData();
    return true;
  }

  public getGalleries(): PhotoGallery[] {
    return [...this.data.records.galleries];
  }

  /**
   * Return an object URL for the stored upload blob (or undefined if none)
   * Caller is responsible for calling URL.revokeObjectURL on the returned string when done.
   */
  public async getUploadPreviewUrl(id: string): Promise<string | undefined> {
    try {
      const blob = await getUploadBlob(id);
      if (!blob) return undefined;

      // Prefer native object URLs in browser environments
      if (typeof URL !== 'undefined' && typeof (URL as any).createObjectURL === 'function') {
        return URL.createObjectURL(blob as Blob);
      }

      // Fallback for test / Node environments: convert blob to data URL
      try {
        // Use Blob.arrayBuffer() then Buffer to base64 if available
        const arrayBuffer = await (blob as Blob).arrayBuffer();
        if (typeof Buffer !== 'undefined') {
          const buf = Buffer.from(arrayBuffer);
          const base64 = buf.toString('base64');
          const mime = (blob as Blob).type || 'application/octet-stream';
          return `data:${mime};base64,${base64}`;
        }

        // Last resort: convert via text (may corrupt binary data)
        const text = await (blob as Blob).text();
        const mime = (blob as Blob).type || 'text/plain';
        return `data:${mime},${encodeURIComponent(text)}`;
      } catch (e) {
        console.warn('Failed to convert blob to data URL for preview', e);
        return undefined;
      }
    } catch (err) {
      console.error('Failed to retrieve upload blob', err);
      return undefined;
    }
  }

  public addGallery(gallery: Omit<PhotoGallery, 'id' | 'createdAt' | 'updatedAt'>): PhotoGallery {
    const now = formatDateTime(new Date());
    const newGallery: PhotoGallery = {
      ...gallery,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    this.data.records.galleries.push(newGallery);
    this.saveData();
    return newGallery;
  }

  // Métodos para Journal
  public getJournalEntries(): JournalEntry[] {
    return [...this.data.journalEntries];
  }

  public addJournalEntry(entry: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>): JournalEntry {
    const now = formatDateTime(new Date());
    const newEntry: JournalEntry = {
      ...entry,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    this.data.journalEntries = this.data.journalEntries || [];
    this.data.journalEntries.push(newEntry);
    this.saveData();
    return newEntry;
  }

  public updateJournalEntry(id: string, updates: Partial<JournalEntry>): boolean {
    const index = this.data.journalEntries.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.data.journalEntries[index] = {
      ...this.data.journalEntries[index],
      ...updates,
      updatedAt: formatDateTime(new Date()),
    };
    this.saveData();
    return true;
  }

  public deleteJournalEntry(id: string): boolean {
    const index = this.data.journalEntries.findIndex(e => e.id === id);
    if (index === -1) return false;

    this.data.journalEntries.splice(index, 1);
    this.saveData();
    return true;
  }
}

// Instância singleton
export const storage = LocalStorageManager.getInstance();