import dotenv from 'dotenv';
import os from 'os';
import path from 'path';
dotenv.config({
  path: path.join(os.homedir(), 'code/projects/nft_minting_server/.env'),
});
import { connectCardano } from './cardano.js';
import { openWallet } from './open_wallet.js';

async function sendADA() {
  const cardano = await connectCardano();

  //1. Open sender wallet
  const sender = await openWallet(cardano, 'FiveSamuraiFunding');

  //2. Set receiver wallet
  const receiver =
    'addr1qyar2sdf40rwm5p6u5aezm4qyhk9yz8se6yh5q5h5y70dqf3e6r2ktvryrnkqaxg8h4430khgwuxaenutswqm9t2s07qctf9xl';

  //3. Set amount to send
  const amount = 28;

  //4. Define build transaction
  const createTransaction = (tx) => {
    let raw = cardano.transactionBuildRaw(tx);
    let fee = cardano.transactionCalculateMinFee({
      ...tx,
      txBody: raw,
    });
    tx.txOut[0].value.lovelace -= fee;
    return {
      transaction: cardano.transactionBuildRaw({ ...tx, fee }),
      fee: fee,
    };
  };

  //5. Define sign transaction
  const signTransaction = (wallet, tx, script) => {
    return cardano.transactionSign({
      signingKeys: [wallet.payment.skey, wallet.payment.skey],
      txBody: tx,
    });
  };

  //6. Get balance of sender wallet
  const walletBalance = {
    ...sender.balance().value,
  };

  //7. Subtracting the send amount from the wallet UTXOValue.lovelace amount but leaving reference to all other tokens unchanged
  walletBalance.lovelace = walletBalance.lovelace - cardano.toLovelace(amount);

  //8. Define transaction information
  const txInfo = {
    txIn: cardano.queryUtxo(sender.paymentAddr),
    txOut: [
      {
        address: sender.paymentAddr,
        value: { ...walletBalance },
      },
      {
        address: receiver,
        value: {
          lovelace: cardano.toLovelace(amount),
        },
      },
    ],
    metadata: { 1: { type: 'not seed' } },
    witnessCount: 1,
  };

  delete txInfo.txIn[0].value.undefined;
  delete txInfo.txOut[0].value.undefined;

  //9. Create raw transaction
  const raw = createTransaction(txInfo);

  //10. Create signed transaction
  const signed = signTransaction(sender, raw.transaction);

  //11. Submit transaction
  const txHash = cardano.transactionSubmit(signed);

  console.log(`${amount} sent! txHash: ${txHash}`);
}

sendADA();
