export declare const STRING_ENCODING = "base64";
export declare function hmac(key: string, value: string): string;
export declare function hkdf(key: string, value: string): string;
export declare function secureRandom(numBytes: number): string;
export declare type Ciphertext = {
    iv: string;
    ct: string;
};
export declare function symmetricEncrypt(key: string, plaintext: string): Ciphertext;
export declare function symmetricDecrypt(key: string, ciphertext: Ciphertext): string;
export declare type PKEPublicKey = string;
export declare type PKEPrivateKey = string;
export declare type PKEKey = {
    publicKey: PKEPublicKey;
    privateKey: PKEPrivateKey;
};
export declare function pkeKeyGen(): PKEKey;
export declare function pkeEncrypt(publicKey: PKEPublicKey, plaintext: string): string;
export declare function pkeDecrypt(privateKey: PKEPrivateKey, ciphertext: string): string;
