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
import { Program } from '../types';

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
  sets: string;
  reps: string;
  weight: string;
  restTime: string;
}

export default function CreateProgramScreen({ navigation }: Props) {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isSmallScreen = width < 375;
  
  const [programName, setProgramName] = useState('');
  const [selectedType, setSelectedType] = useState<Program['type']>('push');
  const [selectedColor, setSelectedColor] = useState('#007AFF');
  const [exercises, setExercises] = useState<ExerciseInput[]>([
    { id: Date.now().toString(), name: '', sets: '4', reps: '10', weight: '0', restTime: '90' }
  ]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      { id: Date.now().toString(), name: '', sets: '4', reps: '10', weight: '0', restTime: '90' }
    ]);
  };

  const removeExercise = (id: string) => {
    if (exercises.length === 1) {
      Alert.alert('Erreur', 'Un programme doit avoir au moins un exercice');
      return;
    }
    setExercises(exercises.filter(ex => ex.id !== id));
  };

  const updateExercise = (id: string, field: keyof ExerciseInput, value: string) => {
    setExercises(exercises.map(ex => 
      ex.id === id ? { ...ex, [field]: value } : ex
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

    try {
      const newProgram: Program = {
        id: Date.now().toString(),
        name: programName.trim(),
        type: selectedType,
        color: selectedColor,
        exercises: exercises.map(ex => ({
          id: ex.id,
          name: ex.name.trim(),
          sets: parseInt(ex.sets) || 0,
          reps: parseInt(ex.reps) || 0,
          weight: parseFloat(ex.weight) || 0,
          restTime: parseInt(ex.restTime) || 0,
          completed: false,
        })),
      };

      await storage.addProgram(newProgram);
      navigation.goBack();
    } catch (error) {
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

                <View style={[
                  styles.exerciseRow,
                  isLandscape && styles.exerciseRowLandscape
                ]}>
                  <View style={styles.exerciseInput}>
                    <Text style={[
                      styles.inputLabel,
                      isSmallScreen && styles.inputLabelSmall
                    ]}>Séries</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        isSmallScreen && styles.smallInputSmall
                      ]}
                      value={exercise.sets}
                      onChangeText={(value) => updateExercise(exercise.id, 'sets', value)}
                      keyboardType="number-pad"
                      placeholder="4"
                      placeholderTextColor="#C7C7CC"
                    />
                  </View>

                  <View style={styles.exerciseInput}>
                    <Text style={[
                      styles.inputLabel,
                      isSmallScreen && styles.inputLabelSmall
                    ]}>Reps</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        isSmallScreen && styles.smallInputSmall
                      ]}
                      value={exercise.reps}
                      onChangeText={(value) => updateExercise(exercise.id, 'reps', value)}
                      keyboardType="number-pad"
                      placeholder="10"
                      placeholderTextColor="#C7C7CC"
                    />
                  </View>

                  <View style={styles.exerciseInput}>
                    <Text style={[
                      styles.inputLabel,
                      isSmallScreen && styles.inputLabelSmall
                    ]}>Poids (kg)</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        isSmallScreen && styles.smallInputSmall
                      ]}
                      value={exercise.weight}
                      onChangeText={(value) => updateExercise(exercise.id, 'weight', value)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#C7C7CC"
                    />
                  </View>

                  <View style={styles.exerciseInput}>
                    <Text style={[
                      styles.inputLabel,
                      isSmallScreen && styles.inputLabelSmall
                    ]}>Repos (s)</Text>
                    <TextInput
                      style={[
                        styles.smallInput,
                        isSmallScreen && styles.smallInputSmall
                      ]}
                      value={exercise.restTime}
                      onChangeText={(value) => updateExercise(exercise.id, 'restTime', value)}
                      keyboardType="number-pad"
                      placeholder="90"
                      placeholderTextColor="#C7C7CC"
                    />
                  </View>
                </View>
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
  exerciseRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  exerciseRowLandscape: {
    gap: 6,
  },
  exerciseInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    textAlign: 'center',
  },
  inputLabelSmall: {
    fontSize: 11,
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 8,
    fontSize: 14,
    backgroundColor: '#fff',
    textAlign: 'center',
  },
  smallInputSmall: {
    padding: 6,
    fontSize: 13,
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