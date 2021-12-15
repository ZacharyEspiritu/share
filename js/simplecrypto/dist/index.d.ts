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
export declare type PKEPublicKey = string;
export declare type PKEPrivateKey = string;
export declare type PKEKey = {
    publicKey: PKEPublicKey;
    privateKey: PKEPrivateKey;
};
export declare function pkeKeyGen(): any;
export declare function pkeEncrypt(publicKey: PKEPublicKey, plaintext: string): Buffer;
export declare function pkeDecrypt(privateKey: PKEPrivateKey, ciphertext: Buffer): string;
