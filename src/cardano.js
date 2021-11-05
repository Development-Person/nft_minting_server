import CardanocliJs from 'cardanocli-js';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: '~/cardano/minting_server/.env' });
const dir = path.join(os.homedir(), '/cardano/minting_server');
let network, filePath, socketPath;

console.log(`Starting in ${process.env.MODE}`);

if (process.env.MODE === 'DEVELOPMENT') {
  filePath = 'testnet-alonzo-genesis.json';
  network = 'testnet-magic 1097911063';
  socketPath = path.join(os.homedir(), 'cardano', 'db', 'node.socket');
} else if (process.env.MODE === 'PRODUCTION') {
  filePath = 'mainnet-alonzo-genesis.json';
  network = 'mainnet';
  socketPath = path.join(os.homedir(), 'cardano', 'main', 'db', 'node.socket');
} else {
  throw new Error('Choose an environment! 🚂');
}

const alonzoPath = path.join(os.homedir(), `/cardano/relay/${filePath}.json`);

export const cardano = new CardanocliJs({
  network: network,
  dir: dir,
  alonzoGenesisPath: alonzoPath,
  socketPath: socketPath,
});

console.log(cardano.queryTip());
