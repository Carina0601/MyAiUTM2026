import { db } from './firebase';
import { ref, update } from 'firebase/database';

const patients = {
  p001: {
    name: 'Uncle Jere',
    age: 67,
    heartRate: 80,
    spo2: 97,
    resp: 16,
    addr: 'Lorong 123, Jalan 6, Taman Maju',
    emergency: 'Jeremiah (Son): 016-2235445',
    conditions: 'Mild Hypertension',
  },
  p002: {
    name: 'Aunty Jenny',
    age: 63,
    heartRate: 63,
    spo2: 98,
    resp: 14,
    addr: 'No 45, Jalan Mawar, Cheras',
    emergency: 'Jenny Jr (Daughter): 012-3456789',
    conditions: 'Mild Arthritis',
  },
  p003: {
    name: 'Uncle John Pork',
    age: 72,
    heartRate: 98,
    spo2: 96,
    resp: 18,
    addr: 'No 7, Lorong Kasturi, Ampang',
    emergency: 'John Jr (Son): 019-9876543',
    conditions: 'Type 2 Diabetes',
  },
  p004: {
    name: 'Kak Ros',
    age: 58,
    heartRate: 121,
    spo2: 92,
    resp: 26,
    addr: 'No 12, Jalan Dahlia, Kajang',
    emergency: 'Ros Jr (Daughter): 011-5544332',
    conditions: 'Coronary Artery Disease',
  },
};

export const seedDatabase = () => {
  update(ref(db, 'patients'), patients);
  console.log('Seeded!');
};