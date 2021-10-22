const SHA256 = require('crypto-js/sha256')
const Block = require('block');

test('when initialize then set body hex encoded, hash & defaults', () => {
    const data = "some data"

    const block = new Block(data)

    expect(block.hash).toBeNull()
    expect(block.height).toBe(0)
    expect(block.body).toBe(Buffer.from(JSON.stringify(data)).toString('hex'))
    expect(block.time).toBe(0)
    expect(block.previousBlockHash).toBeNull()
})

describe('validate function', () => {
    test(`when block is not tampered then return true`, async () => {
        const data = "some data"
        const block = new Block(data);
        block.hash = SHA256(JSON.stringify(block)).toString();

        const result = await block.validate()

        expect(result).toBeTruthy()
    })

    test(`when block is tampered then return false`, async () => {
        const block = new Block("some data");
        block.hash = SHA256(JSON.stringify(block)).toString();
        block.body = Buffer.from(JSON.stringify("tampered data")).toString('hex');

        const result = await block.validate();

        expect(result).toBeFalsy()
    })
})

describe(`getBData`, () => {
    test(`when block is the genesis then return error`, async() => {
        const block = new Block("Genesis");

        await expect(block.getBData()).rejects.toThrow("Genesis block hasn't associated data");      
    })

    test(`when block is NOT the genesis then return body data`, async() => {
        const data = {
            txid: "0A",
            vout: 0,
            tb1qjtdx8d0v85hrtaygnk59y9apkzd0svwfkczjm7: 0.1,
            tb1q57eccleashjp0rcu0cgcprz0uw9spc9hvmc30k: 0.3
        };
        const block = new Block(data);
        block.previousBlockHash = "a-hash"

        const result = await block.getBData();

        expect(result).toStrictEqual(data);
    })
})