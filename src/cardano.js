import CardanocliJs from 'cardanocli-js';
import os from 'os';
import path from 'path';

const dir = path.join(os.homedir(), '/cardano/minting_server');

const alonzoPath = path.join(
  os.homedir(),
  '/cardano/relay/testnet-alonzo-genesis.json'
);

export const cardano = new CardanocliJs({
  network: 'testnet-magic 1097911063',
  dir: dir,
  alonzoGenesisPath: alonzoPath,
  socketPath: path.join(os.homedir(), 'cardano', 'db', 'node.socket'),
});
