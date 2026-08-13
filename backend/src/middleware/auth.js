import { verifyToken } from '../utils/jwt.js';
import { logSecurityEvent } from '../utils/securityLogger.js';

// Verifica el JWT enviado en la cookie httpOnly "token" y adjunta req.user.
// Cubre el caso "invitado" (no autenticado) de la Práctica 5: cualquier
// petición sin cookie válida contra una ruta protegida queda registrada.
export const requireAuth = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    await logSecurityEvent({
      usuario: 'anonimo',
      evento: 'acceso_no_autorizado',
      detalle: { ruta: req.originalUrl, metodo: req.method, motivo: 'Sin cookie de sesión', ip: req.ip }
    });
    return res.status(401).json({ error: 'No autenticado' });
  }

  try {
    req.user = verifyToken(token);
    return next();
  } catch {
    await logSecurityEvent({
      usuario: 'anonimo',
      evento: 'acceso_no_autorizado',
      detalle: { ruta: req.originalUrl, metodo: req.method, motivo: 'Token inválido o expirado', ip: req.ip }
    });
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
};

// Restringe una ruta a uno o más roles. Debe usarse después de requireAuth.
export const requireRole = (...rolesPermitidos) => {
  return async (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      await logSecurityEvent({
        usuario: req.user?.email || 'anonimo',
        evento: 'acceso_denegado_rol',
        detalle: {
          ruta: req.originalUrl,
          metodo: req.method,
          rol_actual: req.user?.rol,
          roles_requeridos: rolesPermitidos,
          ip: req.ip
        }
      });
      return res.status(403).json({ error: 'No tiene permisos suficientes para esta acción' });
    }
    return next();
  };
};
