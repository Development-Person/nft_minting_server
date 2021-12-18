//bring in instance of cardanoCLIJS
import { connectCardano } from './cardano.js';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({
  path: path.join(os.homedir(), 'code/projects/nft_minting_server/.env'),
});

async function checkWallet(name) {
  const cardano = await connectCardano();

  const wallet = cardano.wallet(name);

  return wallet;
}

let fundingWallet, mintingWallet;

if (process.env.MODE === 'DEVELOPMENT') {
  fundingWallet = await checkWallet(process.env.CARDANO_FUND_WALLET);
  mintingWallet = await checkWallet(process.env.CARDANO_MINTING_WALLET);
} else if (process.env.MODE === 'PRODUCTION') {
  fundingWallet = await checkWallet(process.env.SAMURAI_FUNDING_WALLET);
  mintingWallet = await checkWallet(process.env.SAMURAI_MINTING_WALLET);
}

console.log(`fundingWallet`, fundingWallet.balance().value);
console.log(`mintingWallet`, mintingWallet.balance().value);
