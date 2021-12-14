'use strict'

const _crypto = require("crypto");

function hmac(key: string, value: string): Buffer {
    return _crypto.createHmac("sha256", Buffer.from(key, 'hex'))
        .update(Buffer.from(value))
        .digest();
}

function secureRandom(numBytes: number): Buffer {
    return _crypto.randomBytes(numBytes);
}

type Ciphertext = {
    iv: Buffer
    ct: Buffer
}

function symmetricEncrypt(key: string, plaintext: string): Ciphertext {
    const iv = secureRandom(16);
    const cipher = _crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let ct = cipher.update(plaintext);
    ct = Buffer.concat([ct, cipher.final()]);
    return { iv, ct };
}

function symmetricDecrypt(key: string, ciphertext: Ciphertext): string {
    const decipher = _crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), ciphertext.iv);
    let decrypted = decipher.update(ciphertext.ct);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

module.exports = Object.freeze({
    hmac,
    secureRandom,
    symmetricEncrypt,
    symmetricDecrypt,
})
