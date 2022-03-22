const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

const buildMerkleTree = (addrs) => {
  const leafNodes = addrs.map((addr) => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  return merkleTree;
};

exports.buildMerkleTree = buildMerkleTree;

const buildProof = (tree, addr) => {
  const leafNode = keccak256(addr);
  return tree.getHexProof(leafNode);
};

exports.buildProof = buildProof;
