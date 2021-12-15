/// <reference types="node" />
export declare function hmac(key: string | Buffer, value: string): Buffer;
export declare function hkdf(key: string | Buffer, value: string): Buffer;
export declare function secureRandom(numBytes: number): Buffer;
export declare type Ciphertext = {
    iv: Buffer;
    ct: Buffer;
};
export declare function symmetricEncrypt(key: string | Buffer, plaintext: string): Ciphertext;
export declare function symmetricDecrypt(key: string | Buffer, ciphertext: Ciphertext): string;
