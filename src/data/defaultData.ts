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
        sets: [
          {
            id: '1-1-1',
            setNumber: 1,
            reps: 8,
            weight: 80,
            completed: false
          },
          {
            id: '1-1-2',
            setNumber: 2,
            reps: 8,
            weight: 80,
            completed: false
          },
          {
            id: '1-1-3',
            setNumber: 3,
            reps: 8,
            weight: 80,
            completed: false
          },
          {
            id: '1-1-4',
            setNumber: 4,
            reps: 8,
            weight: 80,
            completed: false
          }
        ],
        restTime: 90,
        completed: false
      },
      {
        id: '1-2',
        name: 'Développé Incliné',
        sets: [
          {
            id: '1-2-1',
            setNumber: 1,
            reps: 10,
            weight: 60,
            completed: false
          },
          {
            id: '1-2-2',
            setNumber: 2,
            reps: 10,
            weight: 60,
            completed: false
          },
          {
            id: '1-2-3',
            setNumber: 3,
            reps: 10,
            weight: 60,
            completed: false
          }
        ],
        restTime: 75,
        completed: false
      },
      {
        id: '1-3',
        name: 'Développé Militaire',
        sets: [
          {
            id: '1-3-1',
            setNumber: 1,
            reps: 10,
            weight: 50,
            completed: false
          },
          {
            id: '1-3-2',
            setNumber: 2,
            reps: 10,
            weight: 50,
            completed: false
          },
          {
            id: '1-3-3',
            setNumber: 3,
            reps: 10,
            weight: 50,
            completed: false
          },
          {
            id: '1-3-4',
            setNumber: 4,
            reps: 10,
            weight: 50,
            completed: false
          }
        ],
        restTime: 75,
        completed: false
      },
      {
        id: '1-4',
        name: 'Dips',
        sets: [
          {
            id: '1-4-1',
            setNumber: 1,
            reps: 12,
            weight: 0,
            completed: false
          },
          {
            id: '1-4-2',
            setNumber: 2,
            reps: 12,
            weight: 0,
            completed: false
          },
          {
            id: '1-4-3',
            setNumber: 3,
            reps: 12,
            weight: 0,
            completed: false
          }
        ],
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
        sets: [
          {
            id: '2-1-1',
            setNumber: 1,
            reps: 8,
            weight: 0,
            completed: false
          },
          {
            id: '2-1-2',
            setNumber: 2,
            reps: 8,
            weight: 0,
            completed: false
          },
          {
            id: '2-1-3',
            setNumber: 3,
            reps: 8,
            weight: 0,
            completed: false
          },
          {
            id: '2-1-4',
            setNumber: 4,
            reps: 8,
            weight: 0,
            completed: false
          }
        ],
        restTime: 90,
        completed: false
      },
      {
        id: '2-2',
        name: 'Rowing Barre',
        sets: [
          {
            id: '2-2-1',
            setNumber: 1,
            reps: 10,
            weight: 70,
            completed: false
          },
          {
            id: '2-2-2',
            setNumber: 2,
            reps: 10,
            weight: 70,
            completed: false
          },
          {
            id: '2-2-3',
            setNumber: 3,
            reps: 10,
            weight: 70,
            completed: false
          },
          {
            id: '2-2-4',
            setNumber: 4,
            reps: 10,
            weight: 70,
            completed: false
          }
        ],
        restTime: 75,
        completed: false
      },
      {
        id: '2-3',
        name: 'Tirage Vertical',
        sets: [
          {
            id: '2-3-1',
            setNumber: 1,
            reps: 12,
            weight: 60,
            completed: false
          },
          {
            id: '2-3-2',
            setNumber: 2,
            reps: 12,
            weight: 60,
            completed: false
          },
          {
            id: '2-3-3',
            setNumber: 3,
            reps: 12,
            weight: 60,
            completed: false
          }
        ],
        restTime: 60,
        completed: false
      },
      {
        id: '2-4',
        name: 'Curl Barre',
        sets: [
          {
            id: '2-4-1',
            setNumber: 1,
            reps: 12,
            weight: 30,
            completed: false
          },
          {
            id: '2-4-2',
            setNumber: 2,
            reps: 12,
            weight: 30,
            completed: false
          },
          {
            id: '2-4-3',
            setNumber: 3,
            reps: 12,
            weight: 30,
            completed: false
          }
        ],
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
        sets: [
          {
            id: '3-1-1',
            setNumber: 1,
            reps: 8,
            weight: 100,
            completed: false
          },
          {
            id: '3-1-2',
            setNumber: 2,
            reps: 8,
            weight: 100,
            completed: false
          },
          {
            id: '3-1-3',
            setNumber: 3,
            reps: 8,
            weight: 100,
            completed: false
          },
          {
            id: '3-1-4',
            setNumber: 4,
            reps: 8,
            weight: 100,
            completed: false
          }
        ],
        restTime: 120,
        completed: false
      },
      {
        id: '3-2',
        name: 'Presse à Cuisses',
        sets: [
          {
            id: '3-2-1',
            setNumber: 1,
            reps: 12,
            weight: 150,
            completed: false
          },
          {
            id: '3-2-2',
            setNumber: 2,
            reps: 12,
            weight: 150,
            completed: false
          },
          {
            id: '3-2-3',
            setNumber: 3,
            reps: 12,
            weight: 150,
            completed: false
          }
        ],
        restTime: 90,
        completed: false
      },
      {
        id: '3-3',
        name: 'Leg Curl',
        sets: [
          {
            id: '3-3-1',
            setNumber: 1,
            reps: 12,
            weight: 50,
            completed: false
          },
          {
            id: '3-3-2',
            setNumber: 2,
            reps: 12,
            weight: 50,
            completed: false
          },
          {
            id: '3-3-3',
            setNumber: 3,
            reps: 12,
            weight: 50,
            completed: false
          }
        ],
        restTime: 60,
        completed: false
      },
      {
        id: '3-4',
        name: 'Mollets',
        sets: [
          {
            id: '3-4-1',
            setNumber: 1,
            reps: 15,
            weight: 60,
            completed: false
          },
          {
            id: '3-4-2',
            setNumber: 2,
            reps: 15,
            weight: 60,
            completed: false
          },
          {
            id: '3-4-3',
            setNumber: 3,
            reps: 15,
            weight: 60,
            completed: false
          },
          {
            id: '3-4-4',
            setNumber: 4,
            reps: 15,
            weight: 60,
            completed: false
          }
        ],
        restTime: 45,
        completed: false
      }
    ]
  }
];