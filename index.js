import { collection, getDocs } from 'firebase/firestore';
import { refund } from './src/refund.js';
import { initializeFirebase } from './src/firebase.js';
import { updateDatabase } from './src/update_database.js';
import { mintNFT } from './src/mint_nft';

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
      const databaseUpdateRefund = await updateDatabase(
        transaction.id,
        refundData,
        'refund_complete'
      );

      console.log({
        result: `Payment with ID: ${databaseUpdateRefund.id} added.`,
      });
      break;
    case 'mint':
      //B1. Mint the NFT
      console.log(`Creating nft for ${transaction.id}`);

      const nft = await mintNFT();

      //Created:  4161264a345e0472b234a458313862c9e2cb380699dd355daf3ec00c.2
      //U4PQsHrT5Ef1pi5NXa3Y

      //B2. Send to payer
      // TODO
      const sendData = await sendNFT(
        nft.asset,
        transaction.payer,
        'Thanks for your support! Here is your NFT'
      );

      //B3. Update the database
      //    TODO Mark NFT as minted
      const thing = markNFTAsMinted(nft.id);

      //    TODO Mark transaction as mint completed and sent
      const databaseUpdateNFT = await updateDatabase(
        transaction.id,
        refundData,
        'mint_complete'
      );

      console.log({
        result: `Payment with ID: ${databaseUpdateNFT.id} added.`,
      });
      break;
    default:
      break;
  }
}
