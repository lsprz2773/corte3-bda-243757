import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db.js';
import type { LoginRequest, LoginResponse, AuthPayload } from '../types/index.js';

const router = Router();

router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { rol, vet_id, cedula, password } = req.body as LoginRequest;

      if (!rol) {
        res.status(400).json({ error: 'El campo rol es requerido' });
        return;
      }

      let payload: AuthPayload;

      if (rol === 'veterinario') {
        if (vet_id === undefined || !cedula) {
          res.status(400).json({ error: 'vet_id y cedula son requeridos para rol veterinario' });
          return;
        }

        const result = await pool.query<{ id: number; nombre: string }>(
          'SELECT id, nombre FROM veterinarios WHERE id = $1 AND cedula = $2 AND activo = TRUE',
          [vet_id, cedula]
        );

        if (result.rowCount === 0) {
          res.status(401).json({ error: 'Credenciales invalidas' });
          return;
        }

        const vet = result.rows[0];
        payload = { rol: 'veterinario', vet_id: vet.id, nombre: vet.nombre };

      } else if (rol === 'recepcion') {
        if (password !== 'recepcion123') {
          res.status(401).json({ error: 'Credenciales invalidas' });
          return;
        }
        payload = { rol: 'recepcion' };

      } else if (rol === 'admin') {
        if (password !== 'admin123') {
          res.status(401).json({ error: 'Credenciales invalidas' });
          return;
        }
        payload = { rol: 'admin' };

      } else {
        res.status(400).json({ error: 'Rol invalido' });
        return;
      }

      const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: '8h',
      });

      const response: LoginResponse = {
        token,
        rol: payload.rol,
        ...(payload.vet_id !== undefined && { vet_id: payload.vet_id }),
        ...(payload.nombre !== undefined && { nombre: payload.nombre }),
      };

      res.status(200).json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
