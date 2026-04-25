import { Router, Response, NextFunction } from 'express';
import { withRLS } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { Mascota } from '../types/index.js';

const router = Router();

router.get(
  '/buscar',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = typeof req.query['q'] === 'string' ? req.query['q'] : '';

      const session = req.session!;
      const rows = await withRLS(session, async (client) => {
        const result = await client.query<Mascota>(
          `SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento, m.dueno_id,
                  d.nombre AS dueno_nombre
           FROM mascotas m
           JOIN duenos d ON d.id = m.dueno_id
           WHERE m.nombre ILIKE $1
           LIMIT 50`,
          [`%${q}%`]
        );
        return result.rows;
      });

      res.status(200).json(rows);
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  '/',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const session = req.session!;
      const rows = await withRLS(session, async (client) => {
        const result = await client.query<Mascota>(
          `SELECT m.id, m.nombre, m.especie, m.fecha_nacimiento, m.dueno_id,
                  d.nombre AS dueno_nombre
           FROM mascotas m
           JOIN duenos d ON d.id = m.dueno_id
           ORDER BY m.nombre`
        );
        return result.rows;
      });

      res.status(200).json(rows);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
