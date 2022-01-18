import dotenv from 'dotenv';
import { connectCardano } from './cardano.js';
import os from 'os';
import path from 'path';
dotenv.config({
  path: path.join(os.homedir(), 'code/projects/nft_minting_server/.env'),
});
import { openWallet } from './open_wallet.js';

export async function sendNFT() {
  const cardano = await connectCardano();

  //1. Open sender wallet
  const sender = await openWallet(cardano, 'TDSOriginals');

  //2. Set receiver wallet
  const receiver =
    'addr1q9c3j9yazjfkzq45lhjfnqp0wypac2un803m06hry6w5qcccv4yqwtnu5egztvl8uu6r5zxfrpfvmrppq56hwmm6x2ss209mrq';

  //3. Set nft to send
  const NFT =
    '2373a3fb91adbd22587125fb32a720f07079255ba36ba7433aa6fcab.TDSO001';

  //4. Set message to send with NFT
  const messageToSend = 'Sent to TDS';

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

  //6. Get balance of sender wallet (including all tokens)
  const walletBalance = {
    ...sender.balance().value,
  };

  // console.log(`after`, walletBalance);

  //7. Subtract 1.5 ADA and NFT from wallet balance
  walletBalance.lovelace = walletBalance.lovelace - cardano.toLovelace(1.5);
  walletBalance[NFT] = 0;

  // console.log(`before`, walletBalance);

  //8. Create raw transaction
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
          lovelace: cardano.toLovelace(1.5),
          [NFT]: 1,
        },
      },
    ],
    metadata: { 1: { type: messageToSend } },
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

  console.log(`Sent: `, txHash);
}

sendNFT();
