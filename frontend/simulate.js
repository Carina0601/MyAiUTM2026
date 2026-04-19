import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC7qa8hYq2YDacEIUSCht7YUf4zVbbhB3A",
  authDomain: "test-d93c5.firebaseapp.com",
  databaseURL: "https://test-d93c5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-d93c5",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const startSimulating = async () => {
  console.log("Fetching patients from database...");
  const snapshot = await get(ref(db, 'patients'));
  
  if (snapshot.exists()) {
    const patientsData = snapshot.val();
    const patientIds = Object.keys(patientsData);
    
    console.log(`Found ${patientIds.length} patients. Starting heartbeats...`);

    setInterval(() => {
      const updates = {};

      patientIds.forEach((id) => {
        const newRate = Math.floor(Math.random() * (110 - 60 + 1)) + 60;
        
        updates[`patients/${id}/heartRate`] = newRate;
        updates[`patients/${id}/status`] = newRate > 100 ? "critical" : "stable";
        
        console.log(`[SIM] ${id}: ${newRate} BPM`);
      });

      update(ref(db), updates);
    }, 3000);

  } else {
    console.log("❌ No patients found in database. Please add 'p001' manually in Firebase first!");
  }
};

startSimulating();