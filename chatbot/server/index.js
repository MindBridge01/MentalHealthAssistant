import './environment.js';
import {databaseOptions} from './databaseOptions.js';
import pg from 'pg';
import { config as readConfig } from './config.js';
import { MemoryStore, PostgresStore } from './store.js';
import { ChatbotModels } from './models.js';
import { Pipeline } from './pipeline.js';
import { createApp } from './app.js';
const config = readConfig();
const store = config.demo ? new MemoryStore() : new PostgresStore(new pg.Pool({
  ...databaseOptions(config),
  max: 8,
  connectionTimeoutMillis: 5000
}), config.dataKey);
const app = createApp({
  config,
  store,
  pipeline: new Pipeline({
    models: new ChatbotModels(config),
    demo: config.demo
  })
});
const server = app.listen(config.port, config.demo ? '127.0.0.1' : config.host, () => console.log(`MindBridge chatbot ${config.demo ? 'PREVIEW' : 'connected'} listening on port ${config.port}. No message bodies are logged.`));
async function shutdown() {
  server.close();
  await store.close();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
