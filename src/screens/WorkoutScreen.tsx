import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal,
  useWindowDimensions,
  StatusBar,
  Platform,
  TextInput,
  Animated
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { storage } from '../utils/storage';
import { WorkoutSession, Exercise, ExerciseSet, Program, TimerState, AppSettings } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Workout'>;
  route: RouteProp<RootStackParamList, 'Workout'>;
};

export default function WorkoutScreen({ navigation, route }: Props) {
  const { date, programId } = route.params;
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // États pour le chronomètre de repos
  const [restTimer, setRestTimer] = useState<TimerState>({
    isRunning: false,
    isPaused: false,
    timeLeft: 0,
    type: null
  });
  const [settings, setSettings] = useState<AppSettings>({
    restBetweenSets: 90,
    restBetweenExercises: 120
  });
  const [showSettings, setShowSettings] = useState(false);

  // États pour suivre l'exercice et la série en cours
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSetIndex, setCurrentSetIndex] = useState(0);

  // Animation pour le timer de repos
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [date])
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  // Gestion du chronomètre de repos avec animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer.isRunning && !restTimer.isPaused && restTimer.timeLeft > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => ({ ...prev, timeLeft: prev.timeLeft - 1 }));
        
        // Animation pulse chaque seconde
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1000);
    } else if (restTimer.timeLeft === 0 && restTimer.isRunning) {
      handleRestTimerComplete();
    }
    return () => clearInterval(interval);
  }, [restTimer.isRunning, restTimer.isPaused, restTimer.timeLeft]);

  const loadData = async () => {
    try {
      const sessions = await storage.getSessionsByDate(date);
      const progs = await storage.loadPrograms();
      const savedSettings = await storage.loadSettings();
      
      setPrograms(progs);
      setSettings(savedSettings);

      if (sessions.length > 0) {
        const existingSession = sessions[0];
        setSession(existingSession);
        
        // Trouver le premier exercice et série non complétés
        let foundExerciseIndex = 0;
        let foundSetIndex = 0;
        let found = false;
        
        for (let i = 0; i < existingSession.exercises.length; i++) {
          const exercise = existingSession.exercises[i];
          for (let j = 0; j < exercise.sets.length; j++) {
            if (!exercise.sets[j].completed) {
              foundExerciseIndex = i;
              foundSetIndex = j;
              found = true;
              break;
            }
          }
          if (found) break;
        }
        
        setCurrentExerciseIndex(foundExerciseIndex);
        setCurrentSetIndex(foundSetIndex);

        if (existingSession.startTime && !existingSession.endTime) {
          setIsTimerRunning(true);
          const start = new Date(existingSession.startTime).getTime();
          const now = new Date().getTime();
          setTimer(Math.floor((now - start) / 1000));
        }
      } else if (programId) {
        const program = progs.find(p => p.id === programId);
        if (program) {
          await createSessionFromProgram(program);
        }
      } else {
        setShowProgramSelector(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      Alert.alert('Erreur', 'Impossible de charger la séance');
    }
  };

  const createSessionFromProgram = async (program: Program) => {
    try {
      const newSession: WorkoutSession = {
        id: Date.now().toString(),
        date,
        programId: program.id,
        exercises: program.exercises.map(ex => ({
          ...ex,
          completed: false,
          sets: ex.sets.map(set => ({ ...set, completed: false }))
        })),
        completed: false,
      };
      await storage.addSession(newSession);
      setSession(newSession);
      setCurrentExerciseIndex(0);
      setCurrentSetIndex(0);
      setShowProgramSelector(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de créer la séance');
    }
  };

  const startWorkout = async () => {
    if (!session) return;
    
    try {
      const updatedSession = {
        ...session,
        startTime: new Date().toISOString(),
      };
      await storage.updateSession(updatedSession);
      setSession(updatedSession);
      setIsTimerRunning(true);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de démarrer la séance');
    }
  };

  const completeSet = async (exerciseIndex: number, setIndex: number) => {
    if (!session) return;
    
    const updatedSession = { ...session };
    const exercise = updatedSession.exercises[exerciseIndex];
    const set = exercise.sets[setIndex];
    
    // Marquer la série comme complétée
    set.completed = true;
    
    // Vérifier si c'est la dernière série de l'exercice
    const isLastSet = setIndex === exercise.sets.length - 1;
    const isLastExercise = exerciseIndex === session.exercises.length - 1;
    
    if (!isLastSet) {
      // Passer à la série suivante
      setCurrentSetIndex(setIndex + 1);
      // Démarrer le timer de repos entre séries
      startRestTimer(exercise.restTime, 'set', exercise.name);
    } else {
      // Marquer l'exercice comme complété
      exercise.completed = true;
      
      if (!isLastExercise) {
        // Passer à l'exercice suivant
        setCurrentExerciseIndex(exerciseIndex + 1);
        setCurrentSetIndex(0);
        // Démarrer le timer de repos entre exercices
        const nextExercise = updatedSession.exercises[exerciseIndex + 1];
        startRestTimer(settings.restBetweenExercises, 'exercise', exercise.name, nextExercise.name);
      } else {
        // Séance terminée
        updatedSession.completed = true;
        updatedSession.endTime = new Date().toISOString();
        updatedSession.duration = timer;
      }
    }
    
    try {
      await storage.updateSession(updatedSession);
      setSession(updatedSession);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour la séance');
    }
  };

  // Fonctions pour le chronomètre de repos
  const startRestTimer = (duration: number, type: 'set' | 'exercise', currentExercise?: string, nextExercise?: string) => {
    setRestTimer({
      isRunning: true,
      isPaused: false,
      timeLeft: duration,
      type,
      currentExercise,
      nextExercise
    });
  };

  const toggleRestTimerPause = () => {
    setRestTimer(prev => ({ ...prev, isPaused: !prev.isPaused }));
  };

  const skipRestTimer = () => {
    setRestTimer({
      isRunning: false,
      isPaused: false,
      timeLeft: 0,
      type: null
    });
  };

  const handleRestTimerComplete = () => {
    setRestTimer({
      isRunning: false,
      isPaused: false,
      timeLeft: 0,
      type: null
    });
  };

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await storage.saveSettings(newSettings);
    setShowSettings(false);
  };

  const finishWorkout = async () => {
    if (!session) return;

    Alert.alert(
      'Terminer la séance',
      'Voulez-vous vraiment terminer cette séance ?',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedSession = {
                ...session,
                endTime: new Date().toISOString(),
                duration: timer,
                completed: true,
              };
              await storage.updateSession(updatedSession);
              setIsTimerRunning(false);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de terminer la séance');
            }
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Fonction pour obtenir le prochain exercice non complété
  const getNextExercise = () => {
    if (!session) return null;
    return session.exercises.find(ex => !ex.completed);
  };

  if (!session) {
    return (
      <Modal visible={showProgramSelector} animationType="slide">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un programme</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
            >
              {programs.map(program => (
                <TouchableOpacity
                  key={program.id}
                  style={styles.programCard}
                  onPress={() => createSessionFromProgram(program)}
                >
                  <View style={[styles.programIcon, { backgroundColor: program.color }]}>
                    <Ionicons name="barbell" size={24} color="#fff" />
                  </View>
                  <View style={styles.programInfo}>
                    <Text style={styles.programName}>{program.name}</Text>
                    <Text style={styles.programDetails}>
                      {program.exercises.length} exercice{program.exercises.length > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  const currentExercise = session.exercises[currentExerciseIndex];
  const completedExercises = session.exercises.filter(e => e.completed).length;
  const totalExercises = session.exercises.length;
  const progress = totalExercises > 0 ? (completedExercises / totalExercises) * 100 : 0;
  const nextExercise = getNextExercise();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Overlay du chronomètre de repos */}
      {restTimer.isRunning && (
        <View style={styles.restTimerOverlay}>
          <View style={styles.restTimerContainer}>
            <View style={styles.restTimerHeader}>
              <Ionicons 
                name={restTimer.type === 'set' ? "repeat" : "barbell"} 
                size={28} 
                color="#FFF" 
              />
              <Text style={styles.restTimerTitle}>
                Repos {restTimer.type === 'set' ? 'entre les séries' : 'entre les exercices'}
              </Text>
            </View>
            
            {restTimer.currentExercise && (
              <Text style={styles.restTimerExercise}>{restTimer.currentExercise}</Text>
            )}
            
            {restTimer.nextExercise && (
              <View style={styles.nextExerciseContainer}>
                <Text style={styles.nextExerciseLabel}>Exercice suivant:</Text>
                <Text style={styles.nextExerciseName}>{restTimer.nextExercise}</Text>
              </View>
            )}

            <Animated.Text 
              style={[
                styles.restTimerTime,
                { transform: [{ scale: scaleAnim }] }
              ]}
            >
              {formatTime(restTimer.timeLeft)}
            </Animated.Text>
            
            <View style={styles.restTimerControls}>
              <TouchableOpacity 
                style={[styles.restTimerButton, styles.pauseButton]}
                onPress={toggleRestTimerPause}
              >
                <Ionicons 
                  name={restTimer.isPaused ? "play" : "pause"} 
                  size={22} 
                  color="#FFF" 
                />
                <Text style={styles.restTimerButtonText}>
                  {restTimer.isPaused ? 'Reprendre' : 'Pause'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.restTimerButton, styles.skipButton]}
                onPress={skipRestTimer}
              >
                <Ionicons name="play-skip-forward" size={22} color="#FFF" />
                <Text style={styles.restTimerButtonText}>Passer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <View style={[
        styles.container,
        isLandscape && styles.containerLandscape
      ]}>
        {/* Header avec timer et paramètres */}
        <View style={[
          styles.headerSection,
          isLandscape && styles.headerSectionLandscape
        ]}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
              <Text style={styles.backButtonText}>Retour</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => setShowSettings(true)}
            >
              <Ionicons name="settings-outline" size={22} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.timerContainer}>
            <Text style={styles.timerLabel}>Durée de la séance</Text>
            <Text style={[
              styles.timerText,
              isLandscape && styles.timerTextLandscape
            ]}>
              {formatTime(timer)}
            </Text>
          </View>

          {!session.startTime ? (
            <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
              <Ionicons name="play-circle" size={24} color="#fff" />
              <Text style={styles.startButtonText}>Démarrer la séance</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.progressSection}>
              <View style={styles.progressStats}>
                <Text style={styles.progressText}>
                  <Text style={styles.progressNumber}>{completedExercises}</Text>
                  <Text style={styles.progressDivider}>/</Text>
                  <Text style={styles.progressTotal}>{totalExercises}</Text>
                  <Text style={styles.progressLabel}> exercices</Text>
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Contenu principal */}
        <View style={[
          styles.mainContent,
          isLandscape && styles.mainContentLandscape
        ]}>
          <ScrollView 
            style={styles.exercisesList}
            contentContainerStyle={styles.exercisesListContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.exercisesHeader}>
              <Text style={styles.exercisesTitle}>Exercices</Text>
              {nextExercise && (
                <Text style={styles.nextExerciseInfo}>
                  Suivant: {nextExercise.name}
                </Text>
              )}
            </View>

            {session.exercises.map((exercise, exerciseIndex) => (
              <View
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  exercise.completed && styles.exerciseCardCompleted,
                  exerciseIndex === currentExerciseIndex && styles.exerciseCardCurrent
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseTitleContainer}>
                    {exercise.completed ? (
                      <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                    ) : (
                      <Text style={styles.exerciseNumber}>{exerciseIndex + 1}</Text>
                    )}
                    <Text style={[
                      styles.exerciseName,
                      exercise.completed && styles.exerciseNameCompleted
                    ]}>
                      {exercise.name}
                    </Text>
                  </View>
                  <Text style={styles.restTimeText}>{exercise.restTime}s repos</Text>
                </View>
                
                {/* Liste des séries */}
                <View style={styles.setsContainer}>
                  {exercise.sets.map((set, setIndex) => (
                    <TouchableOpacity
                      key={set.id}
                      style={[
                        styles.setCard,
                        set.completed && styles.setCardCompleted,
                        exerciseIndex === currentExerciseIndex && 
                        setIndex === currentSetIndex && 
                        styles.setCardCurrent
                      ]}
                      onPress={() => !set.completed && completeSet(exerciseIndex, setIndex)}
                      disabled={set.completed}
                    >
                      <View style={styles.setHeader}>
                        <Text style={styles.setNumber}>Série {set.setNumber}</Text>
                        {set.completed && (
                          <Ionicons name="checkmark" size={16} color="#34C759" />
                        )}
                      </View>
                      <View style={styles.setDetails}>
                        <Text style={styles.setDetail}>{set.reps} reps</Text>
                        {set.weight > 0 && (
                          <Text style={styles.setDetail}>{set.weight} kg</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Boutons d'action */}
          {session.startTime && !session.endTime && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.finishButton} 
                onPress={finishWorkout}
              >
                <Ionicons name="flag" size={20} color="#fff" />
                <Text style={styles.finishButtonText}>Terminer la séance</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Modal des paramètres */}
        <Modal 
          visible={showSettings} 
          animationType="slide" 
          transparent
          statusBarTranslucent
        >
          <View style={styles.settingsModalContainer}>
            <View style={styles.settingsModalContent}>
              <View style={styles.settingsHeader}>
                <Text style={styles.settingsTitle}>Paramètres de repos</Text>
                <TouchableOpacity 
                  onPress={() => setShowSettings(false)}
                  style={styles.settingsCloseButton}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.settingsBody}>
                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="repeat" size={20} color="#007AFF" />
                    <Text style={styles.settingLabel}>Repos entre les séries</Text>
                  </View>
                  <View style={styles.settingInputContainer}>
                    <TextInput
                      style={styles.settingInput}
                      value={settings.restBetweenSets.toString()}
                      onChangeText={text => setSettings({
                        ...settings, 
                        restBetweenSets: parseInt(text) || 90
                      })}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.settingSuffix}>secondes</Text>
                  </View>
                </View>

                <View style={styles.settingItem}>
                  <View style={styles.settingInfo}>
                    <Ionicons name="barbell" size={20} color="#FF9500" />
                    <Text style={styles.settingLabel}>Repos entre les exercices</Text>
                  </View>
                  <View style={styles.settingInputContainer}>
                    <TextInput
                      style={styles.settingInput}
                      value={settings.restBetweenExercises.toString()}
                      onChangeText={text => setSettings({
                        ...settings, 
                        restBetweenExercises: parseInt(text) || 120
                      })}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={styles.settingSuffix}>secondes</Text>
                  </View>
                </View>
              </View>

              <View style={styles.settingsFooter}>
                <TouchableOpacity 
                  style={[styles.settingsButton, styles.cancelButton]}
                  onPress={() => setShowSettings(false)}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.settingsButton, styles.saveButton]}
                  onPress={() => updateSettings(settings)}
                >
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerLandscape: {
    flexDirection: 'row',
  },

  // Header Section
  headerSection: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerSectionLandscape: {
    flex: 1,
    justifyContent: 'flex-start',
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  settingsButton: {
    padding: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  timerText: {
    fontSize: 42,
    fontWeight: '700',
    color: '#000',
    fontVariant: ['tabular-nums'],
  },
  timerTextLandscape: {
    fontSize: 32,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
  },
  progressStats: {
    alignItems: 'center',
    marginBottom: 12,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressNumber: {
    color: '#34C759',
  },
  progressDivider: {
    color: '#666',
  },
  progressTotal: {
    color: '#000',
  },
  progressLabel: {
    color: '#666',
    fontWeight: '400',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 3,
  },

  // Main Content
  mainContent: {
    flex: 1,
  },
  mainContentLandscape: {
    flex: 2,
  },
  exercisesList: {
    flex: 1,
  },
  exercisesListContent: {
    padding: 20,
    paddingBottom: 10,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exercisesTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  nextExerciseInfo: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },

  // Exercise Cards
  exerciseCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseCardCompleted: {
    opacity: 0.7,
    backgroundColor: '#f8f9fa',
  },
  exerciseCardCurrent: {
    borderColor: '#007AFF',
    borderWidth: 1.5,
    backgroundColor: '#f8fbff',
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  exerciseTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  exerciseNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    flex: 1,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#666',
  },
  restTimeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Sets
  setsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  setCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  setCardCompleted: {
    opacity: 0.6,
    backgroundColor: '#e8f8ed',
  },
  setCardCurrent: {
    borderColor: '#007AFF',
    borderWidth: 1.5,
    backgroundColor: '#f0f8ff',
  },
  setHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  setDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  setDetail: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },

  // Action Buttons
  actionButtonsContainer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },

  // Rest Timer Overlay
  restTimerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  restTimerContainer: {
    backgroundColor: '#1C1C1E',
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    margin: 20,
    minWidth: 320,
  },
  restTimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  restTimerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
  },
  restTimerExercise: {
    color: '#FFD700',
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  nextExerciseContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  nextExerciseLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 4,
  },
  nextExerciseName: {
    color: '#32D74B',
    fontSize: 16,
    fontWeight: '600',
  },
  restTimerTime: {
    color: 'white',
    fontSize: 72,
    fontWeight: '700',
    marginVertical: 20,
    fontVariant: ['tabular-nums'],
  },
  restTimerControls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  restTimerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF9500',
  },
  skipButton: {
    backgroundColor: '#FF3B30',
  },
  restTimerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

  // Program Selector Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 20,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  programInfo: {
    flex: 1,
  },
  programName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  programDetails: {
    fontSize: 14,
    color: '#666',
  },

  // Settings Modal
  settingsModalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  settingsModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '80%',
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  settingsCloseButton: {
    padding: 4,
  },
  settingsBody: {
    padding: 20,
  },
  settingItem: {
    marginBottom: 24,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  settingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#C7C7CC',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingSuffix: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    minWidth: 80,
  },
  settingsFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  settingsButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});