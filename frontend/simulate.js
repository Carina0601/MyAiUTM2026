import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, update } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC7qa8hYq2YDacEIUSCht7YUf4zVbbhB3A",
  authDomain: "test-d93c5.firebaseapp.com",
  databaseURL: "https://test-d93c5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-d93c5",
};

const CRITICALLY_CRITICAL = "p1778608256107";
const QUITE_CRITICAL = "p008";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const startSimulating = async () => {
  const snapshot = await get(ref(db, 'patients'));
  
  if (snapshot.exists()) {
    const patientIds = Object.keys(snapshot.val());
    
    setInterval(async () => {
      const updates = {};

      patientIds.forEach((id) => {
        let newRate;

        if (id === CRITICALLY_CRITICAL) {
          newRate = Math.floor(Math.random() * (170 - 140 + 1)) + 140;
        } else if (id === QUITE_CRITICAL) {
          newRate = Math.floor(Math.random() * (125 - 105 + 1)) + 105;
        } else {
          newRate = Math.floor(Math.random() * (80 - 65 + 1)) + 65;
        }
        
        const status = (newRate > 100 || newRate < 55) ? "critical" : "stable";
        
        updates[`patients/${id}/heartRate`] = newRate;
        updates[`patients/${id}/status`] = status;
        
        console.log(`${id}: ${newRate} BPM [${status.toUpperCase()}]`);
      });

      await update(ref(db), updates);
    }, 3000);
  }
};

startSimulating();