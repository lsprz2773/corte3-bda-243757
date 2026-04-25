import { Router, Request, Response, NextFunction } from 'express';
import { withRLS } from '../db.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

interface AgendarCitaBody {
  mascota_id: number;
  veterinario_id: number;
  fecha_hora: string;
  motivo?: string;
}

router.post(
  '/',
  async (req: AuthenticatedRequest & Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { mascota_id, veterinario_id, fecha_hora, motivo } = req.body as AgendarCitaBody;

      if (!mascota_id || !veterinario_id || !fecha_hora) {
        res.status(400).json({ error: 'mascota_id, veterinario_id y fecha_hora son requeridos' });
        return;
      }

      const session = req.session!;

      const cita_id = await withRLS(session, async (client) => {
        const result = await client.query<{ p_cita_id: number }>(
          'CALL sp_agendar_cita($1, $2, $3, $4, NULL)',
          [mascota_id, veterinario_id, fecha_hora, motivo ?? null]
        );

        if (result.rows.length > 0 && result.rows[0].p_cita_id !== undefined) {
          return result.rows[0].p_cita_id;
        }

        const fallback = await client.query<{ id: number }>(
          `SELECT id FROM citas
           WHERE mascota_id = $1 AND veterinario_id = $2
           ORDER BY id DESC
           LIMIT 1`,
          [mascota_id, veterinario_id]
        );
        return fallback.rows[0]?.id ?? null;
      });

      res.status(201).json({
        cita_id,
        message: 'Cita agendada correctamente',
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
