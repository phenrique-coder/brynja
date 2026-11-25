import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
} from 'node:crypto';
import {
  EncryptedPayload,
  ITokenCipher,
} from '../../domain/ports/server.ports';

export class AesTokenCipherService implements ITokenCipher {
  private readonly key: Buffer;

  constructor(rawKeyOverride?: string) {
    const rawKey =
      rawKeyOverride?.trim() ||
      process.env.TOKEN_ENCRYPTION_KEY?.trim() ||
      'veredito-sec-dev-fallback-key-change-in-prod';

    if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
      this.key = Buffer.from(rawKey, 'hex');
    } else {
      this.key = createHash('sha256').update(rawKey).digest();
    }
  }

  encrypt(plaintext: string): EncryptedPayload {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      encryptedToken: encrypted.toString('base64url'),
      iv: iv.toString('base64url'),
      authTag: authTag.toString('base64url'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const b64UrlRe = /^[A-Za-z0-9_-]+$/;
    if (
      !b64UrlRe.test(payload.iv) ||
      !b64UrlRe.test(payload.authTag) ||
      !b64UrlRe.test(payload.encryptedToken)
    ) {
      throw new Error('Invalid ciphertext encoding.');
    }

    const iv = Buffer.from(payload.iv, 'base64url');
    const authTag = Buffer.from(payload.authTag, 'base64url');
    const encrypted = Buffer.from(payload.encryptedToken, 'base64url');

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }

  deriveHmacHex(purpose: string, data: string, length = 32): string {
    return createHmac('sha256', this.key)
      .update(`${purpose}:${data}`)
      .digest('hex')
      .slice(0, length);
  }
}
