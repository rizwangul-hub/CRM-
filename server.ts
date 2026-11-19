import path from 'path';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { createApp } from './backend/app';
import { connectDatabase, disconnectDatabase, getDatabaseMode } from './backend/config/db';
import { env } from './backend/config/env';
import { seedDatabaseIfEmpty } from './backend/utils/seed';

async function startServer() {
  await connectDatabase();
  const seeded = await seedDatabaseIfEmpty();
  if (seeded) {
    console.log('[CellTrack] Seeded initial shop dataset and user accounts.');
  }

  const app = createApp();

  if (!env.isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(env.port, '0.0.0.0', () => {
    console.log(
      `[CellTrack] Server listening on http://0.0.0.0:${env.port} (DB: ${getDatabaseMode()})`,
    );
  });

  const shutdown = async () => {
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

startServer().catch((err) => {
  console.error('[CellTrack] Fatal startup error:', err);
  process.exit(1);
});
