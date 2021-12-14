'use strict';
const _crypto = require("crypto");
function hmac(key, value) {
    return _crypto.createHmac("sha256", Buffer.from(key))
        .update(Buffer.from(value))
        .digest();
}
function hkdf(key, value) {
    return hmac(key, value);
}
function secureRandom(numBytes) {
    return _crypto.randomBytes(numBytes);
}
function symmetricEncrypt(key, plaintext) {
    const iv = secureRandom(16);
    const cipher = _crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let ct = cipher.update(plaintext);
    ct = Buffer.concat([ct, cipher.final()]);
    return { iv, ct };
}
function symmetricDecrypt(key, ciphertext) {
    const decipher = _crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), ciphertext.iv);
    let decrypted = decipher.update(ciphertext.ct);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
module.exports = Object.freeze({
    hmac,
    hkdf,
    secureRandom,
    symmetricEncrypt,
    symmetricDecrypt,
});
