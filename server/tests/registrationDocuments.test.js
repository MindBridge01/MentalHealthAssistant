const test = require('node:test');
const assert = require('node:assert/strict');
const { documentType, scanDocument } = require('../services/registrationDocumentService');
test('upload validation checks bytes, empty input and size, not supplied MIME', () => {
  assert.equal(documentType(Buffer.from('%PDF-1.4 test')), 'application/pdf');
  assert.equal(documentType(Buffer.from([137,80,78,71,13,10,26,10])), 'image/png');
  assert.equal(documentType(Buffer.from([255,216,255,0])), 'image/jpeg');
  assert.equal(documentType(Buffer.from('<script>bad</script>')), null);
  assert.equal(documentType(Buffer.alloc(0)), null);
  assert.equal(documentType(Buffer.alloc(5242881)), null);
  assert.equal(documentType(undefined), null);
});
test('scanner fails closed when not configured', async () => {
  const previous = process.env.REGISTRATION_CLAMSCAN_PATH;
  delete process.env.REGISTRATION_CLAMSCAN_PATH;
  try { await assert.rejects(scanDocument(Buffer.from('%PDF-1.4 test')), { status: 503 }); }
  finally { if (previous !== undefined) process.env.REGISTRATION_CLAMSCAN_PATH = previous; }
});
