import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env';

let memoryServer: MongoMemoryServer | null = null;
let connectionPromise: Promise<typeof mongoose> | null = null;
let dbMode: 'atlas' | 'local-mongodb' = 'atlas';

export function getDatabaseMode(): 'atlas' | 'local-mongodb' {
  return dbMode;
}

export async function connectDatabase(customUri?: string): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    return mongoose;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    const uri = customUri || env.mongodbUri;

    if (uri) {
      dbMode = 'atlas';
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
      });
      return mongoose;
    }

    // Development / sandbox fallback: run a real embedded MongoDB server
    // backed by wiredTiger on disk so Mongoose schemas, indexes, aggregations,
    // and data persistence work identically to MongoDB Atlas.
    dbMode = 'local-mongodb';
    const isTest = env.isTest || process.env.NODE_TEST_CONTEXT !== undefined;

    if (isTest) {
      memoryServer = await MongoMemoryServer.create();
    } else {
      const dbPath = path.resolve(process.cwd(), '.data', 'mongodb');
      fs.mkdirSync(dbPath, { recursive: true });
      // Remove stale lock file if a prior dev process was terminated abruptly
      const lockFile = path.join(dbPath, 'mongod.lock');
      if (fs.existsSync(lockFile)) {
        try {
          fs.unlinkSync(lockFile);
        } catch {
          // Ignore if actively held
        }
      }
      memoryServer = await MongoMemoryServer.create({
        instance: {
          dbName: 'celltrack_crm',
          dbPath,
          storageEngine: 'wiredTiger',
        },
      });
    }

    const localUri = memoryServer.getUri('celltrack_crm');
    await mongoose.connect(localUri);
    return mongoose;
  })();

  try {
    return await connectionPromise;
  } catch (err) {
    connectionPromise = null;
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  connectionPromise = null;
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
