import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  useWindowDimensions,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { storage } from '../utils/storage';
import { WorkoutSession } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export default function HomeScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [monthSessions, setMonthSessions] = useState<WorkoutSession[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [currentDate, selectedDate])
  );

  const loadData = async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const monthData = await storage.getSessionsByMonth(year, month);
      setMonthSessions(monthData);

      const dateStr = formatDate(selectedDate);
      const daySessions = await storage.getSessionsByDate(dateStr);
      setSessions(daySessions);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Lundi = 0

    const days = [];
    
    // Jours du mois précédent
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ date: null, isCurrentMonth: false });
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    return days;
  };

  const hasWorkoutOnDate = (date: Date): boolean => {
    const dateStr = formatDate(date);
    return monthSessions.some(s => s.date === dateStr);
  };

  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date): boolean => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const handleDayPress = (date: Date) => {
    setSelectedDate(date);
  };

  const handleStartWorkout = () => {
    const dateStr = formatDate(selectedDate);
    navigation.navigate('Workout', { date: dateStr });
  };

  const days = getDaysInMonth(currentDate);
  const cellSize = (Math.min(width, 500) - 32) / 7;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* En-tête du calendrier */}
          <View style={[
            styles.calendarHeader,
            isLandscape && styles.calendarHeaderLandscape
          ]}>
            <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.monthButton}>
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={[
              styles.monthYear,
              isSmallScreen && styles.monthYearSmall
            ]}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={() => changeMonth(1)} style={styles.monthButton}>
              <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Jours de la semaine */}
          <View style={[
            styles.weekDays,
            isLandscape && styles.weekDaysLandscape
          ]}>
            {DAYS.map(day => (
              <Text key={day} style={[
                styles.weekDay,
                isSmallScreen && styles.weekDaySmall
              ]}>{day}</Text>
            ))}
          </View>

          {/* Grille du calendrier */}
          <View style={[
            styles.calendar,
            isLandscape && styles.calendarLandscape
          ]}>
            {days.map((day, index) => {
              if (!day.date) {
                return <View key={`empty-${index}`} style={[styles.dayCell, { width: cellSize, height: cellSize }]} />;
              }

              const hasWorkout = hasWorkoutOnDate(day.date);
              const isTodayDate = isToday(day.date);
              const isSelectedDate = isSelected(day.date);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    { width: cellSize, height: cellSize },
                    isSelectedDate && styles.selectedDay,
                    isTodayDate && !isSelectedDate && styles.todayDay,
                  ]}
                  onPress={() => handleDayPress(day.date!)}
                >
                  <Text style={[
                    styles.dayText,
                    isSmallScreen && styles.dayTextSmall,
                    isSelectedDate && styles.selectedDayText,
                    isTodayDate && !isSelectedDate && styles.todayText,
                  ]}>
                    {day.date.getDate()}
                  </Text>
                  {hasWorkout && (
                    <View style={[
                      styles.workoutDot,
                      isSelectedDate && styles.workoutDotSelected
                    ]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Séances du jour sélectionné */}
          <View style={[
            styles.selectedDateSection,
            isLandscape && styles.selectedDateSectionLandscape
          ]}>
            <Text style={[
              styles.selectedDateTitle,
              isSmallScreen && styles.selectedDateTitleSmall
            ]}>
              {selectedDate.toLocaleDateString('fr-FR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </Text>

            {sessions.length === 0 ? (
              <View style={[
                styles.noWorkout,
                isSmallScreen && styles.noWorkoutSmall
              ]}>
                <Ionicons 
                  name="fitness-outline" 
                  size={isSmallScreen ? 36 : 48} 
                  color="#C7C7CC" 
                />
                <Text style={[
                  styles.noWorkoutText,
                  isSmallScreen && styles.noWorkoutTextSmall
                ]}>Aucune séance prévue</Text>
                <TouchableOpacity 
                  style={[
                    styles.startButton,
                    isSmallScreen && styles.startButtonSmall
                  ]} 
                  onPress={handleStartWorkout}
                >
                  <Ionicons name="add-circle" size={isSmallScreen ? 18 : 20} color="#fff" />
                  <Text style={[
                    styles.startButtonText,
                    isSmallScreen && styles.startButtonTextSmall
                  ]}>Commencer une séance</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {sessions.map(session => (
                  <TouchableOpacity
                    key={session.id}
                    style={[
                      styles.sessionCard,
                      isSmallScreen && styles.sessionCardSmall
                    ]}
                    onPress={() => navigation.navigate('Workout', { date: formatDate(selectedDate) })}
                  >
                    <View style={styles.sessionHeader}>
                      <Text style={[
                        styles.sessionTitle,
                        isSmallScreen && styles.sessionTitleSmall
                      ]}>Séance d'entraînement</Text>
                      {session.completed && (
                        <Ionicons name="checkmark-circle" size={isSmallScreen ? 20 : 24} color="#4CD964" />
                      )}
                    </View>
                    <Text style={[
                      styles.sessionInfo,
                      isSmallScreen && styles.sessionInfoSmall
                    ]}>
                      {session.exercises.length} exercices • 
                      {session.duration ? ` ${Math.floor(session.duration / 60)}min` : ' Non terminée'}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${(session.exercises.filter(e => e.completed).length / session.exercises.length) * 100}%` }
                        ]} 
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Boutons d'action */}
        <View style={[
          styles.actionButtons,
          isLandscape && styles.actionButtonsLandscape,
          isSmallScreen && styles.actionButtonsSmall
        ]}>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isSmallScreen && styles.actionButtonSmall
            ]}
            onPress={() => navigation.navigate('Programs')}
          >
            <Ionicons name="list" size={isSmallScreen ? 20 : 24} color="#007AFF" />
            <Text style={[
              styles.actionButtonText,
              isSmallScreen && styles.actionButtonTextSmall
            ]}>Programmes</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.actionButton,
              isSmallScreen && styles.actionButtonSmall
            ]}
            onPress={() => navigation.navigate('Stats')}
          >
            <Ionicons name="stats-chart" size={isSmallScreen ? 20 : 24} color="#007AFF" />
            <Text style={[
              styles.actionButtonText,
              isSmallScreen && styles.actionButtonTextSmall
            ]}>Statistiques</Text>
          </TouchableOpacity>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  calendarHeaderLandscape: {
    paddingVertical: 12,
  },
  monthButton: {
    padding: 8,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  monthYearSmall: {
    fontSize: 18,
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  weekDaysLandscape: {
    marginBottom: 4,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  weekDaySmall: {
    fontSize: 13,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  calendarLandscape: {
    paddingVertical: 4,
  },
  dayCell: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  selectedDay: {
    backgroundColor: '#007AFF',
    borderRadius: 999,
  },
  todayDay: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 999,
  },
  dayText: {
    fontSize: 16,
    color: '#000',
  },
  dayTextSmall: {
    fontSize: 14,
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: '700',
  },
  todayText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  workoutDot: {
    position: 'absolute',
    bottom: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4CD964',
  },
  workoutDotSelected: {
    backgroundColor: '#fff',
  },
  selectedDateSection: {
    padding: 16,
    marginTop: 16,
  },
  selectedDateSectionLandscape: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  selectedDateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  selectedDateTitleSmall: {
    fontSize: 16,
    marginBottom: 12,
  },
  noWorkout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  noWorkoutSmall: {
    padding: 24,
  },
  noWorkoutText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  noWorkoutTextSmall: {
    fontSize: 15,
    marginTop: 8,
    marginBottom: 16,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  startButtonSmall: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  startButtonTextSmall: {
    fontSize: 15,
  },
  sessionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sessionCardSmall: {
    padding: 12,
    marginBottom: 8,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
  },
  sessionTitleSmall: {
    fontSize: 16,
  },
  sessionInfo: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 12,
  },
  sessionInfoSmall: {
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CD964',
    borderRadius: 2,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    gap: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButtonsLandscape: {
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 12,
  },
  actionButtonsSmall: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonSmall: {
    paddingVertical: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  actionButtonTextSmall: {
    fontSize: 15,
  },
});