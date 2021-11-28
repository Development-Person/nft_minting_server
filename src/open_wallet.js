export async function openWallet(cardano, name) {
  const wallet = await cardano.wallet(name);

  return wallet;
}
