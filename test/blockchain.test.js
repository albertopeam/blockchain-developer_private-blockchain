const SHA256 = require("crypto-js/sha256");
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
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

test('when requesting owner message verification then return wallet-adddress:Date:starRegistry pattern', async () => {
    const address = "a01c6987f0";
    const testStartDate = new Date().getTime().toString().slice(0,-3);
    const blockchain = await new Blockchain();    

    const message = await blockchain.requestMessageOwnershipVerification(address);

    const testEndDate = new Date().getTime().toString().slice(0,-3);
    const splitted = message.split(":");
    expect(splitted[0]).toStrictEqual(address);
    const date = parseInt(splitted[1]);
    expect(date).toBeGreaterThanOrEqual(parseInt(testStartDate));
    expect(date).toBeLessThanOrEqual(parseInt(testEndDate));
    expect(splitted[2]).toStrictEqual("starRegistry");
})

describe(`submit star`, () => {     
    const star = {
        dec: "68° 52' 56.9",
        ra: "16h 29m 1.0s",
        story: "testing story"
    };
    const address = "moTRa2kPwXpWd2aScQYJaMwueNicASo9Tt"; //Note: Make sure to always use Legacy Wallet addresses     
    const addressPrivateKey = "cSjj7uoaCcb3v5qraLWyJbtLwREwdfty9qfaUv6NueRFgQVyH7F3";
    const wrongSignature = "awtrJNTMgOpqjCL/qbEVN/4rlXZQSvG49bKoAs/LcMOjUutiDt/JHxQUmxmfKMLDqGIju55L9c+9VZaWVdkncps=";    

    test(`when elapsed time of message ownership and current time is more than or equal 5m then reject`, async () => {        
        let date = new Date();
        date.setMinutes(date.getMinutes() - 5);
        const fiveMinutesEarliear = date.getTime().toString().slice(0, -3);
        const message = `${address}:${fiveMinutesEarliear}:starRegistry`;
        const blockchain = await new Blockchain();

        const expectedError = "Elapsed more than five minutes between message ownership verification and current time";
        await expect(blockchain.submitStar(address, message, "", star)).rejects.toThrow(expectedError);
    })

    test(`when message signed with address doesn't match signature then reject `, async () => {
        const blockchain = await new Blockchain();
        const ownershipMessage = await blockchain.requestMessageOwnershipVerification(address);

        const expectedError = "Message verification failed";
        await expect(blockchain.submitStar(address, ownershipMessage, wrongSignature, star)).rejects.toThrow(expectedError);
    })

    test(`when message signed with address match signature then resolve with the added block `, async () => {        
        const blockchain = await new Blockchain();
        const ownershipMessage = await blockchain.requestMessageOwnershipVerification(address);
        const keyPair = new bitcoin.ECPair.fromWIF(addressPrivateKey, bitcoin.networks.testnet);
        const privateKey = keyPair.privateKey;
        const signature = bitcoinMessage.sign(ownershipMessage, privateKey, keyPair.compressed);

        const result = await blockchain.submitStar(address, ownershipMessage, signature, star);

        expect(result).toBeInstanceOf(Block);        
        const bData = await result.getBData();
        const expected = {address: address, star: star};
        expect(bData).toStrictEqual(expected);
    })
})

describe(`get block by hash`, () => {
    test(`when requesting an invalid block hash then return null`, async () => {
        const hash = "0a"
        const blockchain = await new Blockchain();

        await expect(blockchain.getBlockByHash(hash)).rejects.toBeNull();
    })

    test(`when requesting a valid block hash then return block`, async () => {
        const blockchain = await new Blockchain();
        const addedBlock = await blockchain._addBlock(new Block({data: "some data"}));
        
        const searchedBlock = await blockchain.getBlockByHash(addedBlock.hash);

        expect(searchedBlock).toStrictEqual(addedBlock);
    })
})

describe('get block by height', () => {
    test('when requested height is out of bounds then return nil', async () => {
        const blockchain = new Blockchain();

        const result = await blockchain.getBlockByHeight(1);

        expect(result).toBeNull();
    })

    test(`when requested height is valid then return expected block`, async () => {
        const blockchain = new Blockchain();

        const result = await blockchain.getBlockByHeight(0);

        expect(result).toBe(blockchain.chain[0]);
    })
})

describe(`get block by address`, () => {
    test(`when requested an address that doesn't belong to any block then return empty array`, async () => {
        const blockchain = new Blockchain();

        const result = await blockchain.getStarsByWalletAddress("invalid-address");

        expect(result).toStrictEqual([]);
    })

    test(`when requested an address that has two blocks and the chain contains others then array with expected blocks`, async () => {
        const star0 = {dec: "68° 52' 56.9", ra: "16h 29m 1.0s",story: "testing story"};                
        const star2 = {dec: "98° 52' 56.9", ra: "16h 29m 1.0s",story: "-"};
        const star1 = {dec: "78° 52' 56.9", ra: "16h 29m 1.0s",story: "testing story 1"};
        const myAddress = "my-addr";     
        const addrBlock0 = new Block({address: myAddress, star: star0});
        const addrBlock2 = new Block({address: "NOT-my-address", star: star2});        
        const addrBlock1 = new Block({address: myAddress, star: star1});        
        const blockchain = await new Blockchain();
        await blockchain._addBlock(addrBlock0);
        await blockchain._addBlock(addrBlock2);
        await blockchain._addBlock(addrBlock1);

        const result = await blockchain.getStarsByWalletAddress(myAddress);
        
        expect(result).toStrictEqual([star0, star1]);
    })
})


describe(`validateChain`, () => {
    test(`when chain has an initial block that was body tampered then genesis block is invalid`, async () => {
        const blockchain = await new Blockchain();
        blockchain.chain[0].body = "tampered body";

        const expected = ["Invalid block hash at index 0"];
        await expect(blockchain.validateChain()).resolves.toStrictEqual(expected);
    })

    test(`when chain has last block that was body tampered then last block is invalid`, async () => {
        const addrBlock1 = new Block({data: "intermediate block"});
        const addrBlock2 = new Block({data: "last block"});        
        const blockchain = await new Blockchain();
        await blockchain._addBlock(addrBlock1);
        await blockchain._addBlock(addrBlock2);
        addrBlock2.body = "tampered body";

        const expected = ["Invalid block hash at index 2"];
        await expect(blockchain.validateChain()).resolves.toStrictEqual(expected);
    });

    test(`when chain has an intermediate block that was body tampered then block is invalid & next block previous hash is invalid`, async () => {
        const addrBlock1 = new Block({data: "intermediate block"});
        const addrBlock2 = new Block({data: "last block"});        
        const blockchain = await new Blockchain();
        await blockchain._addBlock(addrBlock1);
        await blockchain._addBlock(addrBlock2);
        addrBlock1.body = "tampered body";

        const expected = ["Invalid block hash at index 1", "Invalid previous block hash at index 2"];
        await expect(blockchain.validateChain()).resolves.toStrictEqual(expected);
    })

    test(`when chain is not tampered then validate chain returns no errors`, async () => {
        const addrBlock1 = new Block({data: "intermediate block"});
        const addrBlock2 = new Block({data: "last block"});        
        const blockchain = await new Blockchain();
        await blockchain._addBlock(addrBlock1);
        await blockchain._addBlock(addrBlock2);

        await expect(blockchain.validateChain()).resolves.toStrictEqual([]);
    })
})