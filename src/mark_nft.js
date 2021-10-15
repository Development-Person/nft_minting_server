import { doc, updateDoc } from 'firebase/firestore';

export async function markNFT(db, transactionId, status) {
  //1. Get current doc
  const currentDoc = doc(db, 'nfts', transactionId);

  //2. Update parent database entry
  //3A. Build transaction data
  const updateTransactionData = {
    status: status,
  };

  //3B. Update database
  const updateDocData = await updateDoc(currentDoc, updateTransactionData);

  return status;
}
