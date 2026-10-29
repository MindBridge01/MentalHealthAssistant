const test = require('node:test');
const assert = require('node:assert/strict');
const { databaseDiagnostic } = require('../services/databaseDiagnostic');
test('diagnostics distinguish TLS, authentication and schema failures without leaking details', () => {
  for (const code of ['SELF_SIGNED_CERT_IN_CHAIN', '28P01', '42P01']) {
    const result = databaseDiagnostic({ code, message: 'secret-password postgres://private-host' });
    assert.ok(result.startsWith(`[${code}]`));
    assert.ok(!result.includes('secret-password'));
    assert.ok(!result.includes('private-host'));
  }
});
test('uncoded termination is recognized and unknown messages are redacted', () => {
  assert.match(databaseDiagnostic(new Error('Connection terminated unexpectedly')), /CONNECTION_TERMINATED/);
  assert.match(databaseDiagnostic({ code:'SECRET_VALUE',message:'private data' }), /UNCLASSIFIED/);
  assert.ok(!databaseDiagnostic({ message:'private data' }).includes('private data'));
});
