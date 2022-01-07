pragma solidity ^0.4.2;

import "./ArdenToken.sol";

contract ArdenTokenSale {
    address admin;
    ArdenToken public tokenContract;
    uint256 public tokenPrice;
    uint256 public tokensSold;

    event Sell(address _buyer, uint256 _amount);

    constructor(ArdenToken _tokenContract, uint256 _tokenPrice) public {
        admin = msg.sender;
        tokenContract = _tokenContract;
        tokenPrice = _tokenPrice;
    }

    function multiply(uint x, uint y) internal pure returns (uint z) {
        require(y == 0 || (z = x * y) / y == x, "Multiply error");
    }

    function buyTokens(uint256 _numberOfTokens) public payable {
        require(msg.value == multiply(_numberOfTokens, tokenPrice), "Error");
        require(tokenContract.balanceOf(this) >= _numberOfTokens, "Error");
        require(tokenContract.transfer(msg.sender, _numberOfTokens), "Error");

        tokensSold += _numberOfTokens;

        emit Sell(msg.sender, _numberOfTokens);
    }

    function endSale() public {
        require(msg.sender == admin, "This can only be done by an admin");
        require(tokenContract.transfer(admin, tokenContract.balanceOf(this)), "Error");

        selfdestruct(admin);
    }
}
