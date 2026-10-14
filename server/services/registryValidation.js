const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function validateAssignment(body, now = new Date()) {
  if (typeof body?.providerUserId !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(body.providerUserId)) return 'Choose a valid provider.';
  if (!['demographics', 'clinical_context'].includes(body.accessScope)) return 'Choose a supported access scope.';
  const reasonError = validateReason(body.reason);
  if (reasonError) return reasonError;
  if (body.endsAt != null && (typeof body.endsAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(body.endsAt) ||
    !Number.isFinite(Date.parse(body.endsAt)) || new Date(body.endsAt) <= now)) return 'Expiry must be a future timestamp with a timezone.';
  return null;
}
function validateReason(value) {
  return typeof value !== 'string' || value.trim().length < 10 || value.trim().length > 1000
    ? 'Provide a reason between 10 and 1,000 characters.' : null;
}
function pagination(query) {
  const limit = query.limit === undefined ? 25 : Number(query.limit);
  const offset = query.offset === undefined ? 0 : Number(query.offset);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) return null;
  return { limit, offset };
}
module.exports = { UUID, validateAssignment, validateReason, pagination };
