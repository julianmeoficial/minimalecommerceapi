const MIN_LENGTH = 32;
const INSECURE = new Set([
  'dev-secret',
  'change-me',
  'secret',
  'change-me-to-a-long-random-secret-key-32',
]);

/** Exige un JWT_SECRET usable. En producción también rechaza placeholders conocidos. */
export function requireJwtSecret(raw?: string, nodeEnv = process.env.NODE_ENV): string {
  const secret = raw?.trim() ?? '';
  if (secret.length < MIN_LENGTH) {
    throw new Error(
      `JWT_SECRET debe existir y tener al menos ${MIN_LENGTH} caracteres`,
    );
  }
  if (nodeEnv === 'production' && INSECURE.has(secret)) {
    throw new Error('JWT_SECRET de producción no puede ser un valor de ejemplo');
  }
  return secret;
}
