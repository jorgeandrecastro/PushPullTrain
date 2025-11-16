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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { storage } from '../utils/storage';
import { WorkoutSession, Exercise, Program } from '../types';

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
  const [restTimer, setRestTimer] = useState(0);
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (restTimer > 0) {
      interval = setInterval(() => {
        setRestTimer(t => {
          if (t <= 1) {
            Alert.alert('Repos terminé !', 'Prêt pour la prochaine série ?');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const loadData = async () => {
    try {
      const sessions = await storage.getSessionsByDate(date);
      const progs = await storage.loadPrograms();
      setPrograms(progs);

      if (sessions.length > 0) {
        setSession(sessions[0]);
        if (sessions[0].startTime && !sessions[0].endTime) {
          setIsTimerRunning(true);
          const start = new Date(sessions[0].startTime).getTime();
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
        exercises: program.exercises.map(ex => ({ ...ex, completed: false })),
        completed: false,
      };
      await storage.addSession(newSession);
      setSession(newSession);
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

  const toggleExercise = async (exerciseId: string) => {
    if (!session) return;
    
    const exercise = session.exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const updatedExercises = session.exercises.map(ex =>
      ex.id === exerciseId ? { ...ex, completed: !ex.completed } : ex
    );

    if (!exercise.completed && exercise.restTime > 0) {
      setRestTimer(exercise.restTime);
      setActiveExerciseId(exerciseId);
    }

    try {
      const updatedSession = { ...session, exercises: updatedExercises };
      await storage.updateSession(updatedSession);
      setSession(updatedSession);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'exercice');
    }
  };

  const finishWorkout = async () => {
    if (!session) return;

    Alert.alert(
      'Terminer la séance',
      'Voulez-vous vraiment terminer cette séance ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
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
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  if (!session) {
    return (
      <Modal visible={showProgramSelector} animationType="slide">
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choisir un programme</Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Ionicons name="close" size={28} color="#000" />
              </TouchableOpacity>
            </View>
            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
            >
              {programs.map(program => (
                <TouchableOpacity
                  key={program.id}
                  style={[
                    styles.programCard,
                    isLandscape && styles.programCardLandscape
                  ]}
                  onPress={() => createSessionFromProgram(program)}
                >
                  <View style={[styles.programIcon, { backgroundColor: program.color }]}>
                    <Ionicons name="fitness" size={24} color="#fff" />
                  </View>
                  <View style={styles.programInfo}>
                    <Text style={styles.programName}>{program.name}</Text>
                    <Text style={styles.programDetails}>
                      {program.exercises.length} exercices
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

  const completedCount = session.exercises.filter(e => e.completed).length;
  const totalCount = session.exercises.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={[
        styles.container,
        isLandscape && styles.containerLandscape
      ]}>
        {/* Header avec timer */}
        <View style={[
          styles.timerSection,
          isLandscape && styles.timerSectionLandscape
        ]}>
          <Text style={styles.timerLabel}>Durée de la séance</Text>
          <Text style={[
            styles.timerText,
            isLandscape && styles.timerTextLandscape
          ]}>
            {formatTime(timer)}
          </Text>
          {!session.startTime && (
            <TouchableOpacity style={styles.startButton} onPress={startWorkout}>
              <Ionicons name="play" size={20} color="#fff" />
              <Text style={styles.startButtonText}>Démarrer</Text>
            </TouchableOpacity>
          )}
          {session.startTime && !session.endTime && (
            <View style={styles.progressSection}>
              <Text style={styles.progressText}>
                {completedCount} / {totalCount} exercices
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` }]} />
              </View>
            </View>
          )}
        </View>

        {/* Timer de repos */}
        {restTimer > 0 && (
          <View style={styles.restTimerSection}>
            <Ionicons name="timer-outline" size={24} color="#FF3B30" />
            <Text style={styles.restTimerText}>Repos: {formatTime(restTimer)}</Text>
            <TouchableOpacity onPress={() => setRestTimer(0)}>
              <Ionicons name="close-circle" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        )}

        {/* Contenu principal */}
        <View style={[
          styles.mainContent,
          isLandscape && styles.mainContentLandscape
        ]}>
          {/* Liste des exercices */}
          <ScrollView 
            style={styles.exercisesList}
            contentContainerStyle={styles.exercisesListContent}
          >
            {session.exercises.map((exercise, index) => (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseCard,
                  exercise.completed && styles.exerciseCardCompleted
                ]}
                onPress={() => toggleExercise(exercise.id)}
              >
                <View style={styles.exerciseNumber}>
                  {exercise.completed ? (
                    <Ionicons name="checkmark-circle" size={28} color="#4CD964" />
                  ) : (
                    <Text style={styles.exerciseNumberText}>{index + 1}</Text>
                  )}
                </View>
                <View style={styles.exerciseContent}>
                  <Text style={[
                    styles.exerciseName,
                    exercise.completed && styles.exerciseNameCompleted
                  ]}>
                    {exercise.name}
                  </Text>
                  <Text style={styles.exerciseDetails}>
                    {exercise.sets} × {exercise.reps} reps
                    {exercise.weight > 0 && ` • ${exercise.weight}kg`}
                    {exercise.restTime > 0 && ` • ${exercise.restTime}s repos`}
                  </Text>
                </View>
                <Ionicons 
                  name={exercise.completed ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={exercise.completed ? "#4CD964" : "#C7C7CC"} 
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Bouton terminer */}
          {session.startTime && !session.endTime && (
            <View style={styles.finishButtonContainer}>
              <TouchableOpacity style={styles.finishButton} onPress={finishWorkout}>
                <Text style={styles.finishButtonText}>Terminer la séance</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  containerLandscape: {
    flexDirection: 'row',
  },
  timerSection: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  timerSectionLandscape: {
    flex: 1,
    justifyContent: 'center',
    borderBottomWidth: 0,
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  timerLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#000',
    fontVariant: ['tabular-nums'],
  },
  timerTextLandscape: {
    fontSize: 36,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
    gap: 8,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  progressSection: {
    width: '100%',
    marginTop: 16,
  },
  progressText: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CD964',
  },
  restTimerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    gap: 12,
  },
  restTimerText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FF3B30',
    fontVariant: ['tabular-nums'],
  },
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
    padding: 16,
    paddingBottom: 8,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  exerciseCardCompleted: {
    opacity: 0.6,
  },
  exerciseNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exerciseNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  exerciseContent: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  exerciseNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#8E8E93',
  },
  exerciseDetails: {
    fontSize: 15,
    color: '#8E8E93',
  },
  finishButtonContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  finishButton: {
    backgroundColor: '#4CD964',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  finishButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    padding: 16,
  },
  programCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  programCardLandscape: {
    marginBottom: 8,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 15,
    color: '#8E8E93',
  },
});