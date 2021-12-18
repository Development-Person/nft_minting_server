import { connectCardano } from './cardano.js';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
  path: path.join(os.homedir(), 'code/projects/nft_minting_server/.env'),
});

async function createWallet(account) {
  const cardano = await connectCardano();

  const payment = cardano.addressKeyGen(account);
  const stake = cardano.stakeAddressKeyGen(account);
  cardano.stakeAddressBuild(account);
  cardano.addressBuild(account, {
    paymentVkey: payment.vkey,
    stakeVkey: stake.vkey,
  });
  return cardano.wallet(account);
}

console.log(process.env.CARDANO_CREATE_WALLET_NAME);

const wallet = await createWallet(`${process.env.CARDANO_CREATE_WALLET_NAME}`);

console.log(`${wallet.name} created!`);
