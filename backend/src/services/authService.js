import bcrypt from 'bcryptjs';
import * as usuariosRepository from '../repositories/usuariosRepository.js';
import { signToken } from '../utils/jwt.js';
import { logSecurityEvent } from '../utils/securityLogger.js';
import { incrementWithTTL, resetCounter } from '../config/redis.js';

const MAX_INTENTOS_FALLIDOS = 5;
const VENTANA_BLOQUEO_SEGUNDOS = 15 * 60;

export const login = async (email, password, meta = {}) => {
  const intentosKey = `login_intentos:${email}`;
  const usuario = await usuariosRepository.findByEmail(email);
  const passwordValida = usuario ? await bcrypt.compare(password, usuario.password_hash) : false;

  if (!usuario || !passwordValida) {
    const intentos = await incrementWithTTL(intentosKey, VENTANA_BLOQUEO_SEGUNDOS);

    if (intentos !== null && intentos >= MAX_INTENTOS_FALLIDOS) {
      await logSecurityEvent({
        usuario: email,
        evento: 'cuenta_bloqueada_temporalmente',
        detalle: { motivo: 'Demasiados intentos fallidos', intentos, ventana_segundos: VENTANA_BLOQUEO_SEGUNDOS, ip: meta.ip }
      });

      const err = new Error('Cuenta bloqueada temporalmente por demasiados intentos fallidos. Intente de nuevo en unos minutos.');
      err.status = 429;
      throw err;
    }

    await logSecurityEvent({
      usuario: email,
      evento: 'login_fallido',
      detalle: { motivo: usuario ? 'Contraseña incorrecta' : 'Usuario no encontrado', intentos: intentos ?? undefined, ip: meta.ip }
    });

    const err = new Error('Credenciales inválidas');
    err.status = 401;
    throw err;
  }

  await resetCounter(intentosKey);

  const token = signToken({ sub: usuario.id, email: usuario.email, rol: usuario.rol });

  await logSecurityEvent({
    usuario: usuario.email,
    evento: 'login_exitoso',
    detalle: { rol: usuario.rol, ip: meta.ip }
  });

  return { token, usuario: { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre } };
};

export const logout = async (usuarioEmail, meta = {}) => {
  await logSecurityEvent({
    usuario: usuarioEmail,
    evento: 'logout',
    detalle: { ip: meta.ip }
  });
};

export const updateProfile = async (user, campo, valorNuevo) => {
  const usuarioActual = await usuariosRepository.findByEmail(user.email);
  const valorAnterior = usuarioActual ? usuarioActual[campo] : undefined;

  const actualizado = await usuariosRepository.updateCampoPerfil(user.sub, campo, valorNuevo);

  await logSecurityEvent({
    usuario: user.email,
    evento: 'perfil_actualizado',
    detalle: { campo, valor_anterior: valorAnterior, valor_nuevo: valorNuevo }
  });

  return actualizado;
};
