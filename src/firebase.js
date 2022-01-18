import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
dotenv.config({
  path: path.join(os.homedir(), 'code/projects/nft_minting_server/.env'),
});
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

export function initializeFirebase() {
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

  console.log(firebaseConfig);

  const app = initializeApp(firebaseConfig);
  const db = getFirestore();

  console.log(db);

  if (process.env.MODE === 'DEVELOPMENT') {
    console.log(`Emulator connected: Should only run once 🤞🏻`);
    connectFirestoreEmulator(db, 'localhost', 8080);
    return db;
  } else if (process.env.MODE === 'PRODUCTION') {
    console.log(`Connecting to Production DB: Should only run once 🤞🏻`);
    return db;
  }
}
