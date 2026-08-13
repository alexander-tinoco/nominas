import { Router } from 'express';
import { login, logout, me, updateProfile } from '../controllers/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validate.js';
import { loginSchema, updateProfileSchema } from '../schemas/authSchemas.js';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Verifica credenciales y, si son válidas, entrega un JWT de sesión en una cookie httpOnly. Registra el evento en logs_seguridad (login_exitoso o login_fallido). Tras 5 intentos fallidos en 15 minutos, bloquea temporalmente el usuario.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@nominas.local
 *               password:
 *                 type: string
 *                 example: Practica2026Admin!
 *     responses:
 *       200:
 *         description: Login exitoso, cookie de sesión establecida.
 *       401:
 *         description: Credenciales inválidas.
 *       429:
 *         description: Cuenta bloqueada temporalmente por demasiados intentos fallidos.
 */
router.post('/login', validateRequest(loginSchema), login);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     summary: Cerrar sesión
 *     description: Invalida la cookie de sesión y registra el evento logout.
 *     tags:
 *       - Autenticación
 *     responses:
 *       200:
 *         description: Sesión cerrada correctamente.
 */
router.post('/logout', requireAuth, logout);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Obtener el usuario autenticado actual
 *     tags:
 *       - Autenticación
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado.
 *       401:
 *         description: No autenticado.
 */
router.get('/me', requireAuth, me);

/**
 * @openapi
 * /api/auth/profile:
 *   patch:
 *     summary: Actualizar un campo del perfil propio
 *     description: Actualiza "nombre" o "email" del usuario autenticado y registra la auditoría (campo, valor anterior, valor nuevo) en logs_seguridad.
 *     tags:
 *       - Autenticación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [campo, valor]
 *             properties:
 *               campo:
 *                 type: string
 *                 enum: [nombre, email]
 *               valor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente.
 *       401:
 *         description: No autenticado.
 */
router.patch('/profile', requireAuth, validateRequest(updateProfileSchema), updateProfile);

export default router;
