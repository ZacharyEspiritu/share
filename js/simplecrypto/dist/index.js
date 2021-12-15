'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.pkeDecrypt = exports.pkeEncrypt = exports.pkeKeyGen = exports.symmetricDecrypt = exports.symmetricEncrypt = exports.secureRandom = exports.hkdf = exports.hmac = void 0;
const crypto = require("crypto");
function hmac(key, value) {
    return crypto.createHmac("sha256", Buffer.from(key))
        .update(Buffer.from(value))
        .digest();
}
exports.hmac = hmac;
function hkdf(key, value) {
    return hmac(key, value);
}
exports.hkdf = hkdf;
function secureRandom(numBytes) {
    return crypto.randomBytes(numBytes);
}
exports.secureRandom = secureRandom;
function symmetricEncrypt(key, plaintext) {
    const iv = secureRandom(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let ct = cipher.update(plaintext);
    ct = Buffer.concat([ct, cipher.final()]);
    return { iv, ct };
}
exports.symmetricEncrypt = symmetricEncrypt;
function symmetricDecrypt(key, ciphertext) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), ciphertext.iv);
    let decrypted = decipher.update(ciphertext.ct);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
exports.symmetricDecrypt = symmetricDecrypt;
function pkeKeyGen() {
    return crypto.generateKeyPairSync('ed25519', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'spki',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: '',
        },
    });
}
exports.pkeKeyGen = pkeKeyGen;
function pkeEncrypt(publicKey, plaintext) {
    return crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(plaintext));
}
exports.pkeEncrypt = pkeEncrypt;
function pkeDecrypt(privateKey, ciphertext) {
    const decrypted = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, ciphertext);
    return decrypted.toString();
}
exports.pkeDecrypt = pkeDecrypt;
