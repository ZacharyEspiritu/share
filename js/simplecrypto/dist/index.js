'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.pkeDecrypt = exports.pkeEncrypt = exports.pkeKeyGen = exports.symmetricDecrypt = exports.symmetricEncrypt = exports.secureRandom = exports.hkdf = exports.hmac = exports.STRING_ENCODING = void 0;
const crypto = require("crypto");
exports.STRING_ENCODING = 'base64';
function hmac(key, value) {
    return crypto.createHmac("sha256", Buffer.from(key, exports.STRING_ENCODING))
        .update(Buffer.from(value))
        .digest().toString(exports.STRING_ENCODING);
}
exports.hmac = hmac;
function hkdf(key, value) {
    return hmac(key, value);
}
exports.hkdf = hkdf;
function secureRandom(numBytes) {
    return crypto.randomBytes(numBytes).toString(exports.STRING_ENCODING);
}
exports.secureRandom = secureRandom;
function symmetricEncrypt(key, plaintext) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, exports.STRING_ENCODING), iv);
    const ct = Buffer.concat([
        cipher.update(Buffer.from(plaintext)),
        cipher.final()
    ]);
    return { iv: iv.toString(exports.STRING_ENCODING), ct: ct.toString(exports.STRING_ENCODING) };
}
exports.symmetricEncrypt = symmetricEncrypt;
function symmetricDecrypt(key, ciphertext) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, exports.STRING_ENCODING), Buffer.from(ciphertext.iv, exports.STRING_ENCODING));
    let decrypted = decipher.update(Buffer.from(ciphertext.ct, exports.STRING_ENCODING));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
exports.symmetricDecrypt = symmetricDecrypt;
function pkeKeyGen() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 4096,
        publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
        },
        privateKeyEncoding: {
            type: 'pkcs1',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: '',
        },
    });
    return { publicKey, privateKey };
}
exports.pkeKeyGen = pkeKeyGen;
function pkeEncrypt(publicKey, plaintext) {
    return crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(plaintext)).toString(exports.STRING_ENCODING);
}
exports.pkeEncrypt = pkeEncrypt;
function pkeDecrypt(privateKey, ciphertext) {
    return crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(ciphertext, exports.STRING_ENCODING)).toString();
}
exports.pkeDecrypt = pkeDecrypt;
