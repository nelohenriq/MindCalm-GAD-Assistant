
export type NavigationTab = 'dashboard' | 'cbt' | 'medication' | 'lifestyle' | 'breathing' | 'analytics' | 'steppedCare' | 'graph';

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export interface MoodEntry {
  id: string;
  date: string;
  score: number; // 1-10 (General Wellness)
  anxietyScore: number; // 1-10 (Anxiety Level)
  symptoms: string[];
  notes: string;
}

export interface ThoughtRecord {
  id: string;
  date: string;
  situation: string;
  thought: string;
  emotion: string;
  intensityBefore: number; // 1-10
  distortion: string;
  evidenceFor?: string; // New
  evidenceAgainst?: string; // New
  alternativeThought: string;
  intensityAfter?: number; // 1-10
}

export interface ActivityPlan {
  id: string;
  title: string;
  date: string;
  difficulty: number; // 1-5
  completed: boolean;
  moodAfter?: number;
}

export interface TaperStep {
  date: string;
  dosage: string;
  notes?: string;
  completed: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  type?: 'SSRI' | 'SNRI' | 'Benzodiazepine' | 'Other';
  instructions?: string;
  totalPills?: number;
  refillDate?: string;
  taperSchedule?: TaperStep[];
  photoUrl?: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  medicationName: string;
  date: string;
  taken: boolean;
  sideEffects?: string;
  efficacyRating?: number; // 1-10
}

export interface LifestyleEntry {
  date: string;
  sleepHours: number;
  sleepQuality?: number; // 1-5
  bedTime?: string; // HH:MM
  wakeTime?: string; // HH:MM
  sleepFactors?: string[]; // 'screens', 'alcohol', 'late_meal', 'stress', 'caffeine'
  exerciseMinutes: number;
  caffeineIntake: number; // cups
  waterIntake: number; // glasses
  socialMinutes: number;
}

export interface BreathingSession {
  id: string;
  date: string;
  technique: 'box' | '4-7-8' | 'cyclic' | 'resonance' | 'panic' | 'deep';
  durationSeconds: number;
  completed: boolean;
  anxietyBefore?: number;
  anxietyAfter?: number;
}

export interface GAD7Result {
  id: string;
  date: string;
  score: number;
  interpretation: 'Minimal' | 'Mild' | 'Moderate' | 'Severe';
}

// Exercise Planner Types
export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // e.g., "10-12"
  weight?: string; // e.g., "15lbs"
  completed: boolean;
  notes?: string;
}

export interface Workout {
  id: string;
  title: string; // e.g., "Upper Body"
  dayOfWeek: number; // 0=Sun, 1=Mon, etc.
  exercises: Exercise[];
  completed: boolean;
  dateCompleted?: string;
  durationMinutes?: number;
  moodBefore?: number; // 1-10 (Anxiety)
  moodAfter?: number; // 1-10 (Anxiety)
  difficultyRating?: number; // 1-10 (RPE)
}

export interface Insight {
  text: string;
  relatedMetrics: string[]; // e.g. ['Sleep', 'Anxiety']
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}