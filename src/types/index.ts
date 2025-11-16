export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  restTime: number;
  completed: boolean;
}

export interface WorkoutSession {
  id: string;
  date: string;
  programId?: string;
  exercises: Exercise[];
  completed: boolean;
  startTime?: string;
  endTime?: string;
  duration?: number;
}

export interface Program {
  id: string;
  name: string;
  type: 'push' | 'pull' | 'legs' | 'fullbody' | 'custom';
  color: string;
  exercises: Exercise[];
}

export interface AppSettings {
  restBetweenSets: number;
  restBetweenExercises: number;
}

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeLeft: number;
  type: 'set' | 'exercise' | null;
  currentSet?: number;
  currentExercise?: string;
  nextExercise?: string;
}