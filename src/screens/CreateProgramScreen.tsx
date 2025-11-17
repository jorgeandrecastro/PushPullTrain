import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  useWindowDimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../App';
import { storage } from '../utils/storage';
import { Program, Exercise, ExerciseSet } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'CreateProgram'>;
};

const PROGRAM_TYPES = [
  { id: 'push' as const, name: 'Push', color: '#007AFF', icon: 'arrow-up' },
  { id: 'pull' as const, name: 'Pull', color: '#FF3B30', icon: 'arrow-down' },
  { id: 'legs' as const, name: 'Legs', color: '#4CD964', icon: 'walk' },
  { id: 'fullbody' as const, name: 'Full Body', color: '#FF9500', icon: 'body' },
  { id: 'custom' as const, name: 'Personnalisé', color: '#5856D6', icon: 'create' },
];

interface ExerciseInput {
  id: string;
  name: string;
  restTime: string;
  sets: ExerciseSet[];
}

const ExerciseSetManager: React.FC<{
  sets: ExerciseSet[];
  onChange: (sets: ExerciseSet[]) => void;
}> = ({ sets, onChange }) => {
  const addSet = () => {
    const newSet: ExerciseSet = {
      id: `set-${Date.now()}-${Math.random()}`,
      setNumber: sets.length + 1,
      reps: 8,
      weight: 0,
      completed: false
    };
    onChange([...sets, newSet]);
  };

  const updateSet = (index: number, field: keyof ExerciseSet, value: any) => {
    const newSets = [...sets];
    let processedValue = value;
    
    if (field === 'reps') {
      processedValue = Math.max(0, parseInt(value) || 0);
    } else if (field === 'weight') {
      processedValue = Math.max(0, parseFloat(value) || 0);
    }
    
    newSets[index] = { ...newSets[index], [field]: processedValue };
    onChange(newSets);
  };

  const removeSet = (index: number) => {
    const newSets = sets.filter((_, i) => i !== index)
      .map((set, i) => ({ ...set, setNumber: i + 1 }));
    onChange(newSets);
  };

  return (
    <View style={styles.setsContainer}>
      <Text style={styles.setsTitle}>Séries :</Text>
      {sets.map((set, index) => (
        <View key={set.id} style={styles.setRow}>
          <Text style={styles.setNumber}>Série {set.setNumber}</Text>
          <TextInput
            style={styles.smallInput}
            placeholder="Reps"
            keyboardType="numeric"
            value={set.reps.toString()}
            onChangeText={(text) => updateSet(index, 'reps', text)}
          />
          <TextInput
            style={styles.smallInput}
            placeholder="Poids"
            keyboardType="numeric"
            value={set.weight.toString()}
            onChangeText={(text) => updateSet(index, 'weight', text)}
          />
          <TouchableOpacity onPress={() => removeSet(index)} style={styles.removeSetButton}>
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={addSet} style={styles.addSetButton}>
        <Ionicons name="add-circle" size={20} color="#007AFF" />
        <Text style={styles.addSetText}>Ajouter une série</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function CreateProgramScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  
  const [programName, setProgramName] = useState('');
  const [selectedType, setSelectedType] = useState<Program['type']>('push');
  const [selectedColor, setSelectedColor] = useState('#007AFF');
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { 
      id: Date.now().toString(), 
      name: '', 
      restTime: '90',
      sets: [
        {
          id: `set-${Date.now()}-1`,
          setNumber: 1,
          reps: 8,
          weight: 0,
          completed: false
        }
      ]
    }
  ]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { 
        id: Date.now().toString(), 
        name: '', 
        restTime: '90',
        sets: [
          {
            id: `set-${Date.now()}-1`,
            setNumber: 1,
            reps: 8,
            weight: 0,
            completed: false
          }
        ]
      }
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length === 1) {
      Alert.alert('Erreur', 'Un programme doit avoir au moins un exercice');
      return;
    }
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof ExerciseInput, value: any) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
    ));
  };

  const updateExerciseSets = (id: string, sets: ExerciseSet[]) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, sets } : ex
    ));
  };

  const handleCreate = async () => {
    if (!programName.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom au programme');
      return;
    }

    const emptyExercise = exercises.find(ex => !ex.name.trim());
    if (emptyExercise) {
      Alert.alert('Erreur', 'Tous les exercices doivent avoir un nom');
      return;
    }

    const emptySets = exercises.find(ex => ex.sets.length === 0);
    if (emptySets) {
      Alert.alert('Erreur', 'Tous les exercices doivent avoir au moins une série');
      return;
    }

    try {
      const newProgram: Program = {
        id: Date.now().toString(),
        name: programName.trim(),
        type: selectedType,
        color: selectedColor,
        exercises: exercises.map(ex => ({
          id: ex.id,
          name: ex.name.trim(),
          sets: ex.sets,
          restTime: parseInt(ex.restTime) || 90,
          completed: false,
        })),
      };

      await storage.addProgram(newProgram);
      navigation.goBack();
    } catch (error) {
      console.error('Error creating program:', error);
      Alert.alert('Erreur', 'Impossible de créer le programme');
    }
  };

  const handleTypeSelect = (type: Program['type'], color: string) => {
    setSelectedType(type);
    setSelectedColor(color);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'android' ? '#f8f9fa' : undefined}
        translucent={Platform.OS === 'android'}
      />
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : StatusBar.currentHeight}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={[
            styles.scrollContent,
            Platform.OS === 'android' && styles.scrollContentAndroid
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Nom du programme */}
          <View style={[
            styles.section,
            isLandscape && styles.sectionLandscape
          ]}>
            <Text style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall
            ]}>Nom du programme</Text>
            <TextInput
              style={[
                styles.input,
                isSmallScreen && styles.inputSmall
              ]}
              value={programName}
              onChangeText={setProgramName}
              placeholder="Ex: Push Day, Full Body..."
              placeholderTextColor="#C7C7CC"
            />
          </View>

          {/* Type de programme */}
          <View style={[
            styles.section,
            isLandscape && styles.sectionLandscape
          ]}>
            <Text style={[
              styles.sectionTitle,
              isSmallScreen && styles.sectionTitleSmall
            ]}>Type de programme</Text>
            <View style={[
              styles.typeGrid,
              isLandscape && styles.typeGridLandscape
            ]}>
              {PROGRAM_TYPES.map(type => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeCard,
                    isSmallScreen && styles.typeCardSmall,
                    isLandscape && styles.typeCardLandscape,
                    selectedType === type.id && { 
                      borderColor: type.color,
                      borderWidth: 2,
                    }
                  ]}
                  onPress={() => handleTypeSelect(type.id, type.color)}
                >
                  <View style={[
                    styles.typeIcon, 
                    { backgroundColor: type.color },
                    isSmallScreen && styles.typeIconSmall
                  ]}>
                    <Ionicons name={type.icon as any} size={isSmallScreen ? 18 : 20} color="#fff" />
                  </View>
                  <Text style={[
                    styles.typeName,
                    isSmallScreen && styles.typeNameSmall
                  ]}>{type.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Exercices */}
          <View style={[
            styles.section,
            isLandscape && styles.sectionLandscape
          ]}>
            <View style={styles.exercisesHeader}>
              <Text style={[
                styles.sectionTitle,
                isSmallScreen && styles.sectionTitleSmall
              ]}>Exercices</Text>
              <TouchableOpacity onPress={addExercise} style={styles.addExerciseBtn}>
                <Ionicons name="add-circle" size={isSmallScreen ? 22 : 24} color="#007AFF" />
              </TouchableOpacity>
            </View>

            {exercises.map((exercise, index) => (
              <View key={exercise.id} style={[
                styles.exerciseCard,
                isSmallScreen && styles.exerciseCardSmall
              ]}>
                <View style={styles.exerciseHeader}>
                  <Text style={[
                    styles.exerciseNumber,
                    isSmallScreen && styles.exerciseNumberSmall
                  ]}>#{index + 1}</Text>
                  {exercises.length > 1 && (
                    <TouchableOpacity onPress={() => removeExercise(exercise.id)}>
                      <Ionicons name="trash-outline" size={isSmallScreen ? 18 : 20} color="#FF3B30" />
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={[
                    styles.input,
                    isSmallScreen && styles.inputSmall
                  ]}
                  value={exercise.name}
                  onChangeText={(value) => updateExercise(exercise.id, 'name', value)}
                  placeholder="Nom de l'exercice"
                  placeholderTextColor="#C7C7CC"
                />

                <View style={styles.restTimeContainer}>
                  <Text style={styles.restTimeLabel}>Temps de repos entre les séries (secondes)</Text>
                  <TextInput
                    style={styles.restTimeInput}
                    value={exercise.restTime}
                    onChangeText={(value) => updateExercise(exercise.id, 'restTime', value)}
                    keyboardType="number-pad"
                    placeholder="90"
                    placeholderTextColor="#C7C7CC"
                  />
                </View>

                <ExerciseSetManager
                  sets={exercise.sets}
                  onChange={(sets) => updateExerciseSets(exercise.id, sets)}
                />
              </View>
            ))}
          </View>

          <TouchableOpacity style={[
            styles.createButton,
            isSmallScreen && styles.createButtonSmall
          ]} onPress={handleCreate}>
            <Text style={[
              styles.createButtonText,
              isSmallScreen && styles.createButtonTextSmall
            ]}>Créer le programme</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContentAndroid: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
    marginBottom: 12,
  },
  sectionTitleSmall: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputSmall: {
    padding: 10,
    fontSize: 15,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeGridLandscape: {
    gap: 8,
  },
  typeCard: {
    width: '47%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  typeCardSmall: {
    padding: 12,
    width: '46%',
  },
  typeCardLandscape: {
    width: '31%',
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeIconSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 6,
  },
  typeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
  typeNameSmall: {
    fontSize: 14,
  },
  exercisesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addExerciseBtn: {
    padding: 4,
  },
  exerciseCard: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  exerciseCardSmall: {
    padding: 10,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#007AFF',
  },
  exerciseNumberSmall: {
    fontSize: 14,
  },
  restTimeContainer: {
    marginTop: 12,
  },
  restTimeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
  },
  restTimeInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  // Styles pour le gestionnaire de séries
  setsContainer: {
    marginTop: 12,
  },
  setsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  setNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 70,
  },
  smallInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  removeSetButton: {
    padding: 4,
  },
  addSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    gap: 8,
  },
  addSetText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  createButtonSmall: {
    margin: 12,
    marginBottom: 16,
    padding: 14,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  createButtonTextSmall: {
    fontSize: 16,
  },
});