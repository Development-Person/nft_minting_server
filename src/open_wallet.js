//bring in instance of cardanoCLIJS
import { cardano } from './cardano.js';

export async function openWallet(name) {
  const wallet = await cardano.wallet(name);

  return wallet;
}
