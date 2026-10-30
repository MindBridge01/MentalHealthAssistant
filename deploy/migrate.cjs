const {spawnSync} = require('node:child_process');
const {runtimeConfig} = require('./runtime-config.cjs');
const env = runtimeConfig({...process.env, SERVE_WEB: 'false'});
for (const script of ['migrate:postgres', 'migrate:chatbot']) {
  const result = spawnSync('npm', ['--prefix', 'server', 'run', script], {env, stdio: 'inherit'});
  if (result.status !== 0) process.exit(result.status || 1);
}
