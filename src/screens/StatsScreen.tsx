import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  useWindowDimensions,
  StatusBar,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { storage } from '../utils/storage';
import { WorkoutSession, Exercise } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Stats'>;
};

export default function StatsScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    totalExercises: 0,
    completedExercises: 0,
    totalSets: 0,
    completedSets: 0,
    totalTime: 0,
    avgTime: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  const loadStats = async () => {
    try {
      const allSessions = await storage.loadSessions();
      setSessions(allSessions);
      calculateStats(allSessions);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const calculateStats = (allSessions: WorkoutSession[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const completedSessions = allSessions.filter(s => s.completed);
    
    // Calcul des statistiques avec la nouvelle structure de séries
    let totalSets = 0;
    let completedSets = 0;
    let totalExercises = 0;
    let completedExercises = 0;
    let totalTime = 0;

    allSessions.forEach(session => {
      // Compter les exercices complétés (tous les sets complétés)
      session.exercises.forEach(exercise => {
        totalExercises++;
        const exerciseSetsCount = exercise.sets.length;
        const completedExerciseSets = exercise.sets.filter(set => set.completed).length;
        
        totalSets += exerciseSetsCount;
        completedSets += completedExerciseSets;

        // Un exercice est considéré comme complété si tous ses sets sont complétés
        if (completedExerciseSets === exerciseSetsCount && exerciseSetsCount > 0) {
          completedExercises++;
        }
      });

      // Temps total des sessions complétées
      if (session.completed && session.duration) {
        totalTime += session.duration;
      }
    });

    const thisWeek = allSessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= weekAgo && s.completed;
    }).length;

    const thisMonth = allSessions.filter(s => {
      const sessionDate = new Date(s.date);
      return sessionDate >= monthAgo && s.completed;
    }).length;

    setStats({
      totalSessions: allSessions.length,
      completedSessions: completedSessions.length,
      totalExercises,
      completedExercises,
      totalSets,
      completedSets,
      totalTime,
      avgTime: completedSessions.length > 0 ? Math.round(totalTime / completedSessions.length) : 0,
      thisWeek,
      thisMonth,
    });
  };

  const clearHistory = () => {
    Alert.alert(
      "Effacer l'historique",
      "Êtes-vous sûr de vouloir supprimer toutes vos séances d'entraînement ? Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Effacer",
          style: "destructive",
          onPress: async () => {
            try {
              // Effacer toutes les sessions
              await storage.saveSessions([]);
              setSessions([]);
              calculateStats([]);
              Alert.alert("Succès", "L'historique a été effacé avec succès.");
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert("Erreur", "Impossible d'effacer l'historique.");
            }
          }
        }
      ]
    );
  };

  const clearAllData = () => {
    Alert.alert(
      "Effacer toutes les données",
      "Cette action supprimera TOUTES vos données (séances ET programmes). Cette action est irréversible.",
      [
        {
          text: "Annuler",
          style: "cancel"
        },
        {
          text: "Tout effacer",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.clearAllData();
              setSessions([]);
              calculateStats([]);
              Alert.alert("Succès", "Toutes les données ont été effacées avec succès.");
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert("Erreur", "Impossible d'effacer les données.");
            }
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) {
      return `${hrs}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const StatCard = ({ 
    icon, 
    title, 
    value, 
    color, 
    subtitle 
  }: { 
    icon: string; 
    title: string; 
    value: string; 
    color: string;
    subtitle?: string;
  }) => (
    <View style={[
      styles.statCard,
      isLandscape && styles.statCardLandscape,
      isSmallScreen && styles.statCardSmall
    ]}>
      <View style={[styles.statIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={isSmallScreen ? 20 : 24} color="#fff" />
      </View>
      <View style={styles.statContent}>
        <Text style={[
          styles.statTitle,
          isSmallScreen && styles.statTitleSmall
        ]}>{title}</Text>
        <Text style={[
          styles.statValue,
          isSmallScreen && styles.statValueSmall
        ]}>{value}</Text>
        {subtitle && (
          <Text style={[
            styles.statSubtitle,
            isSmallScreen && styles.statSubtitleSmall
          ]}>{subtitle}</Text>
        )}
      </View>
    </View>
  );

  // Fonction pour calculer le nombre d'exercices complétés dans une session
  const getCompletedExercisesCount = (session: WorkoutSession): number => {
    return session.exercises.filter(exercise => {
      // Un exercice est complété si tous ses sets sont complétés
      return exercise.sets.length > 0 && exercise.sets.every(set => set.completed);
    }).length;
  };

  // Fonction pour calculer le nombre total de sets dans une session
  const getTotalSetsCount = (session: WorkoutSession): number => {
    return session.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  };

  // Fonction pour calculer le nombre de sets complétés dans une session
  const getCompletedSetsCount = (session: WorkoutSession): number => {
    return session.exercises.reduce((total, exercise) => {
      return total + exercise.sets.filter(set => set.completed).length;
    }, 0);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* En-tête avec bouton d'effacement */}
        <View style={styles.header}>
          <Text style={[
            styles.headerTitle,
            isSmallScreen && styles.headerTitleSmall
          ]}>Statistiques</Text>
          {sessions.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={clearHistory}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Effacer</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Vue d'ensemble */}
        <View style={[
          styles.section,
          isLandscape && styles.sectionLandscape
        ]}>
          <Text style={[
            styles.sectionTitle,
            isSmallScreen && styles.sectionTitleSmall
          ]}>Vue d'ensemble</Text>
          
          <View style={[
            styles.statsGrid,
            isLandscape && styles.statsGridLandscape
          ]}>
            <StatCard
              icon="calendar"
              title="Séances totales"
              value={stats.totalSessions.toString()}
              color="#007AFF"
              subtitle={`${stats.completedSessions} terminées`}
            />

            <StatCard
              icon="fitness"
              title="Exercices"
              value={stats.completedExercises.toString()}
              color="#4CD964"
              subtitle={`${stats.totalExercises} au total`}
            />

            <StatCard
              icon="list"
              title="Séries"
              value={stats.completedSets.toString()}
              color="#FF9500"
              subtitle={`${stats.totalSets} au total`}
            />

            <StatCard
              icon="time"
              title="Temps total"
              value={formatTime(stats.totalTime)}
              color="#5856D6"
              subtitle={`Moyenne: ${formatTime(stats.avgTime)}`}
            />
          </View>
        </View>

        {/* Activité récente */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            isSmallScreen && styles.sectionTitleSmall
          ]}>Activité récente</Text>
          
          <View style={[
            styles.activityRow,
            isLandscape && styles.activityRowLandscape
          ]}>
            <View style={[
              styles.activityCard,
              isSmallScreen && styles.activityCardSmall
            ]}>
              <Text style={[
                styles.activityValue,
                isSmallScreen && styles.activityValueSmall
              ]}>{stats.thisWeek}</Text>
              <Text style={[
                styles.activityLabel,
                isSmallScreen && styles.activityLabelSmall
              ]}>Cette semaine</Text>
            </View>
            <View style={[
              styles.activityCard,
              isSmallScreen && styles.activityCardSmall
            ]}>
              <Text style={[
                styles.activityValue,
                isSmallScreen && styles.activityValueSmall
              ]}>{stats.thisMonth}</Text>
              <Text style={[
                styles.activityLabel,
                isSmallScreen && styles.activityLabelSmall
              ]}>Ce mois</Text>
            </View>
          </View>
        </View>

        {/* Progression */}
        <View style={styles.section}>
          <Text style={[
            styles.sectionTitle,
            isSmallScreen && styles.sectionTitleSmall
          ]}>Progression</Text>
          
          <View style={[
            styles.progressCard,
            isSmallScreen && styles.progressCardSmall
          ]}>
            <View style={styles.progressHeader}>
              <Text style={[
                styles.progressTitle,
                isSmallScreen && styles.progressTitleSmall
              ]}>Taux de complétion des séances</Text>
              <Text style={[
                styles.progressPercent,
                isSmallScreen && styles.progressPercentSmall
              ]}>
                {stats.totalSessions > 0 
                  ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                  : 0}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${stats.totalSessions > 0 
                      ? (stats.completedSessions / stats.totalSessions) * 100 
                      : 0}%` 
                  }
                ]} 
              />
            </View>
          </View>

          <View style={[
            styles.progressCard,
            isSmallScreen && styles.progressCardSmall
          ]}>
            <View style={styles.progressHeader}>
              <Text style={[
                styles.progressTitle,
                isSmallScreen && styles.progressTitleSmall
              ]}>Exercices complétés</Text>
              <Text style={[
                styles.progressPercent,
                isSmallScreen && styles.progressPercentSmall
              ]}>
                {stats.totalExercises > 0 
                  ? Math.round((stats.completedExercises / stats.totalExercises) * 100)
                  : 0}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${stats.totalExercises > 0 
                      ? (stats.completedExercises / stats.totalExercises) * 100 
                      : 0}%`,
                    backgroundColor: '#4CD964',
                  }
                ]} 
              />
            </View>
          </View>

          <View style={[
            styles.progressCard,
            isSmallScreen && styles.progressCardSmall
          ]}>
            <View style={styles.progressHeader}>
              <Text style={[
                styles.progressTitle,
                isSmallScreen && styles.progressTitleSmall
              ]}>Séries complétées</Text>
              <Text style={[
                styles.progressPercent,
                isSmallScreen && styles.progressPercentSmall
              ]}>
                {stats.totalSets > 0 
                  ? Math.round((stats.completedSets / stats.totalSets) * 100)
                  : 0}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${stats.totalSets > 0 
                      ? (stats.completedSets / stats.totalSets) * 100 
                      : 0}%`,
                    backgroundColor: '#FF9500',
                  }
                ]} 
              />
            </View>
          </View>
        </View>

        {/* Historique récent */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall
            ]}>Historique récent</Text>
            {sessions.filter(session => session.completed).length > 0 && (
              <TouchableOpacity 
                style={styles.clearAllButton}
                onPress={clearAllData}
              >
                <Text style={styles.clearAllButtonText}>Tout effacer</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {sessions
            .filter(session => session.completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map(session => (
            <View key={session.id} style={[
              styles.historyCard,
              isSmallScreen && styles.historyCardSmall
            ]}>
              <View style={styles.historyCardHeader}>
                <Text style={[
                  styles.historyDate,
                  isSmallScreen && styles.historyDateSmall
                ]}>
                  {new Date(session.date).toLocaleDateString('fr-FR', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </Text>
                <Ionicons name="checkmark-circle" size={isSmallScreen ? 16 : 20} color="#4CD964" />
              </View>
              <Text style={[
                styles.historyExercises,
                isSmallScreen && styles.historyExercisesSmall
              ]}>
                {getCompletedExercisesCount(session)}/{session.exercises.length} exercices
              </Text>
              <Text style={[
                styles.historySets,
                isSmallScreen && styles.historySetsSmall
              ]}>
                {getCompletedSetsCount(session)}/{getTotalSetsCount(session)} séries
              </Text>
              {session.duration && (
                <Text style={[
                  styles.historyDuration,
                  isSmallScreen && styles.historyDurationSmall
                ]}>{formatTime(session.duration)}</Text>
              )}
            </View>
          ))}

          {sessions.filter(session => session.completed).length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons 
                name="stats-chart-outline" 
                size={isSmallScreen ? 36 : 48} 
                color="#C7C7CC" 
              />
              <Text style={[
                styles.emptyText,
                isSmallScreen && styles.emptyTextSmall
              ]}>Aucune donnée disponible</Text>
              <Text style={[
                styles.emptySubtext,
                isSmallScreen && styles.emptySubtextSmall
              ]}>Commencez votre première séance !</Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  headerTitleSmall: {
    fontSize: 24,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
    gap: 6,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionLandscape: {
    marginHorizontal: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
  },
  sectionTitleSmall: {
    fontSize: 18,
    marginBottom: 12,
  },
  statsGrid: {
    gap: 12,
  },
  statsGridLandscape: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  statCardLandscape: {
    flex: 1,
    minWidth: '45%',
    marginBottom: 12,
  },
  statCardSmall: {
    padding: 12,
    gap: 10,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statTitleSmall: {
    fontSize: 13,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  statValueSmall: {
    fontSize: 20,
  },
  statSubtitle: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  statSubtitleSmall: {
    fontSize: 12,
  },
  activityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  activityRowLandscape: {
    justifyContent: 'space-between',
  },
  activityCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  activityCardSmall: {
    padding: 16,
  },
  activityValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  activityValueSmall: {
    fontSize: 28,
  },
  activityLabel: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  activityLabelSmall: {
    fontSize: 13,
  },
  progressCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  progressCardSmall: {
    padding: 12,
    marginBottom: 10,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  progressTitleSmall: {
    fontSize: 14,
  },
  progressPercent: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  progressPercentSmall: {
    fontSize: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clearAllButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearAllButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  historyCardSmall: {
    padding: 10,
    marginBottom: 6,
  },
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    textTransform: 'capitalize',
  },
  historyDateSmall: {
    fontSize: 14,
  },
  historyExercises: {
    fontSize: 14,
    color: '#8E8E93',
  },
  historyExercisesSmall: {
    fontSize: 13,
  },
  historySets: {
    fontSize: 13,
    color: '#8E8E93',
  },
  historySetsSmall: {
    fontSize: 12,
  },
  historyDuration: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  historyDurationSmall: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 12,
  },
  emptyTextSmall: {
    fontSize: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#C7C7CC',
    marginTop: 4,
  },
  emptySubtextSmall: {
    fontSize: 14,
  },
});