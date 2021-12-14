/// <reference types="node" />
declare const _crypto: any;
declare function hmac(key: string | Buffer, value: string): Buffer;
declare function hkdf(key: string | Buffer, value: string): Buffer;
declare function secureRandom(numBytes: number): Buffer;
declare type Ciphertext = {
    iv: Buffer;
    ct: Buffer;
};
declare function symmetricEncrypt(key: string | Buffer, plaintext: string): Ciphertext;
declare function symmetricDecrypt(key: string | Buffer, ciphertext: Ciphertext): string;
