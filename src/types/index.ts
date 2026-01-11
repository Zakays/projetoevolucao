export interface Habit {
  id: string;
  name: string;
  category: 'saude' | 'treino' | 'estudo' | 'estetica' | 'disciplina';
  time?: string;
  daysOfWeek: number[]; // 0-6 (domingo-sábado)
  isEssential: boolean;
  weight: 1 | 2 | 3; // pontos
  additionalInfo?: string;
  createdAt: string;
  streak: number;
  lastCompleted?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'completed' | 'not_completed' | 'justified';
  justification?: string;
  completedAt?: string;
}

// Vices feature: track behaviors (vices) and per-day completion statuses
export interface Vice {
  id: string;
  name: string;
  note?: string;
  color?: string; // CSS color or gradient
  icon?: string;
  createdAt: string; // ISO
  streak?: number; // computed consecutive clean days
}

export interface ViceCompletion {
  id: string;
  viceId: string;
  date: string; // YYYY-MM-DD
  status: 'clean' | 'relapse';
  note?: string;
  recordedAt?: string; // ISO
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  totalHabits: number;
  completedHabits: number;
  totalPoints: number;
  earnedPoints: number;
  percentage: number;
}

export interface MonthlyChart {
  month: string; // YYYY-MM
  dailyStats: DailyStats[];
  averagePerformance: number;
  bestDay: string;
  worstDay: string;
  totalDays: number;
  completedDays: number;
}

export interface WorkoutEntry {
  id: string;
  date: string; // YYYY-MM-DD
  type: 'treino' | 'descanso' | 'recuperacao';
  exercises: Exercise[];
  notes?: string;
  duration?: number; // minutos
}

export interface Exercise {
  id: string;
  name: string;
  sets: Set[];
  notes?: string;
}

export interface Set {
  reps: number;
  weight?: number; // kg
  duration?: number; // segundos para exercícios de tempo
  rest?: number; // segundos de descanso
}

export interface BodyMeasurement {
  id: string;
  date: string; // YYYY-MM-DD
  weight?: number;
  measurements?: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    thighs?: number;
  };
  photos?: {
    front?: string; // base64 ou URL local
    side?: string;
    back?: string;
  };
  selfAssessment: {
    energy: number; // 1-10
    confidence: number; // 1-10
    selfEsteem: number; // 1-10
  };
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  whatWentWell: string;
  whatToImprove: string;
  howIFelt: string;
  mood: number; // 1-10
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'daily' | 'monthly' | 'long_term';
  deadline?: string; // YYYY-MM-DD
  status: 'in_progress' | 'completed' | 'paused' | 'cancelled';
  progress: number; // 0-100
  milestones?: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
}

export interface UserSettings {
  // Theme can be one of the predefined palettes. 'system' defers to the OS preference.
  theme: 'light' | 'dark' | 'system' | 'ocean' | 'sunset' | 'forest' | 'midnight';
  soundEnabled: boolean;
  animationsEnabled: boolean;
  minimalMode: boolean;
  dailyMotivation: string;
  // AI integration settings (optional)
  aiApiKeys?: string[];
  // Toggle to enable or disable the AI chat component
  aiChatEnabled?: boolean;
  // Daily motivation generation options
  motivationTone?: 'encorajador' | 'calmo' | 'direto' | 'personal';
  motivationLength?: 'short' | 'medium' | 'long';
  // Track when the daily motivation was last auto-generated (YYYY-MM-DD)
  lastMotivationGeneratedAt?: string;
  notifications: {
    habitReminders: boolean;
    workoutReminders: boolean;
    journalReminders: boolean;
  };
  // Enable testing utilities (shows simulation buttons)
  testsEnabled?: boolean;
}

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  text: string;
  createdAt?: string; // ISO timestamp
}

// add aiConversations to ExtendedAppData by appending to ExtendedAppData definition later in the file (below)

export interface AppData {
  habits: Habit[];
  habitCompletions: HabitCompletion[];
  monthlyCharts: MonthlyChart[];
  workouts: WorkoutEntry[];
  bodyMeasurements: BodyMeasurement[];
  journalEntries: JournalEntry[];
  goals: Goal[];
  settings: UserSettings;
  lastUpdated: string;
  version: string;
}

// Tipos para funcionalidades de estudo
export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed: string;
  nextReview: string;
  interval: number; // dias
  ease: number; // fator de facilidade (2.5 padrão)
  streak: number;
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  explanation?: string;
  createdAt?: string;
  tags: string[];
}

export interface QuizResult {
  id: string;
  date: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // segundos
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
  userAnswers: number[];
}

export interface Book {
  id: string;
  title: string;
  author: string;
  category: string;
  currentPage: number;
  totalPages: number;
  status: 'reading' | 'completed' | 'paused' | 'planned';
  startDate?: string;
  endDate?: string;
  rating?: number; // 1-5
  notes?: string;
  coverUrl?: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  definition: string;
  pronunciation?: string;
  exampleSentence: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  reviewCount: number;
  lastReviewed: string;
  nextReviewAt?: string;
  intervalDays?: number;
  createdAt: string;
} 

export interface Course {
  id: string;
  title: string;
  provider: string;
  category: string;
  status: 'in_progress' | 'completed' | 'planned';
  progress: number; // 0-100
  duration: number; // horas
  startDate?: string;
  endDate?: string;
  certificateUrl?: string;
  notes?: string;
}

export interface FinancialEntry {
  id: string;
  type: 'income' | 'expense';
  amount: number; // positive value
  category: string;
  date: string; // YYYY-MM-DD
  notes?: string;
  createdAt: string;
}

export interface StudyNote {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  summary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PomodoroSession {
  id: string;
  date: string;
  focusTime: number; // minutos
  breakTime: number; // minutos
  sessionsCompleted: number;
  totalTime: number; // minutos
  notes?: string;
}

export interface InspirationQuote {
  id: string;
  quote: string;
  author: string;
  category: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
}

// Tipos para funcionalidades de registros (uploads e galeria)
export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  uploadDate: string;
  tags: string[];
  category: string;
  description?: string;
  previewUrl?: string;
  metadata?: Record<string, any>;
}

export interface PhotoGallery {
  id: string;
  title: string;
  description?: string;
  photos: UploadedFile[];
  tags: string[];
  category: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressComparison {
  id: string;
  title: string;
  beforeImage: UploadedFile;
  afterImage: UploadedFile;
  timeDifference: number; // dias
  notes?: string;
  improvements: string[];
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: string;
  updatedAt: string;
  attachments: UploadedFile[];
}

// Tipo extendido para AppData incluindo novos módulos
export interface StudyData {
  flashcards: Flashcard[];
  quizResults: QuizResult[];
  quizQuestions: QuizQuestion[];
  books: Book[];
  vocabulary: VocabularyWord[];
  courses: Course[];
  studyNotes: StudyNote[];
  pomodoroSessions: PomodoroSession[];
  quotes: InspirationQuote[];
}

export interface RecordsData {
  uploadedFiles: UploadedFile[];
  galleries: PhotoGallery[];
  progressComparisons: ProgressComparison[];
  communityPosts: CommunityPost[];
}

export interface ExtendedAppData extends AppData {
  study: StudyData;
  records: RecordsData;
  finances?: FinancialEntry[];
  // persisted AI conversation history for personalization
  aiConversations?: AIMessage[];
  // Vices feature
  vices?: Vice[];
  viceCompletions?: ViceCompletion[];
}