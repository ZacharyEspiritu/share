/// <reference types="node" />
declare const _crypto: any;
declare function hmac(key: string, value: string): Buffer;
declare function secureRandom(numBytes: number): Buffer;
declare type Ciphertext = {
    iv: Buffer;
    ct: Buffer;
};
declare function symmetricEncrypt(key: string, plaintext: string): Ciphertext;
declare function symmetricDecrypt(key: string, ciphertext: Ciphertext): string;
