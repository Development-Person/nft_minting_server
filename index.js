import { collection, getDocs } from 'firebase/firestore';
import cron from 'node-cron';
import { refund } from './src/refund.js';
import { initializeFirebase } from './src/firebase.js';
import { updateDatabaseTransaction } from './src/update_database_transaction.js';
import { mintNFT } from './src/mint_nft.js';
import { sendNFT } from './src/send_nft.js';
import { markNFT } from './src/mark_nft.js';

let running = false;

//1. Initialize firebase and return db
const db = initializeFirebase();

const scheduled = cron.schedule('* * * * *', async () => {
  if (running) {
    console.log('Task already running, exiting to try again later 😘.');
    return;
  }

  running = true;

  console.log('Starting main process! 😛');

  await delay(90000);

  await nftMainProcess();

  console.log('Main process complete! 🤗');

  running = false;
});

scheduled.start();

function delay(t, val) {
  return new Promise(function (resolve) {
    console.log('Delay! 👻');
    setTimeout(function () {
      resolve(val);
    }, t);
  });
}

async function nftMainProcess() {
  //2. Query DB for all saved incoming transactions.
  const querySnapshot = await getDocs(collection(db, 'payments_in'));

  //3. Push data into array
  const savedIncomingTransactionsArray = [];
  querySnapshot.forEach((doc) => {
    savedIncomingTransactionsArray.push(doc.data());
  });

  if (savedIncomingTransactionsArray.length === 0) {
    console.log('No incoming transactions, exiting 😀');
    return;
  }

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
        const databaseUpdateRefund = await updateDatabaseTransaction(
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

        //B2. Mark NFT as minted
        await markNFT(nft.id, 'minted');

        //B3. Send to payer
        const sendNFTData = await sendNFT(
          nft.asset,
          transaction.payer,
          'Thanks for your support! Here is your NFT'
        );

        //B4. Mark NFT as sent
        await markNFT(nft.id, 'sent');

        //B5. Update the database
        const databaseUpdateNFT = await updateDatabaseTransaction(
          transaction.id,
          sendNFTData,
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
}

// nftMainProcess();
