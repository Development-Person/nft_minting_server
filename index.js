import { collection, getDocs } from 'firebase/firestore';
import cron from 'node-cron';
import { refund } from './src/refund.js';
import { initializeFirebase } from './src/firebase.js';
import { updateDatabaseTransaction } from './src/update_database_transaction.js';
import { mintNFT } from './src/mint_nft.js';
import { sendNFT } from './src/send_nft.js';
import { markNFT } from './src/mark_nft.js';

console.log('Scheduler getting up and running! 🏇🏻');

//1. Initialize firebase and return db
const db = initializeFirebase();

//2. Define cron schedule which will run the main process
//running tag allows scheduler to skip runs if main process is still running
let running = false;

const scheduled = cron.schedule('* * * * *', async () => {
  if (running) {
    console.log('Task already running, exiting to try again later 😘.');
    return;
  }

  running = true;

  console.log('Starting main process! 😛');

  await nftMainProcess();

  console.log('Main process complete! 🤗');

  running = false;
});

//3. Start cron scheduler
scheduled.start();

//4. Define delay function to delay running of main process at key points to allow ledger to update
function delay(t, val) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(val);
    }, t);
  });
}

//5. Define main process
async function nftMainProcess() {
  //1. Query DB for all saved incoming transactions.
  const querySnapshot = await getDocs(collection(db, 'payments_in'));

  //2. Push data into array
  const savedIncomingTransactionsArray = [];
  querySnapshot.forEach((doc) => {
    savedIncomingTransactionsArray.push(doc.data());
  });

  if (savedIncomingTransactionsArray.length === 0) {
    console.log('No incoming transactions, exiting 😀');
    return;
  }

  //3. Check status of each transaction
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

        console.log(`Refund compelete! Waiting for ledger to update`);

        console.log(
          await delay(30000, 'Waited 30 seconds for ledger to update!')
        );

        //A2. Update the database
        const databaseUpdateRefund = await updateDatabaseTransaction(
          db,
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

        const nft = await mintNFT(db); //send the db bc querying for unminted nft

        console.log(`NFT minted! Waiting for ledger to update`);

        console.log(
          await delay(300000, 'Waited 5 minutes for ledger to update!')
        );

        //B2. Mark NFT as minted
        console.log(`Marking NFT as minted! 📑`);
        let nftUpdate = await markNFT(db, nft.id, 'minted');
        console.log(`NFT updated with ${nftUpdate}! 📑`);

        //B3. Send NFT to payer
        console.log(`Sending nft to customer! 📮`);
        const sendNFTData = await sendNFT(
          nft.asset,
          transaction.payer,
          'Thanks for your support! Here is your NFT'
        );

        console.log(`NFT sent! Waiting for ledger to update`);

        console.log(
          await delay(300000, 'Waited 5 minutes for ledger to update!')
        );

        //B4. Mark NFT as sent
        console.log(`Marking NFT as sent! 📑`);
        nftUpdate = await markNFT(db, nft.id, 'sent');
        console.log(`NFT updated with ${nftUpdate}! 📑`);

        //B5. Update the database
        console.log(`Updating database! 📑`);
        const databaseUpdateNFT = await updateDatabaseTransaction(
          db,
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
