import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeFirebase } from './firebase.js';
import axios from 'axios';

export async function getUnmintedNFT() {
  //1. Initialise DB
  const db = initializeFirebase();

  //2. Create empty array for unminted NFTs
  const unmintedNFTArray = [];

  //3. Get all unminted NFTs from database and push into array
  const nftCollectionRef = collection(db, 'nfts');
  const nftCollectionUnmintedQuery = query(
    nftCollectionRef,
    where('minted', '==', false)
  );
  const nftCollectionUnmintedQuerySnapshot = await getDocs(
    nftCollectionUnmintedQuery
  );
  nftCollectionUnmintedQuerySnapshot.forEach((doc) => {
    unmintedNFTArray.push(doc.data());
  });

  //4. Choose first unminted NFT
  const nft = unmintedNFTArray[0];

  //5. Get metadata from ipfs
  const response = await axios
    .get(`http://ipfs.io/ipfs/${nft.ipfs_hash}`)
    .catch((err) => console.log(err));

  const { data } = response;

  //6. Return metada along with nft id in database
  return {
    data,
    id: nft.id,
  };
}
