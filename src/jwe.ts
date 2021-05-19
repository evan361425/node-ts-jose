import { compactDecrypt } from 'jose/jwe/compact/decrypt';
import { CompactEncrypt } from 'jose/jwe/compact/encrypt';
import { decodeProtectedHeader } from 'jose/util/decode_protected_header';
import { JWK } from './jwk';
import { JWKS } from './jwks';
import { JWEDecryptOptions, JWEEncryptOptions, JWEKeyOptions } from './types';

export class JWE {
  static async decrypt(
    cypher: string,
    key: JWK | JWKS,
    options?: JWEDecryptOptions,
  ): Promise<string> {
    const jwk = await this.getKeyFrom(cypher, key, options);

    if (typeof options?.enc === 'string') options.enc = [options.enc];
    if (typeof options?.alg === 'string') options.alg = [options.alg];

    const result = await compactDecrypt(cypher, jwk.key, {
      contentEncryptionAlgorithms: options?.enc ? [...options.enc] : undefined,
      keyManagementAlgorithms: options?.alg ? [...options.alg] : undefined,
    });

    const decoder = new TextDecoder();
    return decoder.decode(result.plaintext);
  }

  static async encrypt(
    data: string,
    key: JWK | JWKS,
    options: JWEEncryptOptions,
  ): Promise<string> {
    const jwk = key.getKey({
      use: 'enc',
      kid: options.kid,
    });

    const encoder = new TextEncoder();
    const jwe = new CompactEncrypt(encoder.encode(data));

    jwe.setProtectedHeader({
      alg: options.alg,
      enc: options.enc,
      kid: options.kid ?? jwk.kid,
    });

    return jwe.encrypt((await jwk.toPublic()).key);
  }

  static async getKeyFrom(
    cypher: string,
    jwk: JWK | JWKS,
    options?: JWEKeyOptions,
  ): Promise<JWK> {
    const header = decodeProtectedHeader(cypher);

    return jwk.getKey({
      use: 'enc',
      kid: options?.kid ? options.kid : header.kid,
    });
  }
}
