import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Alert,
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
import { defaultPrograms } from '../data/defaultData';
import { Program } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Programs'>;
};

export default function ProgramsScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  
  const [programs, setPrograms] = useState<Program[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadPrograms();
    }, [])
  );

  const loadPrograms = async () => {
    try {
      const saved = await storage.loadPrograms();
      if (saved.length === 0) {
        await storage.savePrograms(defaultPrograms);
        setPrograms(defaultPrograms);
      } else {
        setPrograms(saved);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des programmes:', error);
      Alert.alert('Erreur', 'Impossible de charger les programmes');
    }
  };

  const handleDeleteProgram = (program: Program) => {
    Alert.alert(
      'Supprimer le programme',
      `Êtes-vous sûr de vouloir supprimer "${program.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await storage.deleteProgram(program.id);
              loadPrograms();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le programme');
            }
          }
        }
      ]
    );
  };

  const renderProgramCard = ({ item }: { item: Program }) => (
    <View style={[
      styles.programCard,
      isLandscape && styles.programCardLandscape,
      isSmallScreen && styles.programCardSmall
    ]}>
      <TouchableOpacity
        style={styles.programContent}
        onPress={() => navigation.navigate('EditProgram', { program: item })}
      >
        <View style={[
          styles.programIcon, 
          { backgroundColor: item.color },
          isSmallScreen && styles.programIconSmall
        ]}>
          <Ionicons name="fitness" size={isSmallScreen ? 20 : 24} color="#fff" />
        </View>
        <View style={styles.programInfo}>
          <Text style={[
            styles.programName,
            isSmallScreen && styles.programNameSmall
          ]}>{item.name}</Text>
          <Text style={[
            styles.programDetails,
            isSmallScreen && styles.programDetailsSmall
          ]}>
            {item.exercises.length} exercices
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={isSmallScreen ? 18 : 20} color="#C7C7CC" />
      </TouchableOpacity>
      <View style={styles.programActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isSmallScreen && styles.actionButtonSmall
          ]}
          onPress={() => navigation.navigate('EditProgram', { program: item })}
        >
          <Ionicons name="create-outline" size={isSmallScreen ? 18 : 20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isSmallScreen && styles.actionButtonSmall
          ]}
          onPress={() => handleDeleteProgram(item)}
        >
          <Ionicons name="trash-outline" size={isSmallScreen ? 18 : 20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <FlatList
          data={programs}
          keyExtractor={item => item.id}
          renderItem={renderProgramCard}
          contentContainerStyle={[
            styles.listContent,
            isLandscape && styles.listContentLandscape,
            programs.length === 0 && styles.listContentEmpty
          ]}
          numColumns={isLandscape ? 2 : 1}
          columnWrapperStyle={isLandscape ? styles.columnWrapper : undefined}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons 
                name="fitness-outline" 
                size={isSmallScreen ? 48 : 64} 
                color="#C7C7CC" 
              />
              <Text style={[
                styles.emptyText,
                isSmallScreen && styles.emptyTextSmall
              ]}>Aucun programme</Text>
              <Text style={[
                styles.emptySubtext,
                isSmallScreen && styles.emptySubtextSmall
              ]}>Créez votre premier programme</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity
          style={[
            styles.addButton,
            isSmallScreen && styles.addButtonSmall
          ]}
          onPress={() => navigation.navigate('CreateProgram')}
        >
          <Ionicons name="add" size={isSmallScreen ? 24 : 28} color="#fff" />
        </TouchableOpacity>
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
  listContent: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 80, // Espace pour le bouton flottant
  },
  listContentLandscape: {
    paddingHorizontal: 8,
  },
  listContentEmpty: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 0,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: 12,
  },
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  programCardLandscape: {
    flex: 1,
    marginHorizontal: 4,
    minWidth: '48%',
  },
  programCardSmall: {
    marginBottom: 8,
  },
  programContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  programIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  programIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  programNameSmall: {
    fontSize: 16,
  },
  programDetails: {
    fontSize: 15,
    color: '#8E8E93',
  },
  programDetailsSmall: {
    fontSize: 14,
  },
  programActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonSmall: {
    paddingVertical: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyTextSmall: {
    fontSize: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#C7C7CC',
    marginTop: 8,
  },
  emptySubtextSmall: {
    fontSize: 14,
  },
  addButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 34 : 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonSmall: {
    width: 50,
    height: 50,
    borderRadius: 25,
    bottom: Platform.OS === 'ios' ? 28 : 20,
    right: 20,
  },
});