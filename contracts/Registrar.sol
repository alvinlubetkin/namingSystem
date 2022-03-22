pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


interface IRegistry {
    function registerName(string memory name_, address recipient) external payable;

}

contract Registrar is Ownable {
    IRegistry public _registry;
    mapping(address => bool) public _commited;
    mapping(address => uint256) public _commitBlock;
    uint256 public _minBlocks;

    constructor(IRegistry registry_, uint256 minBlocks_){
        _registry = registry_;
        _minBlocks = minBlocks_;
    }

    //tree should include name, recipient address and nonce
    function commit(address recipient_ ) external {
        _commited[recipient_] = true;
        _commitBlock[recipient_] = block.number;
    }

    //simple front running protection. require some amount of blocks passes which forces bad actor to either
    //constantly pay to remain commited or rely on user using low gas price 
    function reveal(string memory name_) external payable {
        require(_commited[msg.sender], "Uncommited.");
        require(block.number > _commitBlock[msg.sender] + _minBlocks, "cannot commit and reveal in less than min blocks");

        _registry.registerName{value: msg.value}(name_, msg.sender);
        _commited[msg.sender] = false;
    }

    function setMinBlocks(uint256 minBlocks_) external onlyOwner {
        _minBlocks = minBlocks_;
    }

}