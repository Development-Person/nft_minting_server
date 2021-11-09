import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { cardano } from './cardano.js';
import { openWallet } from './open_wallet.js';

export async function refund(receiverAddress, refundAmount, message) {
  //1. Open sender wallet
  let sender;

  if (process.env.MODE === 'DEVELOPMENT') {
    sender = await openWallet(process.env.CARDANO_MINTING_WALLET);
  } else if (process.env.MODE === 'PRODUCTION') {
    sender = await openWallet(process.env.SAMURAI_MINTING_WALLET);
  }

  //2. Get sender address
  const receiver = receiverAddress;

  //3. Set amount to send
  const amount = refundAmount;

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
        value: { ...walletBalance }, //this value contains the correct amount of lovelace left over after transaction but retains all other tokens, so
        //txIn will match txOut minus the payment
      }, //value going back to sender
      {
        address: receiver,
        value: {
          lovelace: cardano.toLovelace(amount),
        },
      }, //value going to receiver
    ],
    metadata: { 1: { type: message } },
    witnessCount: 1,
  };

  //9. Create raw transaction
  const raw = createTransaction(txInfo);

  //10. Create signed transaction
  const signed = signTransaction(sender, raw.transaction);

  //11. Submit transaction
  const txHash = cardano.transactionSubmit(signed);

  // console.log(`tx hash for refund is: ${txHash}`);

  return {
    nft: 'nil',
    hash: txHash,
    amount: amount,
    fee: raw.fee / 1000000,
    total: raw.fee / 1000000 + amount,
  };
}
