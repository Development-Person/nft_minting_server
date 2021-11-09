//bring in instance of cardanoCLIJS
import { cardano } from './cardano.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

function checkWallet(name) {
  const wallet = cardano.wallet(name);

  return wallet;
}

let fundingWallet, mintingWallet;

if (process.env.MODE === 'DEVELOPMENT') {
  fundingWallet = checkWallet(process.env.CARDANO_FUND_WALLET);
  mintingWallet = checkWallet(process.env.CARDANO_MINTING_WALLET);
} else if (process.env.MODE === 'PRODUCTION') {
  fundingWallet = checkWallet(process.env.SAMURAI_FUNDING_WALLET);
  mintingWallet = checkWallet(process.env.SAMURAI_MINTING_WALLET);
}

console.log(`fundingWallet`, fundingWallet.balance());
console.log(`mintingWallet`, mintingWallet.balance());
