import { componerToken, hashSecreto, separarToken, secretoCoincide } from './refresh-token';

describe('refresh-token dominio', () => {
  it('compone y separa tokens', () => {
    const id = '00000000-0000-4000-8000-000000000099';
    const token = componerToken(id, 'secreto-largo-de-prueba');
    expect(separarToken(token)).toEqual({ id, secreto: 'secreto-largo-de-prueba' });
  });

  it('valida hash de secreto', () => {
    const secreto = 'abc';
    const hash = hashSecreto(secreto);
    expect(secretoCoincide(secreto, hash)).toBe(true);
    expect(secretoCoincide('otro', hash)).toBe(false);
  });
});
