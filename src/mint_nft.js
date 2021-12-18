import { openWallet } from './open_wallet.js';
import { getUnmintedNFT } from './get_unminted_nft.js';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
  path: path.join(os.homedir(), 'code/projects/nft_minting_server/.env'),
});

export async function mintNFT(db, cardano) {
  const nftToMint = await getUnmintedNFT(db);
  const { data, id } = nftToMint;

  console.log(nftToMint);

  //1. Open sender wallet
  let sender;

  if (process.env.MODE === 'DEVELOPMENT') {
    sender = await openWallet(cardano, process.env.CARDANO_MINTING_WALLET);
  } else if (process.env.MODE === 'PRODUCTION') {
    sender = await openWallet(cardano, process.env.SAMURAI_MINTING_WALLET);
  } else {
    throw new Error('No sender wallet!');
  }

  //2. Define mint script
  const mintScript = {
    keyHash: cardano.addressKeyHash(sender.name),
    type: 'sig',
  };

  console.log(mintScript);

  //3. Create policy id
  const POLICY_ID = cardano.transactionPolicyid(mintScript);

  //4. Define asset name
  const ASSET_NAME = data.name;

  //5. Create asset id
  const ASSET_ID = POLICY_ID + '.' + ASSET_NAME;

  //6. Define metadata
  const metadata = {
    721: {
      [POLICY_ID]: {
        [ASSET_NAME]: {
          name: ASSET_NAME,
          image: data.image,
          description: data.description,
          type: 'image/png',
          author: 'treatdeliverysystem',
          dna: data.dna,
          edition: data.edition,
          attributes: data.attributes,
          compiler: data.compiler,
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

  //10. Create raw transaction
  const raw = createTransaction(tx);

  //11. Create signed transaction
  const signed = signTransaction(sender, raw);

  //12. Submit transaction
  cardano.transactionSubmit(signed);

  console.log(`Created: `, ASSET_ID, id);

  return {
    name: data.name,
    asset: ASSET_ID,
    id,
  };
}
