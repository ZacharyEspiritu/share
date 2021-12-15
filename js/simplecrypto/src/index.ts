'use strict'

const crypto = require("crypto")

export function hmac(key: string|Buffer, value: string): Buffer {
    return crypto.createHmac("sha256", Buffer.from(key))
        .update(Buffer.from(value))
        .digest()
}

export function hkdf(key: string|Buffer, value: string): Buffer {
    return hmac(key, value)
}

export function secureRandom(numBytes: number): Buffer {
    return crypto.randomBytes(numBytes)
}

export type Ciphertext = {
    iv: Buffer
    ct: Buffer
}

export function symmetricEncrypt(key: string|Buffer, plaintext: string): Ciphertext {
    const iv = secureRandom(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv)
    let ct = cipher.update(plaintext)
    ct = Buffer.concat([ct, cipher.final()])
    return { iv, ct }
}

export function symmetricDecrypt(key: string|Buffer, ciphertext: Ciphertext): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), ciphertext.iv)
    let decrypted = decipher.update(ciphertext.ct)
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}

export type PKEPublicKey = string
export type PKEPrivateKey = string

export type PKEKey = {
    publicKey: PKEPublicKey
    privateKey: PKEPrivateKey
}

export function pkeKeyGen() {
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
    })
}

export function pkeEncrypt(publicKey: PKEPublicKey, plaintext: string): Buffer {
    return crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(plaintext));
}

export function pkeDecrypt(privateKey: PKEPrivateKey, ciphertext: Buffer): string {
    const decrypted = crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, ciphertext);
    return decrypted.toString();
}
