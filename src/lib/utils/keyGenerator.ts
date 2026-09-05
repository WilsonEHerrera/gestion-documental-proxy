import crypto from 'crypto';

export type KeyEnvironment = 'live' | 'test';

export interface GeneratedKeySet {
  publicKey: string;
  privateKey: string;
}

/**
 * Genera un par de llaves criptográficamente seguras con el patrón estándar de la industria:
 * - Llave Pública: pub_[env]_[hex de 32 caracteres]
 * - Llave Privada: prv_[env]_[hex de 32 caracteres]
 * 
 * Ejemplo:
 * - pub_live_a3f9104bc892e1d054ab37c98e21a07f
 * - prv_live_f71290ab3c4d5e6f8a9b0c1d2e3f4a5b
 */
export function generateApiKeyPair(env: KeyEnvironment = 'live'): GeneratedKeySet {
  const publicBytes = crypto.randomBytes(16).toString('hex');
  const privateBytes = crypto.randomBytes(16).toString('hex');

  return {
    publicKey: `pub_${env}_${publicBytes}`,
    privateKey: `prv_${env}_${privateBytes}`,
  };
}
