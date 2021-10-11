import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
//bring in instance of cardanoCLIJS
import { cardano } from './cardano.js';
//bring in wallet opener
import { openWallet } from './open_wallet.js';

export async function refund(receiverAddress, refundAmount, metadata) {
  //open sender wallet
  const sender = await openWallet(process.env.CARDANO_MINTING_WALLET);

  //check wallet balance
  // console.log(sender.balance());

  //get sender address
  const receiver = receiverAddress;

  //set amount to send
  const amount = 10;

  //define build transaction
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

  //define sign transaction
  const signTransaction = (wallet, tx, script) => {
    return cardano.transactionSign({
      signingKeys: [wallet.payment.skey, wallet.payment.skey],
      txBody: tx,
    });
  };

  const walletBalance = {
    ...sender.balance().value,
  };

  //subtracting the send amount from the wallet UTXOValue.lovelace amount but leaving reference to all other tokens unchanged
  walletBalance.lovelace = walletBalance.lovelace - cardano.toLovelace(amount);

  //define transaction information
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
    metadata: { 1: { type: metadata } },
    witnessCount: 1,
  };

  //create raw transaction
  const raw = createTransaction(txInfo);

  //create signed transaction
  const signed = signTransaction(sender, raw.transaction);

  //submit transaction
  const txHash = cardano.transactionSubmit(signed);

  console.log(txHash);

  return {
    nft: 'nil',
    hash: txHash,
    amount: amount,
    fee: raw.fee / 1000000,
    total: raw.fee / 1000000 + amount,
  };
}
