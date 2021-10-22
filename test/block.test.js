const Block = require('block');

test('when initialize then set body hex encoded & defaults', () => {
    const data = "some data"

    const block = new Block(data)
    
    expect(block.hash).toBeNull()
    expect(block.height).toBe(0)
    expect(block.body).toBe(Buffer.from(JSON.stringify(data)).toString('hex'))
    expect(block.time).toBe(0)
    expect(block.previousBlockHash).toBeNull()
})