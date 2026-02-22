import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import programsRouter from './routes/programs';
import questionsRouter from './routes/questions';
import eligibilityRouter from './routes/eligibility';
import adminRouter from './routes/admin/index';
import { pool } from './db/pool';

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
}));
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/v1/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: 'error', message: 'Database unreachable' });
  }
});

// Public routes
app.use('/api/v1/programs', programsRouter);
app.use('/api/v1/questions', questionsRouter);
app.use('/api/v1/eligibility', eligibilityRouter);

// Admin routes (auth enforced inside)
app.use('/api/v1/admin', adminRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`FFX Home Repair API listening on port ${config.port} [${config.nodeEnv}]`);
});

export default app;
