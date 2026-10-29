// Never include raw database errors: they may contain connection credentials or row data.
const explanations = {
  SELF_SIGNED_CERT_IN_CHAIN: 'The server certificate chain is not trusted. Configure POSTGRES_CA_CERT with the provider CA certificate; keep certificate verification enabled.',
  DEPTH_ZERO_SELF_SIGNED_CERT: 'The server certificate is self-signed. Configure the trusted provider CA certificate; keep certificate verification enabled.',
  UNABLE_TO_VERIFY_LEAF_SIGNATURE: 'The certificate issuer could not be verified. Configure POSTGRES_CA_CERT with the provider CA certificate.',
  UNABLE_TO_GET_ISSUER_CERT_LOCALLY: 'The certificate issuer is not trusted locally. Configure the provider CA certificate.',
  CERT_HAS_EXPIRED: 'A TLS certificate has expired. Check the computer clock and database provider certificate.',
  ERR_TLS_CERT_ALTNAME_INVALID: 'The certificate does not match the database hostname. Verify the host against the provider connection string.',
  ENOTFOUND: 'The database hostname could not be resolved. Check the provider connection hostname and project status.',
  EAI_AGAIN: 'DNS lookup temporarily failed. Check network connectivity and retry.',
  ECONNREFUSED: 'The database endpoint refused the connection. Check host, port and project status.',
  ECONNRESET: 'The connection was reset. Check network access, project status and TLS settings.',
  ETIMEDOUT: 'The connection timed out. Check network access, project status and host/port.',
  EACCES: 'The operating system blocked network access. Check local network permissions.',
  '28P01': 'Database authentication failed. Check the database password and pooler username, not the administrator login password.',
  '28000': 'The database rejected authentication or connection authorization. Check the provider connection settings and TLS requirements.',
  '3D000': 'The configured database does not exist. Verify the database name.',
  '42P01': 'A required table is missing or not visible. Verify the target database and run the project migrations.',
  '42703': 'A required database column is missing. Verify the target database and run the project migrations.',
  '42501': 'The database account lacks permission for this operation.',
  '53300': 'The database connection limit has been reached. Close unused development processes and check provider limits.',
  '57P03': 'The database is not accepting connections yet. Wait for startup or restoration to finish.',
  '23505': 'A unique database value already exists. Check whether the administrator or account was already created.',
};
function databaseDiagnostic(error) {
  const code = error?.code || error?.cause?.code;
  if (Object.hasOwn(explanations, code)) return `[${code}] ${explanations[code]}`;
  if (/connection terminated unexpectedly/i.test(error?.message || '')) return '[CONNECTION_TERMINATED] The connection closed before the operation completed. Check database status, network connectivity and TLS configuration.';
  return '[UNCLASSIFIED] Database operation failed. Inspect provider logs privately; do not share connection strings or credentials.';
}
module.exports = { databaseDiagnostic };
