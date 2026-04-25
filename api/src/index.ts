import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { rateLimit } from 'express-rate-limit';

import { authMiddleware } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

import authRouter from './routes/auth.js';
import veterinariosRouter from './routes/veterinarios.js';
import mascotasRouter from './routes/mascotas.js';
import vacunacionRouter from './routes/vacunacion.js';
import vacunasRouter from './routes/vacunas.js';
import citasRouter from './routes/citas.js';

const app = express();

const allowedOrigins = (process.env['ALLOWED_ORIGINS'] ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));

app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' },
});

app.get('/health', (_req, res) => { res.json({ ok: true }); });

app.use('/auth', loginLimiter, authRouter);
app.use('/veterinarios', veterinariosRouter);

app.use('/mascotas', authMiddleware, mascotasRouter);
app.use('/vacunacion', authMiddleware, vacunacionRouter);
app.use('/vacunas', authMiddleware, vacunasRouter);
app.use('/citas', authMiddleware, citasRouter);

app.use(errorHandler);

const PORT = process.env['PORT'] ? Number(process.env['PORT']) : 3001;

app.listen(PORT, () => {
  console.log(`[SERVER] Clinica Vet API running on port ${PORT}`);
});
