import { Router, Request, Response, NextFunction } from 'express';
import { withRLS } from '../db.js';
import { redis } from '../redis.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

interface ApplyVacunaBody {
  mascota_id: number;
  vacuna_id: number;
  costo_cobrado?: number;
}

interface VacunaAplicadaRow {
  id: number;
}

router.post(
  '/',
  async (req: AuthenticatedRequest & Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mascota_id, vacuna_id, costo_cobrado } = req.body as ApplyVacunaBody;

      if (!mascota_id || !vacuna_id) {
        res.status(400).json({ error: 'mascota_id y vacuna_id son requeridos' });
        return;
      }

      const session = req.session!;

      if (session.rol === 'veterinario' && session.vet_id === undefined) {
        res.status(403).json({ error: 'Sesion de veterinario sin vet_id' });
        return;
      }

      const newRow = await withRLS(session, async (client) => {
        const result = await client.query<VacunaAplicadaRow>(
          `INSERT INTO vacunas_aplicadas
             (mascota_id, vacuna_id, veterinario_id, fecha_aplicacion, costo_cobrado)
           VALUES ($1, $2, $3, NOW(), $4)
           RETURNING id`,
          [mascota_id, vacuna_id, session.vet_id ?? null, costo_cobrado ?? null]
        );
        return result.rows[0];
      });

      await redis.del('vacunacion_pendiente');

      res.status(201).json({
        id: newRow.id,
        message: 'Vacuna aplicada correctamente',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
