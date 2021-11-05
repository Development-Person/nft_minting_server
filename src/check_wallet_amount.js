//bring in instance of cardanoCLIJS
import { cardano } from './cardano.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

function checkWallet(name) {
  const wallet = cardano.wallet(name);

  return wallet;
}

const fundingWallet = checkWallet(process.env.SAMURAI_FUNDING_WALLET);
const mintingWallet = checkWallet(process.env.SAMURAI_MINTING_WALLET);

console.log(`fundingWallet`, fundingWallet.balance());
console.log(`mintingWallet`, mintingWallet.balance());
