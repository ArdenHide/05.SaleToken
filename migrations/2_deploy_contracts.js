var ArdenToken = artifacts.require("./ArdenToken.sol");
var ArdenTokenSale = artifacts.require("./ArdenTokenSale.sol");

// module.exports = function (deployer) {
//     deployer.deploy(ArdenToken, 1000000).then(function () {
//         // Token price is 0.001 Ether
//         var tokenPrice = 1000000000000000;
//         return deployer.deploy(ArdenTokenSale, ArdenToken.address, tokenPrice);
//     });
// };

module.exports = function (deployer) {
    deployer.deploy(ArdenToken, 1000000).then(function () {
        // Token price is 0.001 Ether
        var tokenPrice = 1000000000000000;
        return deployer.deploy(ArdenTokenSale, ArdenToken.address, tokenPrice);
    }).then(function () {
        var tokensAvailable = 750000;
        ArdenToken.deployed().then(function (instance) { instance.transfer(ArdenTokenSale.address, tokensAvailable, { from: '0xF865C9a659410C192dffcc3d7C04d08ee42F1a19' }); })
    });
};