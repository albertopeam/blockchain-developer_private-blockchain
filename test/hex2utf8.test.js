const hex2utf8 = require('hex2utf8');

test('given encoded caracters when decoding them then match as decoded as expected', () => {
    const string = "§1234567890-=qwertyuiop[]asdfghjk;'zxcvbnm,./!@#$%ˆ&*()_+{}:|˜<>?*⁄€‹›ﬁﬂ‡°·‚—±QWERTYUIOPASDFGHJKLZXCVBNM";
    const hex = Buffer.from(string).toString("hex");

    const result = hex2utf8(hex);

    expect(result).toBe(string);
})

