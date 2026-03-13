import 'dotenv/config';
// Firebase must be initialized before any route/controller imports
import './infrastructure/firebase/firebase.config';

import express from 'express';
import cors from 'cors';
import taskRoutes from './presentation/routes/task.routes';
import authRoutes from './presentation/routes/auth.routes';

const app = express();
const PORT = process.env['PORT'] ?? 3000;
const CORS_ORIGIN = process.env['CORS_ORIGIN'] ?? 'http://localhost:4200';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json());

app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
