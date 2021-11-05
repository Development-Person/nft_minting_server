import dotenv from 'dotenv';
dotenv.config({ path: '~/cardano/minting_server/.env' });
import pinataSDK from '@pinata/sdk';
import { createReadStream, readdirSync, readFileSync, writeFileSync } from 'fs';

//1. Create instance of pinata
const pinata = pinataSDK(
  process.env.PINATA_API_KEY,
  process.env.PINATA_API_SECRET
);

//2. Creating array of images and json files
//Sorting images by reading the number in the filename ('5SSM1.png')
const imageArray = readdirSync(`../data/images`).sort((a, b) => {
  return a.slice(4).split('.')[0] - b.slice(4).split('.')[0];
});
const jsonArray = readdirSync(`../data/json`).sort((a, b) => {
  return a.slice(4).split('.')[0] - b.slice(4).split('.')[0];
});

//3. For each image in the array
for (const [index, image] of imageArray.entries()) {
  const imageName = image;
  const jsonName = jsonArray[index];

  console.log(`processing image ${index + 1} of ${imageArray.length} 🐱‍🐉`);

  //3A. Create a read stream and and get the right JSON file
  const readableStreamForFile = createReadStream(`../data/images/${imageName}`);
  const imageJSON = JSON.parse(readFileSync(`../data/json/${jsonName}`));

  //3B. Set pinata image metadata and json metadata options
  const imageOptions = {
    pinataMetadata: {
      name: imageJSON.name,
      keyvalues: {
        description: imageJSON.description,
        edition: imageJSON.edition,
      },
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  const metaOptions = {
    pinataMetadata: {
      name: `${imageJSON.name}_meta`,
      keyvalues: {
        description: imageJSON.description,
        edition: imageJSON.edition,
      },
    },
    pinataOptions: {
      cidVersion: 0,
    },
  };

  console.log(`uploading ${imageName} to pinata 🐎`);

  await pinata
    //3C. Upload image to pinata
    .pinFileToIPFS(readableStreamForFile, imageOptions)
    //3D. Edit the JSON with the image ipfs location
    .then((result) => {
      console.log(`writing ${imageName} location to json 🐩`);
      imageJSON.image = `ipfs://${result.IpfsHash}`;
      writeFileSync(
        `../data/json/${jsonName}`,
        JSON.stringify(imageJSON, null, 2)
      );
    })
    //3C. Upload metadata to pinata
    .then(() => {
      console.log(`uploading ${jsonName} to pinata 🐱‍🏍`);

      pinata.pinJSONToIPFS(
        JSON.parse(readFileSync(`../data/json/${jsonName}`)),
        metaOptions
      );
    })
    .catch((err) => {
      console.log(err);
    });

  console.log(`processing of ${imageName} complete 🦸‍♂️`);
}
