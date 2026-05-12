import { db } from './firebase';
import { ref, update, set } from 'firebase/database';

const medicalCenters = {
    hosp_001: {
        name: "General Hospital Kuala Lumpur",
        lat: 3.1701,
        lng: 101.7031,
        canPerformSurgery: true,
        type: "Public Hospital"
    },
    hosp_002: {
        name: "Gleneagles Hospital Ampang",
        lat: 3.1588,
        lng: 101.7352,
        canPerformSurgery: true,
        type: "Private Hospital"
    },
    clin_001: {
        name: "Klinik Mediviron Subang",
        lat: 3.0485,
        lng: 101.5852,
        canPerformSurgery: false,
        type: "Clinic"
    }
};

const patients = {
    p001: {
        name: 'Jeremiah Tan',
        gender: 'male',
        age: 67,
        heartRate: 80,
        spo2: 97,
        resp: 16,
        addr: 'Lorong 123, Jalan 6, Taman Maju',
        lat: 3.1205,
        lng: 101.6521,
        requiresSurgery: false,
        emergency: 'Jeremy Jr (Son): 016-2235445',
        conditions: 'Mild Hypertension',
        status: 'stable',
        ringId: 'SR0001',
        dispatchedAt: null
    },
    p002: {
        name: 'Jennifer Loo',
        gender: 'female',
        age: 63,
        heartRate: 72,
        spo2: 98,
        resp: 14,
        addr: 'No 45, Jalan Mawar, Cheras',
        lat: 3.1025,
        lng: 101.7312,
        requiresSurgery: false,
        emergency: 'Jenny Jr (Daughter): 012-3456789',
        conditions: 'Mild Arthritis',
        status: 'stable',
        ringId: 'SR0002',
        dispatchedAt: null
    },
    p003: {
        name: 'Jonathan Park',
        gender: 'male',
        age: 72,
        heartRate: 98,
        spo2: 96,
        resp: 18,
        addr: 'No 7, Lorong Kasturi, Ampang',
        lat: 3.1502,
        lng: 101.7589,
        requiresSurgery: true,
        emergency: 'John Jr (Son): 019-9876543',
        conditions: 'Type 2 Diabetes',
        status: 'stable',
        ringId: 'SR0003',
        dispatchedAt: null
    },
    p004: {
        name: 'Rosalind Ahmad',
        gender: 'female',
        age: 58,
        heartRate: 130,
        spo2: 92,
        resp: 26,
        addr: 'No 12, Jalan Dahlia, Kajang',
        lat: 2.9921,
        lng: 101.7912,
        requiresSurgery: true,
        emergency: 'Ros Jr (Daughter): 011-5544332',
        conditions: 'Coronary Artery Disease',
        status: 'critical',
        ringId: 'SR0004',
        dispatchedAt: null
    },
    p005: {
        name: 'Lim Wei Kang',
        gender: 'male',
        age: 75,
        heartRate: 68,
        spo2: 99,
        resp: 12,
        addr: 'Block B-3-1, Apartment Permai, Subang',
        lat: 3.0521,
        lng: 101.5812,
        requiresSurgery: false,
        emergency: 'Lim Wei (Son): 017-3344556',
        conditions: 'None',
        status: 'stable',
        ringId: 'SR0005',
        dispatchedAt: null
    },
    p006: {
        name: 'Siti Aminah',
        gender: 'female',
        age: 70,
        heartRate: 85,
        spo2: 95,
        resp: 20,
        addr: 'No 88, Jalan SS2, Petaling Jaya',
        lat: 3.1189,
        lng: 101.6212,
        requiresSurgery: false,
        emergency: 'Ahmad (Husband): 014-7788990',
        conditions: 'Post-Stroke Recovery',
        status: 'stable',
        ringId: 'SR0006',
        dispatchedAt: null
    },
    p007: {
        name: 'Rajesh Kumar',
        gender: 'male',
        age: 65,
        heartRate: 78,
        spo2: 97,
        resp: 15,
        addr: 'No 15, Jalan Tun Razak, KL',
        lat: 3.1652,
        lng: 101.7121,
        requiresSurgery: true,
        emergency: 'Priya (Wife): 012-6655443',
        conditions: 'Asthma',
        status: 'stable',
        ringId: 'SR0007',
        dispatchedAt: null
    },
    p008: {
        name: 'Mary Magdalene',
        gender: 'female',
        age: 80,
        heartRate: 140,
        spo2: 88,
        resp: 28,
        addr: 'No 3, Lorong Hijau, Puchong',
        lat: 2.9981,
        lng: 101.6212,
        requiresSurgery: true,
        emergency: 'Peter (Son): 018-2233445',
        conditions: 'Heart Failure History',
        status: 'critical',
        ringId: 'SR0008',
        dispatchedAt: null
    }
};

Object.keys(patients).forEach(key => {
    if (!patients[key].dispatchedAt) patients[key].dispatchedAt = null;
});

export const seedDatabase = async () => {
    try {
        await set(ref(db, 'medicalCenters'), medicalCenters);
        await update(ref(db, 'patients'), patients);
        console.log('✅ Full Database Seeded: Patients & Medical Centers initialized.');
    } catch (err) {
        console.error('Seed error:', err);
    }
};