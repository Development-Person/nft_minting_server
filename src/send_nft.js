import dotenv from 'dotenv';
dotenv.config({ path: '~/cardano/minting_server/.env' });
import { cardano } from './cardano.js';
import { openWallet } from './open_wallet.js';

export async function sendNFT(asset, customer, message) {
  console.log(`asset is ${asset}`);

  //1. Open sender wallet
  const sender = await openWallet(process.env.CARDANO_MINTING_WALLET);

  //2. Set receiver wallet
  const receiver = customer;
  // const receiver =
  // 'addr_test1qqfqr0nuudjugk3k2zjc3ypv7jgcljkd8htpxwdcdsz8xf87l79z7h9wsnusyuu82cmqp492jjqp69egqc7s8nmq4fgsg4zyq2';

  //3. Set nft to send
  const NFT = asset;
  // const NFT =
  // '4161264a345e0472b234a458313862c9e2cb380699dd355daf3ec00c.5SamuraiSwordMaster4';

  //4. Set message to send with NFT
  const messageToSend = message;
  // const messageToSend = 'Enjoy your NFT!';

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

  //9. Create raw transaction
  const raw = createTransaction(txInfo);

  //10. Create signed transaction
  const signed = signTransaction(sender, raw.transaction);

  //11. Submit transaction
  const txHash = cardano.transactionSubmit(signed);

  // console.log(`tx hash: ${txHash}`);

  return {
    nft: NFT,
    hash: txHash,
    amount: 1.5,
    fee: raw.fee / 1000000,
    total: raw.fee / 1000000 + 1.5,
  };
}
