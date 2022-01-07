const EVM_REVERT = 'VM Exception while processing transaction: revert'

const ArdenToken = artifacts.require('./ArdenToken.sol')
const ArdenTokenSale = artifacts.require('./ArdenTokenSale.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

const { assert } = require('chai')

contract('ArdenTokenSale', function ([admin, buyer]) {
    const tokenPrice = 1000000000000000 // in wei
    const tokensAvailable = 750000
    var tokenInstance
    var tokenSaleInstance
    var numberOfTokens


    before(async () => {
        tokenInstance = await ArdenToken.deployed()
        tokenSaleInstance = await ArdenTokenSale.deployed()
    })

    describe('initializes the contract with the correct values', async () => {
        it('has contract address', async () => {
            const address = await tokenSaleInstance.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has token contract address', async () => {
            const address = await tokenSaleInstance.tokenContract()
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })
        
        it('token price is correct', async () => {
            const price = await tokenSaleInstance.tokenPrice()
            assert.equal(price, tokenPrice)
        })
    })

    describe('facilitates token buying', async () => {
        describe('success', () => {
            it('buy any tokens', async () => {
                numberOfTokens = 10
                const receipt = await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice })
                assert.equal(receipt.logs.length, 1, 'triggers one event');
                assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
                assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased the tokens');
                assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of tokens purchased');
            })
    
            it('increments the number of tokens sold', async () => {
                const amount = await tokenSaleInstance.tokensSold()
                assert.equal(amount.toNumber(), numberOfTokens)
            })
    
            it('byer receive token', async () => {
                const balance = await tokenInstance.balanceOf(buyer)
                assert.equal(balance.toNumber(), numberOfTokens)
            })
    
            it('contract gave the tokens', async () => {
                const balance = await tokenInstance.balanceOf(tokenSaleInstance.address)
                assert.equal(balance.toNumber(), tokensAvailable - numberOfTokens)
            })
        })

        describe('failure', () => {
            it('try to buy tokens different from the ether value', async () => {
                await tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 }).should.be.rejectedWith(EVM_REVERT)
            })

            it('cannot purchase more tokens than available', async () => {
                await tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe('ends token sale', async () => {
        describe('success', () => {
            it('try to end sale', async () => {
                await tokenSaleInstance.endSale({ from: admin })
                const balance = await tokenInstance.balanceOf(admin)
                
                assert.equal(balance.toNumber(), 999990, 'returns all unsold arden tokens to admin')
            })

            it('token price was reset', async () => {
                const price = await tokenSaleInstance.tokenPrice()
                assert.equal(price.toNumber(), 0)
            })
        })

        describe('failure', () => {
            it('try to end sale from account other than the admin', async () => {
                const promise = await tokenSaleInstance.endSale({ from: buyer })
                console.log(promise)
            })
        })
    })
})       