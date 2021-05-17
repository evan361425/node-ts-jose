import { expect } from 'chai';
import decodeProtectedHeader from 'jose/util/decode_protected_header';
import { JWK, JWS } from '../src';
import { getKey } from './mock-key';

describe('JWS', () => {
  describe('#verify()', () => {
    it('should ok', async () => {
      const payload = await JWS.verify(token, publicKey);
      expect(payload.toString()).is.eq('some-data');
    });

    it('should throw error if algorithms is not correct', async () => {
      return JWS.verify(token, publicKey, { algorithms: ['ES384'] })
        .then((_) => expect.fail('should not pass if "typ" is wrong'))
        .catch((reason) => expect(reason.message).is.contain('alg'));
    });

    it('should throw error if typ is wrong', async () => {
      return JWS.verify(token, publicKey, { typ: 'OKP' })
        .then((_) => expect.fail('should not pass if "typ" is wrong'))
        .catch((reason) => expect(reason.message).is.contain('typ'));
    });

    let token: string;
    let publicKey: JWK;

    before(async () => {
      const key = await getKey();
      publicKey = await key.toPublic();
      // sign!
      token = await JWS.sign('some-data', key, { typ: 'EC' });
    });
  });

  describe('#sign()', () => {
    it('should throw error in wrong "kid"', async () => {
      return JWS.sign('some-data', key, { kid: 'second-id' })
        .then((_) => expect.fail('should not pass if "kid" is wrong'))
        .catch((reason) => expect(reason.message).is.contain('kid'));
    });

    it('should throw error in wrong "alg"', async () => {
      return JWS.sign('some-data', key, { alg: 'ES384' })
        .then((_) => expect.fail('should not pass if "alg" is wrong'))
        .catch((reason) => expect(reason.message).is.contain('alg'));
    });

    it('should use key metadata if option not set', async () => {
      const signature = await JWS.sign('some-data', key);
      const header = decodeProtectedHeader(signature);
      expect(header.alg).is.eq('ES256');
      expect(header.kid).is.eq('some-id');
    });

    it('should use option metadata', async () => {
      key.metadata.kid = 'second-id';
      const signature = await JWS.sign('some-data', key, {
        kid: 'second-id',
        alg: 'ES256',
        typ: 'EC',
      });
      const header = decodeProtectedHeader(signature);
      expect(header.alg).is.eq('ES256');
      expect(header.kid).is.eq('second-id');
      expect(header.typ).is.eq('EC');
      key.metadata.kid = 'some-id';
    });

    let key: JWK;

    before(async () => {
      key = await getKey();
    });
  });

  describe('Embedded Key', () => {
    it('should sign with embedded key', async () => {
      const key = await getKey();
      const token = await JWS.sign('some-data', key, { jwk: true });
      const data = await JWS.verify(token);
      expect(data).is.eq('some-data');
    });
  });
});