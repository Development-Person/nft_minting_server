import fs from 'fs';

const filePath = './orders.json';

async function orderRead() {
  const rawdata = fs.readFileSync(filePath);
  const orders = await JSON.parse(rawdata);
  return orders.orders;
}

async function orderWrite(value) {
  const data = { orders: value };
  const dataString = JSON.stringify(data);

  fs.writeFileSync(filePath, dataString);
}

export { orderRead, orderWrite };
