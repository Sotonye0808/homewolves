export const DEV_JWT_SECRET = 'homewolves-dev-secret';

/**
 * Resolves the JWT signing/verification secret.
 *
 * In production the secret is mandatory — signing tokens with a public,
 * hardcoded fallback would be a critical security hole. In non-production
 * environments a known dev secret keeps local tooling frictionless.
 */
export function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production' && !secret) {
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }
  return secret ?? DEV_JWT_SECRET;
}