import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  collection,
  getDocs,
} from 'firebase/firestore';
import 'dotenv/config.js';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore();
connectFirestoreEmulator(db, 'localhost', 8080);

const savedIncomingTransactionsArray = [];
const querySnapshot = await getDocs(collection(db, 'payments_in'));
querySnapshot.forEach((doc) => {
  savedIncomingTransactionsArray.push(doc.data());
});

console.log(savedIncomingTransactionsArray);
console.log('test');
