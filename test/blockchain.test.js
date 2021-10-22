const SHA256 = require("crypto-js/sha256");
const Blockchain = require('blockchain');
const Block = require('block');


test('when initialize blockchain then is empty', () => {
    const blockchain = new Blockchain();

    expect(blockchain.chain.length).toBe(0)
    expect(blockchain.height).toBe(-1)
})

describe('block by height', () => {
    test(`when requested height is out of bounds then return nil`, async () => {
        const blockchain = new Blockchain();

        const result = await blockchain.getBlockByHeight(1);

        expect(result).toBe(null);
    })

    test(`when requested height is valid then return expected block`, async () => {
        const blockchain = new Blockchain();

        const result = await blockchain.getBlockByHeight(0);

        expect(result).not.toBe(null);
    })
}) 