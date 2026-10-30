const {spawn, spawnSync} = require('node:child_process');
const {runtimeConfig} = require('./runtime-config.cjs');
const env = runtimeConfig();
let updater;
if (env.ENABLE_CLAMAV === 'true') {
  // A failed signature update must never silently enable unscanned uploads.
  const updated = spawnSync('freshclam', ['--user=node', '--datadir=/var/lib/clamav', '--quiet'], {stdio: 'inherit', env});
  if (updated.status !== 0) { console.error('Antivirus signatures could not be updated.'); process.exit(1); }
  env.REGISTRATION_CLAMSCAN_PATH = env.CHATBOT_CLAMSCAN_PATH = '/usr/bin/clamscan';
  updater = spawn('freshclam', ['--user=node', '--datadir=/var/lib/clamav', '--daemon', '--foreground', '--checks=12'], {stdio: 'inherit', env});
}
const [command, ...args] = process.argv.slice(2);
if (!command) throw Error('A service command is required.');
const child = spawn(command, args, {stdio: 'inherit', env});
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => { child.kill(signal); updater?.kill(signal); });
child.once('error', () => { console.error('Service could not be started.'); updater?.kill(); process.exitCode = 1; });
child.once('exit', (code, signal) => { updater?.kill(); process.exitCode = signal ? 1 : code ?? 1; });
