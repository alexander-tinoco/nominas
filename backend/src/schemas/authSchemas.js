import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'El email es requerido').email('Email inválido'),
    password: z.string().min(1, 'La contraseña es requerida')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    campo: z.enum(['nombre', 'email'], { message: 'Campo debe ser "nombre" o "email"' }),
    valor: z.string().min(1, 'El valor es requerido')
  })
});
