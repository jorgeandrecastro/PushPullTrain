import { storage } from './storage';
import { defaultPrograms } from '../data/defaultData';

export const resetAppData = async (): Promise<void> => {
  try {
    console.log('🔧 Réinitialisation des données...');
    
    // Effacer toutes les données existantes
    await storage.clearAllData();
    
    // Recréer les programmes par défaut avec validation
    const validatedPrograms = defaultPrograms.map(program => ({
      ...program,
      exercises: program.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          id: set.id || `set-${Math.random()}`,
          setNumber: set.setNumber || 1,
          reps: set.reps || 8,
          weight: set.weight || 0,
          completed: set.completed || false
        }))
      }))
    }));
    
    await storage.savePrograms(validatedPrograms);
    
    // Réinitialiser les paramètres
    await storage.saveSettings({
      restBetweenSets: 90,
      restBetweenExercises: 120
    });
    
    console.log('✅ Données réinitialisées avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    throw error;
  }
};

// Fonction pour vérifier l'état des données
export const checkDataStatus = async (): Promise<void> => {
  try {
    const programs = await storage.loadPrograms();
    const sessions = await storage.loadSessions();
    const settings = await storage.loadSettings();
    
    console.log('📊 État des données:');
    console.log('- Programmes:', programs.length);
    console.log('- Sessions:', sessions.length);
    console.log('- Paramètres:', settings);
    
    programs.forEach((program, index) => {
      console.log(`  Programme ${index + 1}:`, program.name);
      program.exercises.forEach((exercise, exIndex) => {
        console.log(`    Exercice ${exIndex + 1}:`, exercise.name, `${exercise.sets.length} séries`);
      });
    });
  } catch (error) {
    console.error('Erreur lors de la vérification des données:', error);
  }
};