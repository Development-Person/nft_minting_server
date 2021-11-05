import { cardano } from './cardano.js';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const createWallet = (account) => {
  const payment = cardano.addressKeyGen(account);
  const stake = cardano.stakeAddressKeyGen(account);
  cardano.stakeAddressBuild(account);
  cardano.addressBuild(account, {
    paymentVkey: payment.vkey,
    stakeVkey: stake.vkey,
  });
  return cardano.wallet(account);
};

const wallet = createWallet(`${process.env.CARDANO_CREATE_WALLET_NAME}`);

console.log(`${wallet.name} created!`);
