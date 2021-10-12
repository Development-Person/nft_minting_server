import {
  collection,
  doc,
  setDoc,
  updateDoc,
  Timestamp,
} from 'firebase/firestore';
import { initializeFirebase } from './firebase.js';

export async function updateDatabaseTransaction(
  transactionId,
  newTransactionData,
  status
) {
  const db = initializeFirebase();

  //1. Get current doc
  const currentDoc = doc(db, 'payments_in', transactionId);

  //2. Build refund database entry
  //2A. Get collection from database (will create one if doesn't exist)
  const newCollection = collection(currentDoc, 'related_transactions');

  //2B. Get a new document from database within new collection
  const newSubDoc = doc(newCollection);

  // 2C. Build transaction data
  const date = new Date();

  const newTransactionDataDocData = {
    nft: newTransactionData.nft,
    hash: newTransactionData.hash,
    amount: Number(newTransactionData.amount),
    fee: newTransactionData.fee,
    total: newTransactionData.total,
    date: Timestamp.fromDate(date),
    id: newSubDoc.id,
  };

  //2C. Upload entry to database
  await setDoc(newSubDoc, newTransactionDataDocData);

  //3. Update parent database entry
  //3A. Build transaction data
  const updateTransactionData = {
    status: status,
  };

  //3B. Update database
  await updateDoc(currentDoc, updateTransactionData);

  return newSubDoc;
}
