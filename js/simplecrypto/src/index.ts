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
