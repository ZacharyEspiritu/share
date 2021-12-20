'use strict'

const crypto = require("crypto")

export const STRING_ENCODING = 'base64'

export function hmac(key: string, value: string): string {
    return crypto.createHmac("sha256", Buffer.from(key, STRING_ENCODING))
        .update(Buffer.from(value))
        .digest().toString(STRING_ENCODING)
}

export function hkdf(key: string, value: string): string {
    return hmac(key, value)
}

export function secureRandom(numBytes: number): string {
    return crypto.randomBytes(numBytes).toString(STRING_ENCODING)
}

export type Ciphertext = {
    iv: string
    ct: string
}

export function symmetricEncrypt(key: string, plaintext: string): Ciphertext {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key, STRING_ENCODING), iv)
    const ct = Buffer.concat([
        cipher.update(Buffer.from(plaintext)),
        cipher.final()
    ])
    return { iv: iv.toString(STRING_ENCODING), ct: ct.toString(STRING_ENCODING) }
}

export function symmetricDecrypt(key: string, ciphertext: Ciphertext): string {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key, STRING_ENCODING), Buffer.from(ciphertext.iv, STRING_ENCODING))
    let decrypted = decipher.update(Buffer.from(ciphertext.ct, STRING_ENCODING))
    decrypted = Buffer.concat([decrypted, decipher.final()])
    return decrypted.toString()
}

export type PKEPublicKey = string
export type PKEPrivateKey = string

export type PKEKey = {
    publicKey: PKEPublicKey
    privateKey: PKEPrivateKey
}

export function pkeKeyGen(): PKEKey {
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
    })
    return { publicKey, privateKey }
}

export function pkeEncrypt(publicKey: PKEPublicKey, plaintext: string): string {
    return crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(plaintext)).toString(STRING_ENCODING);
}

export function pkeDecrypt(privateKey: PKEPrivateKey, ciphertext: string): string {
    return crypto.privateDecrypt({
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
    }, Buffer.from(ciphertext, STRING_ENCODING)).toString();
}
