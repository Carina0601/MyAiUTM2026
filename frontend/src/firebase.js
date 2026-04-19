import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC7qa8hYq2YDacEIUSCht7YUf4zVbbhB3A",
  authDomain: "test-d93c5.firebaseapp.com",
  databaseURL: "https://test-d93c5-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "test-d93c5",
  storageBucket: "test-d93c5.firebasestorage.app",
  messagingSenderId: "19741730464",
  appId: "1:19741730464:web:05a8452ef04abad8f40bc5",
  measurementId: "G-WX1YY0TJ93"
};

const app = initializeApp(firebaseConfig);

export const storage = getStorage(app);

export const db = getDatabase(app);