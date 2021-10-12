import { doc, updateDoc } from 'firebase/firestore';
import { initializeFirebase } from './firebase.js';

export async function markNFT(transactionId, status) {
  const db = initializeFirebase();

  //1. Get current doc
  const currentDoc = doc(db, 'nfts', transactionId);

  //2. Update parent database entry
  //3A. Build transaction data
  const updateTransactionData = {
    status: status,
  };

  //3B. Update database
  const updateDocData = await updateDoc(currentDoc, updateTransactionData);

  return updateDocData;
}
