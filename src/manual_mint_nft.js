import { openWallet } from './open_wallet.js';
import { connectCardano } from './cardano.js';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
  path: path.join(os.homedir(), 'code/projects/nft_minting_server/.env'),
});
import util from 'util';

async function manualMintNFT() {
  const cardano = await connectCardano();

  //1. Open sender wallet
  const sender = await openWallet(cardano, 'TDSOriginals');

  //2. Define mint script
  const mintScript = {
    keyHash: cardano.addressKeyHash(sender.name),
    type: 'sig',
  };

  console.log(mintScript);

  //3. Create policy id
  const POLICY_ID = cardano.transactionPolicyid(mintScript);

  //4. Define asset name
  const ASSET_NAME = 'TDSO001';

  //5. Create asset id
  const ASSET_ID = POLICY_ID + '.' + ASSET_NAME;

  //6. Define metadata
  const metadata = {
    721: {
      [POLICY_ID]: {
        [ASSET_NAME]: {
          name: ASSET_NAME,
          image: 'ipfs://QmeLdyPfNcw8BCXs19Tp2o33WBFtrj2ACfMwpLFd9VeAWB',
          description: 'Aerial view of the Fox Glacier, New Zealand',
          type: 'image/jpeg',
          author: 'treatdeliverysystem',
          edition: 'TDS Originals',
        },
      },
    },
  };

  //7. Define build transaction
  const createTransaction = (tx) => {
    let raw = cardano.transactionBuildRaw(tx);
    let fee = cardano.transactionCalculateMinFee({
      ...tx,
      txBody: raw,
    });
    tx.txOut[0].value.lovelace -= fee;
    return cardano.transactionBuildRaw({ ...tx, fee });
  };

  //8. Define sign transaction
  const signTransaction = (wallet, tx, script) => {
    return cardano.transactionSign({
      signingKeys: [wallet.payment.skey, wallet.payment.skey],
      txBody: tx,
    });
  };

  //9. Define trasaction information
  const tx = {
    txIn: sender.balance().utxo,
    txOut: [
      {
        address: sender.paymentAddr,
        value: { ...sender.balance().value, [ASSET_ID]: 1 },
      },
    ],
    mint: [
      { action: 'mint', quantity: 1, asset: ASSET_ID, script: mintScript },
    ],
    metadata,
    witnessCount: 2,
  };

  delete tx.txIn[0].value.undefined;
  delete tx.txOut[0].value.undefined;

  console.log(
    util.inspect(tx, { showHidden: false, depth: null, colors: true })
  );

  // process.exit();
  //10. Create raw transaction
  const raw = createTransaction(tx);

  //11. Create signed transaction
  const signed = signTransaction(sender, raw);

  //12. Submit transaction
  cardano.transactionSubmit(signed);

  console.log(`Created: `, ASSET_ID);
}

manualMintNFT();
