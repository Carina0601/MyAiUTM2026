import { db } from './firebase';
import { ref, update } from 'firebase/database';

const patients = {
  p001: {
    name: 'Jeremiah Tan',
    gender: 'male',
    age: 67,
    heartRate: 80,
    spo2: 97,
    resp: 16,
    addr: 'Lorong 123, Jalan 6, Taman Maju',
    emergency: 'Jeremy Jr (Son): 016-2235445',
    conditions: 'Mild Hypertension',
    status: 'stable',
    ringId: 'SR0001'
  },
  p002: {
    name: 'Jennifer Loo',
    gender: 'female',
    age: 63,
    heartRate: 72,
    spo2: 98,
    resp: 14,
    addr: 'No 45, Jalan Mawar, Cheras',
    emergency: 'Jenny Jr (Daughter): 012-3456789',
    conditions: 'Mild Arthritis',
    status: 'stable',
    ringId: 'SR0002'
  },
  p003: {
    name: 'Jonathan Park',
    gender: 'male',
    age: 72,
    heartRate: 98,
    spo2: 96,
    resp: 18,
    addr: 'No 7, Lorong Kasturi, Ampang',
    emergency: 'John Jr (Son): 019-9876543',
    conditions: 'Type 2 Diabetes',
    status: 'stable',
    ringId: 'SR0003'
  },
  p004: {
    name: 'Rosalind Ahmad',
    gender: 'female',
    age: 58,
    heartRate: 130,
    spo2: 92,
    resp: 26,
    addr: 'No 12, Jalan Dahlia, Kajang',
    emergency: 'Ros Jr (Daughter): 011-5544332',
    conditions: 'Coronary Artery Disease',
    status: 'critical',
    ringId: 'SR0004'
  },
  p005: {
    name: 'Lim Wei Kang',
    gender: 'male',
    age: 75,
    heartRate: 68,
    spo2: 99,
    resp: 12,
    addr: 'Block B-3-1, Apartment Permai, Subang',
    emergency: 'Lim Wei (Son): 017-3344556',
    conditions: 'None',
    status: 'stable',
    ringId: 'SR0005'
  },
  p006: {
    name: 'Siti Aminah',
    gender: 'female',
    age: 70,
    heartRate: 85,
    spo2: 95,
    resp: 20,
    addr: 'No 88, Jalan SS2, Petaling Jaya',
    emergency: 'Ahmad (Husband): 014-7788990',
    conditions: 'Post-Stroke Recovery',
    status: 'stable',
    ringId: 'SR0006'
  },
  p007: {
    name: 'Rajesh Kumar',
    gender: 'male',
    age: 65,
    heartRate: 78,
    spo2: 97,
    resp: 15,
    addr: 'No 15, Jalan Tun Razak, KL',
    emergency: 'Priya (Wife): 012-6655443',
    conditions: 'Asthma',
    status: 'stable',
    ringId: 'SR0007'
  },
  p008: {
    name: 'Mary Magdalene',
    gender: 'female',
    age: 80,
    heartRate: 140,
    spo2: 88,
    resp: 28,
    addr: 'No 3, Lorong Hijau, Puchong',
    emergency: 'Peter (Son): 018-2233445',
    conditions: 'Heart Failure History',
    status: 'critical',
    ringId: 'SR0008'
  }
};

export const seedDatabase = () => {
  update(ref(db, 'patients'), patients)
    .then(() => console.log('Database updated with unique names and gender!'))
    .catch((err) => console.error('Seed error:', err));
};