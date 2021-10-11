import { collection, getDocs } from 'firebase/firestore';
import { refund } from './src/refund.js';
import { initializeFirebase } from './src/firebase.js';
import { updateDatabase } from './src/update_database.js';

//1. Initialize firebase and return db
const db = initializeFirebase();

//2. Query DB for all saved incoming transactions.
const querySnapshot = await getDocs(collection(db, 'payments_in'));

//3. Push data into array
const savedIncomingTransactionsArray = [];
querySnapshot.forEach((doc) => {
  savedIncomingTransactionsArray.push(doc.data());
});

//4. Check status of each transaction
for (const transaction of savedIncomingTransactionsArray) {
  switch (transaction.status) {
    case 'refund':
      //A1. Perform the refund
      console.log(`Processing refund for ${transaction.id}`);

      const refundData = await refund(
        transaction.payer,
        transaction.ada,
        `refund, incorrect payment sent`
      );

      //A2. Update the database
      const databaseUpdate = await updateDatabase(
        transaction.id,
        refundData,
        'refund_complete'
      );

      console.log({ result: `Payment with ID: ${databaseUpdate.id} added.` });
      break;
    case 'mint':
      //B1. Mint the NFT
      // mint(transaction.payer);

      //B2. Send to payer

      //B3. Update the database
      break;
    default:
      break;
  }
}
