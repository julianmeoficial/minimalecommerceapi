import { requireJwtSecret } from './jwt-secret';

describe('requireJwtSecret', () => {
  it('acepta un secreto de 32+ caracteres', () => {
    expect(requireJwtSecret('abcdefghijklmnopqrstuvwxyz123456')).toHaveLength(32);
  });

  it('rechaza ausente o corto', () => {
    expect(() => requireJwtSecret(undefined)).toThrow(/JWT_SECRET/);
    expect(() => requireJwtSecret('corto')).toThrow(/JWT_SECRET/);
  });

  it('rechaza placeholders en producción', () => {
    expect(() =>
      requireJwtSecret('change-me-to-a-long-random-secret-key-32', 'production'),
    ).toThrow(/producción/);
  });

  it('permite el placeholder de ejemplo fuera de producción', () => {
    expect(
      requireJwtSecret('change-me-to-a-long-random-secret-key-32', 'development'),
    ).toBeTruthy();
  });
});
