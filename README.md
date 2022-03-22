# Simple front run resistant naming system

## Registry

Overview:

- Uses erc721 to track names using tokenIds
- Renewal has no cost other than gas fee
- User locks up `_registrationCost` amt of ETH in order to register a name. `_registrationCost` is constant and therefore total fee for user is only dependent on size of string being registered.
- `_registrationCost` amt of ETH returned to user if user releases the name with `releaseName(string)` or if a new user registers the same name after expiry

Transfer case:

- Time of expiration is always renewed upon transfer of tokenId.
- locked value of ETH is now retreivable by new owner
- `_registrationCost` amt of ETH should be theoretical minimum price someone would sell their name for.

## Registrar

Overview:

- Uses basic commit\reveal strategy to prevent simple front running attacks.
- Must be granted the `REGISTRAR_ROLE` defined in Registry.sol in order to succesfully register names.

## Setup environment and test

prerequisites: have yarn installed and clone this repository

- create a .env file containing the following variables (private key only neccesary for deployment to non local network):

```
PRIVATE_KEY = EXAMPLE_PRIVATE_KEY
NODE_HTTP = NODE_URL
```

1. use `yarn install` to install required dependencies.
2. use `yarn hardhat compile` to compile contracts and generate artifacts
3. use `yarn hardhat deploy` to deploy and initialize contracts on local hardhat network (use --network networkName/URL to specify network)
4. use `yarn hardhat test` to run through suite of tests on Registry and Registrar
