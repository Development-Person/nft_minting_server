import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
//bring in instance of cardanoCLIJS
import { cardano } from './cardano.js';
//bring in wallet opener
import { openWallet } from './open_wallet.js';
import { getUnmintedNFT } from './get_unminted_nft.js';
import util from 'util';

export async function mintNFT() {
  const nftToMint = await getUnmintedNFT();
  const { data, id } = nftToMint;

  //open sender wallet
  const sender = await openWallet(process.env.CARDANO_MINTING_WALLET);

  //check wallet balance
  console.log(sender.balance());

  //define mint script
  const mintScript = {
    keyHash: cardano.addressKeyHash(sender.name),
    type: 'sig',
  };

  //create policy id
  const POLICY_ID = cardano.transactionPolicyid(mintScript);

  //define asset name
  const ASSET_NAME = '2'; //data.name;

  //create asset id
  const ASSET_ID = POLICY_ID + '.' + ASSET_NAME;

  //define metadata
  const metadata = {
    721: {
      [POLICY_ID]: {
        [ASSET_NAME]: {
          name: ASSET_NAME,
          image: data.image,
          description: 'five samurai, first collection', //data.description,
          type: 'image/png',
          author: 'sleepyslothcollective',
          dna: data.dna,
          edition: data.edition,
          attributes: data.attributes,
          compiler: data.compiler,
        },
      },
    },
  };

  // console.log(
  //   util.inspect(metadata, { showHidden: false, depth: null, colors: true })
  // );

  //define build transaction
  const createTransaction = (tx) => {
    let raw = cardano.transactionBuildRaw(tx);
    let fee = cardano.transactionCalculateMinFee({
      ...tx,
      txBody: raw,
    });
    tx.txOut[0].value.lovelace -= fee;
    return cardano.transactionBuildRaw({ ...tx, fee });
  };

  //define sign transaction
  const signTransaction = (wallet, tx, script) => {
    return cardano.transactionSign({
      signingKeys: [wallet.payment.skey, wallet.payment.skey],
      txBody: tx,
    });
  };

  //define trasaction information
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

  //create raw transaction
  const raw = createTransaction(tx);

  //create signed transaction
  const signed = signTransaction(sender, raw);

  //submit transaction
  cardano.transactionSubmit(signed);

  console.log(`Created: `, ASSET_ID, id);

  return {
    asset: ASSET_ID,
    id,
  };
}
