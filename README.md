# Basic Sample Hardhat Project

## Registry

NOTES:
Overview:

- Uses erc721 to track names using tokenIds
- Renewal has no cost other than gas fee
- User locks up `_registrationCost` amt of ETH in order to register a name. `_registrationCost` is constant and therefore total fee for user is only dependent on size of string being registered.
- `_registrationCost` amt of ETH returned to user if user releases the name with `releaseName(string)` or if a new user registers the same name after expiry

Transfer case:

- Time of expiration is always renewed upon transfer of tokenId.
- locked value of ETH is also transferred to new owner
- `_registrationCost` amt of ETH should be theoretical minimum price someone would sell their name for.
