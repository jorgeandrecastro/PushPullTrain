import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, Program, AppSettings, Exercise, ExerciseSet } from '../types';

const SESSIONS_KEY = 'workout_sessions';
const PROGRAMS_KEY = 'workout_programs';
const SETTINGS_KEY = 'app_settings';

// Fonction utilitaire pour valider et corriger un programme
const validateProgram = (program: any): Program => {
  if (!program || typeof program !== 'object') {
    program = {};
  }

  return {
    id: program.id || `program-${Date.now()}`,
    name: program.name || 'Programme sans nom',
    type: program.type || 'custom',
    color: program.color || '#007AFF',
    exercises: (program.exercises || []).map((exercise: any, index: number) => {
      // Valider chaque exercice
      if (!exercise || typeof exercise !== 'object') {
        exercise = {};
      }
      
      // Gérer la migration des séries
      let sets: ExerciseSet[];
      if (Array.isArray(exercise.sets)) {
        // Structure déjà migrée
        sets = exercise.sets.map((set: any, setIndex: number) => ({
          id: set.id || `set-${setIndex}-${Date.now()}`,
          setNumber: set.setNumber || setIndex + 1,
          reps: Math.max(0, typeof set.reps === 'number' ? set.reps : 8),
          weight: Math.max(0, typeof set.weight === 'number' ? set.weight : 0),
          completed: !!set.completed
        }));
      } else {
        // Ancienne structure à migrer
        const numSets = typeof exercise.sets === 'number' ? exercise.sets : 1;
        sets = Array.from({ length: numSets }, (_, i) => ({
          id: `${exercise.id || `ex-${index}`}-set-${i + 1}`,
          setNumber: i + 1,
          reps: Math.max(0, typeof exercise.reps === 'number' ? exercise.reps : 8),
          weight: Math.max(0, typeof exercise.weight === 'number' ? exercise.weight : 0),
          completed: false
        }));
      }

      return {
        id: exercise.id || `exercise-${index}-${Date.now()}`,
        name: exercise.name || 'Exercice sans nom',
        sets: sets,
        restTime: typeof exercise.restTime === 'number' ? exercise.restTime : 90,
        completed: !!exercise.completed
      };
    })
  };
};

// Fonction de migration pour convertir les anciennes données
const migrateExercise = (oldExercise: any): Exercise => {
  // Si l'exercice a déjà la nouvelle structure, on le retourne tel quel
  if (oldExercise.sets && Array.isArray(oldExercise.sets)) {
    return oldExercise;
  }
  
  // Migration depuis l'ancienne structure
  const sets: ExerciseSet[] = [];
  const numSets = typeof oldExercise.sets === 'number' ? oldExercise.sets : 1;
  
  for (let i = 0; i < numSets; i++) {
    sets.push({
      id: `${oldExercise.id || 'ex'}-set-${i + 1}`,
      setNumber: i + 1,
      reps: Math.max(0, typeof oldExercise.reps === 'number' ? oldExercise.reps : 8),
      weight: Math.max(0, typeof oldExercise.weight === 'number' ? oldExercise.weight : 0),
      completed: !!oldExercise.completed
    });
  }
  
  return {
    id: oldExercise.id || `ex-${Date.now()}`,
    name: oldExercise.name || 'Exercice sans nom',
    sets: sets,
    restTime: typeof oldExercise.restTime === 'number' ? oldExercise.restTime : 90,
    completed: !!oldExercise.completed
  };
};

const migrateData = (data: any) => {
  if (!data) return data;

  if (data.programs && Array.isArray(data.programs)) {
    data.programs = data.programs.map((program: any) => {
      if (program.exercises) {
        program.exercises = program.exercises.map(migrateExercise);
      }
      return program;
    });
  }
  
  if (data.workoutSessions && Array.isArray(data.workoutSessions)) {
    data.workoutSessions = data.workoutSessions.map((session: any) => {
      if (session.exercises) {
        session.exercises = session.exercises.map(migrateExercise);
      }
      return session;
    });
  }
  
  return data;
};

export const storage = {
  // Fonction pour effacer toutes les données
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([SESSIONS_KEY, PROGRAMS_KEY, SETTINGS_KEY]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  },

  // Sessions
  async saveSessions(sessions: WorkoutSession[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving sessions:', error);
      throw error;
    }
  },

  async addSession(session: WorkoutSession): Promise<void> {
    try {
      const sessions = await this.loadSessions();
      sessions.push(session);
      await this.saveSessions(sessions);
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  },

  async updateSession(updatedSession: WorkoutSession): Promise<void> {
    try {
      const sessions = await this.loadSessions();
      const index = sessions.findIndex(s => s.id === updatedSession.id);
      if (index !== -1) {
        sessions[index] = updatedSession;
        await this.saveSessions(sessions);
      }
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  async loadSessions(): Promise<WorkoutSession[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      const sessions = data ? JSON.parse(data) : [];
      return migrateData({ workoutSessions: sessions }).workoutSessions || [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  },

  async getSessionsByDate(date: string): Promise<WorkoutSession[]> {
    try {
      const sessions = await this.loadSessions();
      return sessions.filter(s => s.date === date);
    } catch (error) {
      console.error('Error getting sessions by date:', error);
      return [];
    }
  },

  async getSessionsByMonth(year: number, month: number): Promise<WorkoutSession[]> {
    try {
      const sessions = await this.loadSessions();
      return sessions.filter(s => {
        try {
          const sessionDate = new Date(s.date);
          return sessionDate.getFullYear() === year && sessionDate.getMonth() + 1 === month;
        } catch {
          return false;
        }
      });
    } catch (error) {
      console.error('Error getting sessions by month:', error);
      return [];
    }
  },

  // Programs
  async savePrograms(programs: Program[]): Promise<void> {
    try {
      await AsyncStorage.setItem(PROGRAMS_KEY, JSON.stringify(programs));
    } catch (error) {
      console.error('Error saving programs:', error);
      throw error;
    }
  },

  async loadPrograms(): Promise<Program[]> {
    try {
      const data = await AsyncStorage.getItem(PROGRAMS_KEY);
      let programs = data ? JSON.parse(data) : [];
      
      // Appliquer la migration
      programs = migrateData({ programs: programs }).programs || [];
      
      // Valider et corriger chaque programme
      return programs.map(validateProgram);
    } catch (error) {
      console.error('Error loading programs:', error);
      return [];
    }
  },

  async addProgram(program: Program): Promise<void> {
    try {
      const programs = await this.loadPrograms();
      const validatedProgram = validateProgram(program);
      programs.push(validatedProgram);
      await this.savePrograms(programs);
    } catch (error) {
      console.error('Error adding program:', error);
      throw error;
    }
  },

  async updateProgram(updatedProgram: Program): Promise<void> {
    try {
      const programs = await this.loadPrograms();
      const validatedProgram = validateProgram(updatedProgram);
      const index = programs.findIndex(p => p.id === validatedProgram.id);
      if (index !== -1) {
        programs[index] = validatedProgram;
        await this.savePrograms(programs);
      }
    } catch (error) {
      console.error('Error updating program:', error);
      throw error;
    }
  },

  async deleteProgram(programId: string): Promise<void> {
    try {
      const programs = await this.loadPrograms();
      const filtered = programs.filter(p => p.id !== programId);
      await this.savePrograms(filtered);
    } catch (error) {
      console.error('Error deleting program:', error);
      throw error;
    }
  },

  // Settings
  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  },

  async loadSettings(): Promise<AppSettings> {
    try {
      const data = await AsyncStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        restBetweenSets: 90,
        restBetweenExercises: 120
      };
    } catch (error) {
      console.error('Error loading settings:', error);
      return {
        restBetweenSets: 90,
        restBetweenExercises: 120
      };
    }
  },
};