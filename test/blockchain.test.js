const SHA256 = require("crypto-js/sha256");
const Blockchain = require('blockchain');
const Block = require('block');

test('when initialize blockchain then genesis is added', async () => {
    const blockchain = await new Blockchain();

    const genesisBlock = blockchain.chain[0];
    expect(blockchain.height).toBe(1);
    expect(blockchain.chain.length).toBe(1);    
    expect(genesisBlock.height).toBe(0);
    expect(genesisBlock.previousBlockHash).toBeNull();
})

test('when adding a block to a non empty blockchain then check new height and new block as added', async () => {
    const testStartDate = new Date().getTime() / 1000;
    const newData = {data: "some data"};
    const newBlock = new Block(newData);
    const blockchain = await new Blockchain();    

    const result = await blockchain._addBlock(newBlock);

    const testEndDate = new Date().getTime() / 1000;
    const addedBlock = blockchain.chain[1];
    expect(blockchain.height).toBe(2);
    expect(addedBlock.getBData()).resolves.toStrictEqual(newData);
    expect(addedBlock.height).toBe(1);
    expect(addedBlock.time).toBeGreaterThanOrEqual(testStartDate);
    expect(addedBlock.time).toBeLessThanOrEqual(testEndDate);
    expect(addedBlock.previousBlockHash).toStrictEqual(blockchain.chain[0].hash);
})

/*
describe('block by height', () => {
    test('when requested height is out of bounds then return nil', async () => {
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
*/