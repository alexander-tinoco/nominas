import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../config/db.js', () => ({ default: { query: vi.fn() } }));

const { mockFindByEmail, mockUpdateCampoPerfil } = vi.hoisted(() => ({
  mockFindByEmail: vi.fn(),
  mockUpdateCampoPerfil: vi.fn(),
}));
vi.mock('../repositories/usuariosRepository.js', () => ({
  findByEmail: mockFindByEmail,
  updateCampoPerfil: mockUpdateCampoPerfil,
}));

const { mockInsertLog, mockFindRecent } = vi.hoisted(() => ({
  mockInsertLog: vi.fn().mockResolvedValue({}),
  mockFindRecent: vi.fn().mockResolvedValue([]),
}));
vi.mock('../repositories/logsSeguridadRepository.js', () => ({
  insertLog: mockInsertLog,
  findRecent: mockFindRecent,
}));

const { mockIncrementWithTTL, mockResetCounter } = vi.hoisted(() => ({
  mockIncrementWithTTL: vi.fn().mockResolvedValue(1),
  mockResetCounter: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../config/redis.js', () => ({
  incrementWithTTL: mockIncrementWithTTL,
  resetCounter: mockResetCounter,
  getCache: vi.fn(),
  setCache: vi.fn(),
  invalidateCachePattern: vi.fn(),
  default: {},
}));

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn(), hash: vi.fn() },
}));

import app from '../app.js';
import bcrypt from 'bcryptjs';
import { authCookie } from './helpers/authCookie.js';

const usuarioAdminRow = {
  id: 1,
  email: 'admin@nominas.local',
  password_hash: 'hash-simulado',
  rol: 'admin',
  nombre: 'Administrador Demo',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockInsertLog.mockResolvedValue({});
  mockIncrementWithTTL.mockResolvedValue(1);
});

describe('POST /api/auth/login', () => {
  it('responde 200, entrega cookie de sesión y registra login_exitoso', async () => {
    mockFindByEmail.mockResolvedValue(usuarioAdminRow);
    bcrypt.compare.mockResolvedValue(true);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@nominas.local', password: 'correcta' });

    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ email: 'admin@nominas.local', rol: 'admin' });
    expect(res.headers['set-cookie'][0]).toMatch(/^token=/);
    expect(mockInsertLog).toHaveBeenCalledWith(
      expect.objectContaining({ evento: 'login_exitoso', nivel: 'INFO' })
    );
  });

  it('responde 401 y registra login_fallido si la contraseña es incorrecta', async () => {
    mockFindByEmail.mockResolvedValue(usuarioAdminRow);
    bcrypt.compare.mockResolvedValue(false);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@nominas.local', password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(mockInsertLog).toHaveBeenCalledWith(
      expect.objectContaining({ evento: 'login_fallido', nivel: 'WARNING' })
    );
  });

  it('responde 401 si el usuario no existe (sin filtrar esa información al cliente)', async () => {
    mockFindByEmail.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'no-existe@nominas.local', password: 'cualquiera' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('responde 429 y registra cuenta_bloqueada_temporalmente tras superar el máximo de intentos', async () => {
    mockFindByEmail.mockResolvedValue(usuarioAdminRow);
    bcrypt.compare.mockResolvedValue(false);
    mockIncrementWithTTL.mockResolvedValue(5);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@nominas.local', password: 'incorrecta' });

    expect(res.status).toBe(429);
    expect(mockInsertLog).toHaveBeenCalledWith(
      expect.objectContaining({ evento: 'cuenta_bloqueada_temporalmente', nivel: 'ERROR' })
    );
  });

  it('responde 400 si falta la contraseña', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@nominas.local' });

    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('responde 401 sin cookie de sesión', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('responde 200 con los datos del usuario si la cookie es válida', async () => {
    const res = await request(app).get('/api/auth/me').set('Cookie', authCookie('usuario'));
    expect(res.status).toBe(200);
    expect(res.body.usuario).toMatchObject({ email: 'usuario@nominas.local', rol: 'usuario' });
  });
});

describe('POST /api/auth/logout', () => {
  it('responde 401 sin cookie de sesión', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('responde 200 y registra el evento logout con cookie válida', async () => {
    const res = await request(app).post('/api/auth/logout').set('Cookie', authCookie('admin'));
    expect(res.status).toBe(200);
    expect(mockInsertLog).toHaveBeenCalledWith(
      expect.objectContaining({ evento: 'logout', nivel: 'INFO' })
    );
  });
});

describe('PATCH /api/auth/profile', () => {
  it('responde 401 sin cookie de sesión', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .send({ campo: 'nombre', valor: 'Nuevo Nombre' });
    expect(res.status).toBe(401);
  });

  it('responde 400 si el campo no es editable', async () => {
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Cookie', authCookie('usuario'))
      .send({ campo: 'rol', valor: 'admin' });
    expect(res.status).toBe(400);
  });

  it('responde 200 y registra la auditoría con valor anterior y nuevo (Práctica 4)', async () => {
    mockFindByEmail.mockResolvedValue({
      id: 2,
      email: 'usuario@nominas.local',
      rol: 'usuario',
      nombre: 'Nombre Viejo',
    });
    mockUpdateCampoPerfil.mockResolvedValue({
      id: 2,
      email: 'usuario@nominas.local',
      rol: 'usuario',
      nombre: 'Nombre Nuevo',
    });

    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Cookie', authCookie('usuario'))
      .send({ campo: 'nombre', valor: 'Nombre Nuevo' });

    expect(res.status).toBe(200);
    expect(mockInsertLog).toHaveBeenCalledWith(
      expect.objectContaining({
        evento: 'perfil_actualizado',
        nivel: 'INFO',
        detalle: expect.objectContaining({
          campo: 'nombre',
          valor_anterior: 'Nombre Viejo',
          valor_nuevo: 'Nombre Nuevo',
        }),
      })
    );
  });
});

describe('Ruta protegida sin autenticación (caso "invitado" — Práctica 5)', () => {
  it('responde 401 y registra acceso_no_autorizado al llamar /api/empleados sin cookie', async () => {
    const res = await request(app).get('/api/empleados');
    expect(res.status).toBe(401);
    expect(mockInsertLog).toHaveBeenCalledWith(
      expect.objectContaining({ evento: 'acceso_no_autorizado', nivel: 'WARNING' })
    );
  });
});
