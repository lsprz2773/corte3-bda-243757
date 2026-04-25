import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../db.js';

const router = Router();

interface VeterinarioPublico {
  id: number;
  nombre: string;
}

router.get(
  '/',
  async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await pool.query<VeterinarioPublico>(
        'SELECT id, nombre FROM veterinarios WHERE activo = TRUE ORDER BY nombre'
      );
      res.status(200).json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
