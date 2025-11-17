import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { storage } from '../utils/storage';
import { PersonalRecord } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PRScreen'>;
};

export default function PRScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  
  const [prs, setPRs] = useState<PersonalRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPRs();
    }, [])
  );

  const loadPRs = async () => {
    const records = await storage.loadPRs();
    // Trier par exercice puis par poids décroissant
    records.sort((a, b) => {
      if (a.exerciseName < b.exerciseName) return -1;
      if (a.exerciseName > b.exerciseName) return 1;
      return b.weight - a.weight;
    });
    setPRs(records);
  };

  const clearPRs = () => {
    Alert.alert(
      'Effacer tous les records',
      'Êtes-vous sûr de vouloir supprimer tous vos records personnels ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: async () => {
            await storage.savePRs([]);
            setPRs([]);
          },
        },
      ]
    );
  };

  const groupedPRs = prs.reduce((groups, pr) => {
    if (!groups[pr.exerciseName]) {
      groups[pr.exerciseName] = [];
    }
    groups[pr.exerciseName].push(pr);
    return groups;
  }, {} as { [key: string]: PersonalRecord[] });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[
            styles.title,
            isSmallScreen && styles.titleSmall
          ]}>Records Personnels</Text>
          {prs.length > 0 && (
            <TouchableOpacity onPress={clearPRs} style={styles.clearButton}>
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>

        {Object.keys(groupedPRs).length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={isSmallScreen ? 48 : 64} color="#C7C7CC" />
            <Text style={[
              styles.emptyText,
              isSmallScreen && styles.emptyTextSmall
            ]}>Aucun record encore</Text>
            <Text style={[
              styles.emptySubtext,
              isSmallScreen && styles.emptySubtextSmall
            ]}>
              Complétez des séries lourdes pour établir vos records !
            </Text>
          </View>
        ) : (
          Object.entries(groupedPRs).map(([exerciseName, records]) => (
            <View key={exerciseName} style={[
              styles.exerciseGroup,
              isLandscape && styles.exerciseGroupLandscape
            ]}>
              <Text style={[
                styles.exerciseName,
                isSmallScreen && styles.exerciseNameSmall
              ]}>{exerciseName}</Text>
              {records.map((pr) => (
                <View key={pr.id} style={[
                  styles.prCard,
                  isSmallScreen && styles.prCardSmall
                ]}>
                  <View style={styles.prHeader}>
                    <Text style={[
                      styles.prWeight,
                      isSmallScreen && styles.prWeightSmall
                    ]}>{pr.weight} kg</Text>
                    <Ionicons name="trophy" size={isSmallScreen ? 18 : 20} color="#FF9500" />
                  </View>
                  <Text style={[
                    styles.prDetails,
                    isSmallScreen && styles.prDetailsSmall
                  ]}>
                    {pr.reps} reps • {new Date(pr.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
              ))}
            </View>
          ))
        )}
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
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  titleSmall: {
    fontSize: 22,
  },
  clearButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyTextSmall: {
    fontSize: 17,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
  },
  emptySubtextSmall: {
    fontSize: 13,
  },
  exerciseGroup: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  exerciseGroupLandscape: {
    marginHorizontal: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseNameSmall: {
    fontSize: 17,
  },
  prCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  prCardSmall: {
    padding: 12,
  },
  prHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  prWeight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  prWeightSmall: {
    fontSize: 18,
  },
  prDetails: {
    fontSize: 14,
    color: '#8E8E93',
  },
  prDetailsSmall: {
    fontSize: 13,
  },
});