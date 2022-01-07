const EVM_REVERT = 'VM Exception while processing transaction: revert'

const ArdenToken = artifacts.require('./ArdenToken.sol')

require('chai')
    .use(require('chai-as-promised'))
    .should()

const { assert } = require('chai')

contract('ArdenToken', function ([admin, buyer, fromAccount, toAccount, spendingAccount]) {
    let tokenInstance

    before(async () => {
        tokenInstance = await ArdenToken.deployed()
    })

    describe('initializes the contract with the correct values', async () => {
        it('deploys successfully', async () => {
            const address = tokenInstance.address
            assert.notEqual(address, 0x0)
            assert.notEqual(address, '')
            assert.notEqual(address, null)
            assert.notEqual(address, undefined)
        })

        it('has the correct name', async () => {
            const name = await tokenInstance.name()
            assert.equal(name, 'ArdenToken')
        })

        it('has the correct symbol', async () => {
            const symbol = await tokenInstance.symbol()
            assert.equal(symbol, 'ARDEN')
        })

        it('has the correct standard', async () => {
            const standard = await tokenInstance.standard()
            assert.equal(standard, 'ArdenToken v1.0')
        })
    })

    describe('allocates the initial supply upon deployment', async () => {
        it('has the correct total supply to 1,000,000', async () => {
            const totalSupply = await tokenInstance.totalSupply()
            assert.equal(totalSupply.toNumber(), 1000000, 'sets the total supply to 1,000,000')
        })

        it('tokens were distributed to the admin', async () => {
            const adminBalance = await tokenInstance.balanceOf(admin)
            assert.equal(adminBalance.toNumber(), 250000, 'it allocates the initial supply to the admin account')
        })
    })

    describe('transfers token ownership', async () => {
        describe('success', () => {
            it('transfer token buyer and transfer logs', async () => {
                const receipt = await tokenInstance.transfer(buyer, 150000, { from: admin })
                assert.equal(receipt.logs.length, 1, 'triggers one event')
                assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event')
                assert.equal(receipt.logs[0].args._from, admin, 'logs the account the tokens are transferred from')
                assert.equal(receipt.logs[0].args._to, buyer, 'logs the account the tokens are transferred to')
                assert.equal(receipt.logs[0].args._value, 150000, 'logs the transfer amount')
            })
    
            it(`check if tokens have arrived to the buyer`, async () => {
                const balance = await tokenInstance.balanceOf(buyer)
                assert.equal(balance.toNumber(), 150000, 'adds the amount to the receiving account')
            })
    
            it(`deducts the amount from the sending account`, async () => {
                const balance = await tokenInstance.balanceOf(admin)
                assert.equal(balance.toNumber(), 100000, 'deducts the amount from the sending account')
            })
        })

        describe('failure', () => {
            it(`test 'require' statement first by transferring something larger than the sender's balance`, async () => {
                await tokenInstance.transfer.call(buyer, 99999999999999999999999).should.be.rejected //or EVM_REVERT
            })
        })
    })

    describe('approves tokens for delegated transfer', async () => {
        it('has the correct', async () => {
            const success =  await tokenInstance.approve.call(buyer, 100)
            assert.equal(success, true, 'it returns true')

            const receipt = await tokenInstance.approve(buyer, 100, { from: admin })
            assert.equal(receipt.logs.length, 1, 'triggers one event')
            assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event')
            assert.equal(receipt.logs[0].args._owner, admin, 'logs the account the tokens are authorized by')
            assert.equal(receipt.logs[0].args._spender, buyer, 'logs the account the tokens are authorized to')
            assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount')

            const allowance = await tokenInstance.allowance(admin, buyer)
            assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated trasnfer')
        })
    })

    describe('approves tokens for delegated transfer', async () => {
        it('has the correct', async () => {
            const success =  await tokenInstance.approve.call(buyer, 100)
            assert.equal(success, true, 'it returns true')

            const receipt = await tokenInstance.approve(buyer, 100, { from: admin })
            assert.equal(receipt.logs.length, 1, 'triggers one event')
            assert.equal(receipt.logs[0].event, 'Approval', 'should be the "Approval" event')
            assert.equal(receipt.logs[0].args._owner, admin, 'logs the account the tokens are authorized by')
            assert.equal(receipt.logs[0].args._spender, buyer, 'logs the account the tokens are authorized to')
            assert.equal(receipt.logs[0].args._value, 100, 'logs the transfer amount')

            const allowance = await tokenInstance.allowance(admin, buyer)
            assert.equal(allowance.toNumber(), 100, 'stores the allowance for delegated trasnfer')
        })
    })

    describe('handles delegated token transfers', async () => {
        describe('success', async () => {
            it('Transfering some tokens', async () => {
                //Transfer some tokens to fromAccount
                await tokenInstance.transfer(fromAccount, 100, { from: admin })
    
                // Approve spendingAccount to spend 10 tokens form fromAccount
                await tokenInstance.approve(spendingAccount, 10, { from: fromAccount })

                const transferResult = await tokenInstance.transferFrom.call(fromAccount, toAccount, 10, { from: spendingAccount })
                assert.equal(transferResult, true, 'failure transfer')

                const receipt = await tokenInstance.transferFrom(fromAccount, toAccount, 10, { from: spendingAccount })
                assert.equal(receipt.logs.length, 1, 'triggers one event')
                assert.equal(receipt.logs[0].event, 'Transfer', 'should be the "Transfer" event')
                assert.equal(receipt.logs[0].args._from, fromAccount, 'logs the account the tokens are transferred from')
                assert.equal(receipt.logs[0].args._to, toAccount, 'logs the account the tokens are transferred to')
                assert.equal(receipt.logs[0].args._value, 10, 'logs the transfer amount')

                const fromAccountBalance = await tokenInstance.balanceOf(fromAccount)
                assert.equal(fromAccountBalance.toNumber(), 90, 'deducts the amount from the sending account')

                const toAccountBalance = await tokenInstance.balanceOf(toAccount)
                assert.equal(toAccountBalance.toNumber(), 10, 'adds the amount from the receiving account')

                const allowance = await tokenInstance.allowance(fromAccount, spendingAccount)
                assert.equal(allowance.toNumber(), 0, 'deducts the amount from the allowance')
            })
        })
        describe('failure', () => {
            it('transferring something larger than the senders balance', async () => {
                // Try transferring something larger than the sender's balance
                await tokenInstance.transferFrom(fromAccount, toAccount, 9999, { from: spendingAccount }).should.be.rejectedWith(EVM_REVERT)
            })

            it('transferring something larger than the approved amount', async () => {
                // Try transferring something larger than the approved amount
                await tokenInstance.transferFrom(fromAccount, toAccount, 20, { from: spendingAccount }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })
});
