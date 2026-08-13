import * as authService from '../services/authService.js';
import env from '../config/env.js';

const COOKIE_NAME = 'token';
const COOKIE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // Coincide con el default de JWT_EXPIRES_IN (2h)

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  maxAge: COOKIE_MAX_AGE_MS
});

// POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, usuario } = await authService.login(email, password, { ip: req.ip });

    res.cookie(COOKIE_NAME, token, cookieOptions());
    res.json({ usuario });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await authService.logout(req.user.email, { ip: req.ip });
    }
    res.clearCookie(COOKIE_NAME, cookieOptions());
    res.json({ message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const me = (req, res) => {
  const { sub, email, rol } = req.user;
  res.json({ usuario: { id: sub, email, rol } });
};

// PATCH /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { campo, valor } = req.body;
    const actualizado = await authService.updateProfile(req.user, campo, valor);
    res.json({ usuario: actualizado });
  } catch (err) {
    next(err);
  }
};
