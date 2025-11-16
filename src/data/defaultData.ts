import { Program } from '../types';

export const defaultPrograms: Program[] = [
  {
    id: '1',
    name: 'Push Day',
    type: 'push',
    color: '#007AFF',
    exercises: [
      {
        id: '1-1',
        name: 'Développé Couché',
        sets: 4,
        reps: 8,
        weight: 80,
        restTime: 90,
        completed: false
      },
      {
        id: '1-2',
        name: 'Développé Incliné',
        sets: 3,
        reps: 10,
        weight: 60,
        restTime: 75,
        completed: false
      },
      {
        id: '1-3',
        name: 'Développé Militaire',
        sets: 4,
        reps: 10,
        weight: 50,
        restTime: 75,
        completed: false
      },
      {
        id: '1-4',
        name: 'Dips',
        sets: 3,
        reps: 12,
        weight: 0,
        restTime: 60,
        completed: false
      }
    ]
  },
  {
    id: '2',
    name: 'Pull Day',
    type: 'pull',
    color: '#FF3B30',
    exercises: [
      {
        id: '2-1',
        name: 'Tractions',
        sets: 4,
        reps: 8,
        weight: 0,
        restTime: 90,
        completed: false
      },
      {
        id: '2-2',
        name: 'Rowing Barre',
        sets: 4,
        reps: 10,
        weight: 70,
        restTime: 75,
        completed: false
      },
      {
        id: '2-3',
        name: 'Tirage Vertical',
        sets: 3,
        reps: 12,
        weight: 60,
        restTime: 60,
        completed: false
      },
      {
        id: '2-4',
        name: 'Curl Barre',
        sets: 3,
        reps: 12,
        weight: 30,
        restTime: 60,
        completed: false
      }
    ]
  },
  {
    id: '3',
    name: 'Leg Day',
    type: 'legs',
    color: '#4CD964',
    exercises: [
      {
        id: '3-1',
        name: 'Squat',
        sets: 4,
        reps: 8,
        weight: 100,
        restTime: 120,
        completed: false
      },
      {
        id: '3-2',
        name: 'Presse à Cuisses',
        sets: 3,
        reps: 12,
        weight: 150,
        restTime: 90,
        completed: false
      },
      {
        id: '3-3',
        name: 'Leg Curl',
        sets: 3,
        reps: 12,
        weight: 50,
        restTime: 60,
        completed: false
      },
      {
        id: '3-4',
        name: 'Mollets',
        sets: 4,
        reps: 15,
        weight: 60,
        restTime: 45,
        completed: false
      }
    ]
  }
];