// Helper de tests: firma un JWT válido y lo devuelve como header "Cookie",
// listo para adjuntar con supertest (.set('Cookie', authCookie('admin'))).
import { signToken } from '../../utils/jwt.js';

const USUARIOS_TEST = {
  admin: { sub: 1, email: 'admin@nominas.local', rol: 'admin' },
  usuario: { sub: 2, email: 'usuario@nominas.local', rol: 'usuario' },
};

export const authCookie = (rol = 'usuario') => {
  const token = signToken(USUARIOS_TEST[rol]);
  return `token=${token}`;
};
