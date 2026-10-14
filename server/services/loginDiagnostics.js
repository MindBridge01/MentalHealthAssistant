function loginFailure(error) {
  const failures = {
    '42P01': [503, 'Login database tables are missing. Run the backend migrations.', 'login_schema_missing'],
    '42703': [503, 'Login database schema is outdated. Run the backend migrations.', 'login_schema_outdated'],
    '28P01': [503, 'The backend cannot authenticate with the database. Check its database configuration.', 'login_database_auth_failed'],
    '42501': [503, 'The backend database account lacks required access.', 'login_database_access_denied'],
    ECONNREFUSED: [503, 'The login database is unavailable. Please try again shortly.', 'login_database_unreachable'],
    ETIMEDOUT: [503, 'The login database connection timed out. Please try again.', 'login_database_timeout'],
    ENOTFOUND: [503, 'The login database hostname could not be resolved.', 'login_database_dns_failed'],
  };
  const [status,message,diagnostic]=failures[error?.code] || [500,'Login failed on the server. Check the backend terminal for the safe diagnostic code.','unexpected_login_failure'];
  return {status,message,diagnostic};
}
module.exports={loginFailure};
