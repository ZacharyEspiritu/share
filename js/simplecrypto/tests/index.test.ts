'use strict'

import 'jest'
import * as fc from 'fast-check'
import {
    hmac,
    hkdf,
    secureRandom,
    symmetricEncrypt,
    symmetricDecrypt,
    pkeKeyGen,
    pkeEncrypt,
    pkeDecrypt,
    STRING_ENCODING
} from 'simplecrypto'

describe('hmac', () => {
    it('should return the same hash for equal inputs on the same key', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a === b) {
                    const key = secureRandom(32)
                    expect(hmac(key, a)).toEqual(hmac(key, b))
                }
            })
        )
    })

    it('should return a different hash for equal inputs on the same key', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a !== b) {
                    const key = secureRandom(32)
                    expect(hmac(key, a)).not.toEqual(hmac(key, b))
                }
            })
        )
    })

    it('should return a different hash for equal inputs on different keys', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a === b) {
                    const key1 = secureRandom(32)
                    const key2 = secureRandom(32)
                    expect(hmac(key1, a)).not.toEqual(hmac(key2, b))
                }
            })
        )
    })

    it('should return a different hash for equal inputs on different keys', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a !== b) {
                    const key1 = secureRandom(32)
                    const key2 = secureRandom(32)
                    expect(hmac(key1, a)).not.toEqual(hmac(key2, b))
                }
            })
        )
    })
})

describe('hkdf', () => {
    it('should return the same key for equal inputs on the same key', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a === b) {
                    const key = secureRandom(32)
                    expect(hkdf(key, a)).toEqual(hkdf(key, b))
                }
            })
        )
    })

    it('should return a different key for equal inputs on the same key', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a !== b) {
                    const key = secureRandom(32)
                    expect(hkdf(key, a)).not.toEqual(hkdf(key, b))
                }
            })
        )
    })

    it('should return a different key for equal inputs on different keys', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a === b) {
                    const key1 = secureRandom(32)
                    const key2 = secureRandom(32)
                    expect(hkdf(key1, a)).not.toEqual(hkdf(key2, b))
                }
            })
        )
    })

    it('should return a different key for equal inputs on different keys', async () => {
        fc.assert(
            fc.property(fc.string(), fc.string(), (a, b) => {
                if (a !== b) {
                    const key1 = secureRandom(32)
                    const key2 = secureRandom(32)
                    expect(hkdf(key1, a)).not.toEqual(hkdf(key2, b))
                }
            })
        )
    })
})

describe('symmetricEncrypt and symmetricDecrypt', () => {
    it('should decrypt back to the same plaintext under the same key', async () => {
        fc.assert(
            fc.property(fc.string(), (plaintext) => {
                const key = secureRandom(32)
                const ciphertext = symmetricEncrypt(key, plaintext)
                expect(ciphertext).not.toEqual(plaintext)
                expect(symmetricDecrypt(key, ciphertext)).toEqual(plaintext)
            })
        )
    })
})

describe('pkeEncrypt and pkeDecrypt', () => {
    it('should decrypt back to the same plaintext under the same key-pair', async () => {
        fc.assert(
            fc.property(fc.string(), (plaintext) => {
                const { publicKey, privateKey } = pkeKeyGen()
                const ciphertext = pkeEncrypt(publicKey, plaintext)
                expect(ciphertext).not.toEqual(plaintext)
                expect(pkeDecrypt(privateKey, ciphertext)).toEqual(plaintext)
            })
        )
    })
})
