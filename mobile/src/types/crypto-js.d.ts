declare module "crypto-js" {
  interface WordArray {
    toString(encoder?: object): string;
  }
  interface CipherParams {
    toString(): string;
  }
  const CryptoJS: {
    AES: {
      encrypt(message: string, key: string): CipherParams;
      decrypt(ciphertext: string, key: string): WordArray;
    };
    enc: {
      Utf8: object;
    };
  };
  export = CryptoJS;
}
