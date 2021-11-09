import { collection, getDocs } from 'firebase/firestore';
import cron from 'node-cron';
import { refund } from './src/refund.js';
import { initializeFirebase } from './src/firebase.js';
import { updateDatabaseTransaction } from './src/update_database_transaction.js';
import { mintNFT } from './src/mint_nft.js';
import { sendNFT } from './src/send_nft.js';
import { markNFT } from './src/mark_nft.js';
import { orderRead, orderWrite } from './src/order_tracker.js';

console.log('Scheduler getting up and running! 🏇🏻');

//1. Initialize firebase and return db
const db = initializeFirebase();

//2. Define cron schedule which will run the main process
//Running tag allows scheduler to skip runs if main process is still running
let running = false;

const scheduled = cron.schedule('* * * * *', async () => {
  if (running) {
    console.log(
      'Task already running, exiting to try again later 😘.',
      new Date()
    );
    return;
  }

  running = true;

  console.log('Starting main process! 😛', new Date());

  await nftMainProcess();

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

//5. Set current number of orders at 0
let numberOfOrders = (await orderRead()) || 0;

//6. Define main process
async function nftMainProcess() {
  //1. Query DB for all saved incoming transactions.
  const querySnapshot = await getDocs(collection(db, 'payments_in'));
  //2. Push data into array
  const savedIncomingTransactionsArray = [];
  querySnapshot.forEach((doc) => {
    savedIncomingTransactionsArray.push(doc.data());
  });

  if (savedIncomingTransactionsArray.length === 0) {
    console.log('No incoming transactions, exiting 😀', new Date());
    return;
  }

  //3. Check status of each transaction
  for (const transaction of savedIncomingTransactionsArray) {
    switch (transaction.status) {
      case 'refund':
        //A1. Perform the refund
        console.log(`${transaction.id}: Processing refund`, new Date());

        const refundData = await refund(
          transaction.payer,
          transaction.ada,
          `refund, incorrect payment sent`
        );

        //A2. Update the database
        const databaseUpdateRefund = await updateDatabaseTransaction(
          db,
          transaction.id,
          refundData,
          'refund_complete'
        );

        console.log(
          `${transaction.id}: Refund of ${refundData.amount} ADA complete! Txhash: ${refundData.hash}. 
          Payment with ID: ${databaseUpdateRefund.id} added. Waiting 5 minutes for ledger to update ⏱`
        );

        console.log(
          await delay(
            300000,
            'Waited 5 minutes for cardano ledger to update! ⏰'
          )
        );

        break;
      case 'mint':
        numberOfOrders += 1;
        orderWrite(numberOfOrders);

        //B1. Check if NFT orders exceed 500 and set status to refund if true
        if (numberOfOrders < 500) {
          //B2. Mint the NFT
          console.log(`${transaction.id}: Creating nft`, new Date());

          const nft = await mintNFT(db); //send the db bc querying for unminted nft

          //B3. Mark NFT as minted
          let nftUpdate = await markNFT(db, nft.id, 'minted');

          console.log(
            `${transaction.id}: Minted NFT ${nft.id}! 📑 Waiting 5 minutes for ledger to update ⏱`,
            new Date()
          );

          console.log(
            await delay(300000, 'Waited 5 minutes for ledger to update! ⏰')
          );

          //B4. Send NFT to payer
          console.log(
            `${transaction.id}: Sending NFT ${nft.id} to customer! 📮`,
            new Date()
          );
          const sendNFTData = await sendNFT(
            nft.asset,
            transaction.payer,
            'Thanks for your support! Here is your NFT'
          );

          //B5. Mark NFT as sent
          console.log(`${transaction.id}: Marking NFT ${nft.id} as sent! 📑`);
          nftUpdate = await markNFT(db, nft.id, 'sent');

          //B6. Update the database
          console.log(
            `${transaction.id}: Updating database for ${sendNFTData.nft}! 📑`
          );
          const databaseUpdateNFT = await updateDatabaseTransaction(
            db,
            transaction.id,
            sendNFTData,
            'mint_complete'
          );

          console.log(
            `${transaction.id}: NFT sent! Txhash: ${sendNFTData.hash}. NFT sale with ID: ${databaseUpdateNFT.id} added. 🥓 
            Waiting 5 minutes for ledger to update ⌚`
          );

          console.log(
            await delay(300000, 'Waited 5 minutes for ledger to update! ⏰')
          );
        } else {
          console.log(
            `${transaction.id}: Orders exceeded! Marked for refund! 🤯`,
            new Date()
          );

          await updateDatabaseTransaction(db, transaction.id, {}, 'refund');
        }

        break;
      default:
        break;
    }
  }
  console.log(`${numberOfOrders} orders placed so far!`, new Date());
}
