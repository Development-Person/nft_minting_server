import { collection, query, where, getDocs } from 'firebase/firestore';
import axios from 'axios';

export async function getUnmintedNFT(db) {
  //1. Create empty array for unminted NFTs
  const unmintedNFTArray = [];

  //2. Get all unminted NFTs from database and push into array
  const nftCollectionRef = collection(db, 'nfts');
  const nftCollectionUnmintedQuery = query(
    nftCollectionRef,
    where('status', '==', 'fresh')
  );
  const nftCollectionUnmintedQuerySnapshot = await getDocs(
    nftCollectionUnmintedQuery
  );
  nftCollectionUnmintedQuerySnapshot.forEach((doc) => {
    unmintedNFTArray.push(doc.data());
  });

  //3. Choose first unminted NFT
  const nft = unmintedNFTArray[0];

  //4. Get metadata from ipfs
  const response = await axios
    .get(`http://ipfs.io/ipfs/${nft.ipfs_hash}`)
    .catch((err) => console.log(err));

  const { data } = response;

  //5. Return metada along with nft id in database
  return {
    data,
    id: nft.id,
  };
}
