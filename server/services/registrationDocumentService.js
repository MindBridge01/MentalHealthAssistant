const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const execFileAsync = promisify(execFile);

function documentType(buffer) {
  if (!Buffer.isBuffer(buffer) || !buffer.length || buffer.length > 5 * 1024 * 1024) return null;
  if (buffer.subarray(0, 5).toString() === '%PDF-') return 'application/pdf';
  if (buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255) return 'image/jpeg';
  return null;
}

async function scanDocument(buffer) {
  if (!process.env.REGISTRATION_CLAMSCAN_PATH) {
    throw Object.assign(new Error('Report uploads are temporarily unavailable. You can register without a report.'), { status: 503 });
  }
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'mindbridge-scan-'));
  const target = path.join(directory, 'document');
  try {
    await fs.writeFile(target, buffer, { mode: 0o600 });
    await execFileAsync(process.env.REGISTRATION_CLAMSCAN_PATH, ['--no-summary', '--', target], { timeout: 30000, windowsHide: true });
  } catch (error) {
    throw Object.assign(new Error(error.code === 1 ? 'This report failed the security scan.' : 'The report scanner is unavailable. Please try later.'), { status: error.code === 1 ? 422 : 503 });
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}
module.exports = { documentType, scanDocument };
