import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, Program, AppSettings } from '../types';

const SESSIONS_KEY = 'workout_sessions';
const PROGRAMS_KEY = 'workout_programs';
const SETTINGS_KEY = 'app_settings';

export const storage = {
  // Sessions
  async addSession(session: WorkoutSession): Promise<void> {
    try {
      const sessions = await this.loadSessions();
      sessions.push(session);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
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
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  },

  async loadSessions(): Promise<WorkoutSession[]> {
    try {
      const data = await AsyncStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
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
        const sessionDate = new Date(s.date);
        return sessionDate.getFullYear() === year && sessionDate.getMonth() + 1 === month;
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
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading programs:', error);
      return [];
    }
  },

  async addProgram(program: Program): Promise<void> {
    try {
      const programs = await this.loadPrograms();
      programs.push(program);
      await this.savePrograms(programs);
    } catch (error) {
      console.error('Error adding program:', error);
      throw error;
    }
  },

  async updateProgram(updatedProgram: Program): Promise<void> {
    try {
      const programs = await this.loadPrograms();
      const index = programs.findIndex(p => p.id === updatedProgram.id);
      if (index !== -1) {
        programs[index] = updatedProgram;
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