//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Registry is ERC721, AccessControl {
    mapping(uint256 => uint256) public registrationExpiry;
    mapping(string => uint256) public names; 

    uint256 private _currentTokenId;
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");


    //amount of ETH required to lock in order to register a name
    uint256 private _registrationCost;
    //time in seconds
    uint256 private _lockTime;

    modifier onlyOperator(address spender_, uint256 tokenId_){
        require(_isApprovedOrOwner(spender_, tokenId_), "Not approved as operator for tokenId");
        _;
    }

    modifier onlyRegistrar() {
        require(hasRole(REGISTRAR_ROLE, msg.sender), "Must have REGISTRAR role");
        _;
    }

    constructor(uint256 registrationCost_, uint256 lockTime_) ERC721("NAMING SYSTEM", "NS") {
        _registrationCost = registrationCost_;
        _currentTokenId = 1;
        _lockTime = lockTime_;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

        _setupRole(REGISTRAR_ROLE, address(0));
    }

    //////////////// EXTERNAL FUNCTIONS ////////////////
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControl) returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    //gas fee to register will depend on length of name
    //technically fee will also depend on the recipient address if there are leading 0's
    function registerName(string memory name_, address recipient_) onlyRegistrar external payable{
        require(msg.value >= _registrationCost, "Insufficient funds sent");
        uint256 tokenId = names[name_];
        require(tokenId == 0 || block.timestamp >= registrationExpiry[tokenId], "Name is already registered");

        if(tokenId == 0){
            _mint(recipient_, name_);
            return;
        }

        _transfer(ownerOf(tokenId), recipient_, tokenId);
    }

    function renewName(uint256 tokenId_) external {
        registrationExpiry[tokenId_] = block.timestamp + _lockTime;
    }

    function releaseName(string memory name_) external{
        uint256 tokenId = names[name_];
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not approved as operator for tokenId");
        _withdraw(ownerOf(tokenId));
        _burn(tokenId);
        names[name_] = 0; 
    }

    //////////////// INTERNAL FUNCTIONS ////////////////

    function _mint(address owner_, string memory name_) internal {
        _mint(owner_, _currentTokenId);
        names[name_] =_currentTokenId;
        _currentTokenId = _currentTokenId + 1;
    }

    function _afterTokenTransfer(address from_, address to_, uint256 tokenId_) internal override {
        registrationExpiry[tokenId_] = block.timestamp + _lockTime;
    }

    function _withdraw(address to_) internal {
            (bool success, ) = to_.call{value: _registrationCost}("");
            require(success, "Failed to withdraw funds");
    }

}
