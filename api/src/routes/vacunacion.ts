import { Router, Response, NextFunction } from 'express';
import { withRLS } from '../db.js';
import { redis } from '../redis.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import type { MascotaVacunacionPendiente } from '../types/index.js';

const router = Router();

const CACHE_KEY = 'vacunacion_pendiente';
const CACHE_TTL = 300;

router.get(
  '/pendiente',
  async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cached = await redis.get(CACHE_KEY);

      if (cached !== null) {
        console.log('[CACHE HIT] vacunacion_pendiente');
        const data = JSON.parse(cached) as MascotaVacunacionPendiente[];
        res.status(200).json({ data, from_cache: true });
        return;
      }

      console.log('[CACHE MISS] vacunacion_pendiente');

      const session = req.session!;
      const rows = await withRLS(session, async (client) => {
        const result = await client.query<MascotaVacunacionPendiente>(
          'SELECT * FROM v_mascotas_vacunacion_pendiente'
        );
        return result.rows;
      });

      await redis.set(CACHE_KEY, JSON.stringify(rows), 'EX', CACHE_TTL);

      res.status(200).json({ data: rows, from_cache: false });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
