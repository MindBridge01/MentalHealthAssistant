// Automatic administrator creation is intentionally disabled.
async function createDefaultAdmin() {
  throw new Error('Use the explicit first-administrator setup command. Automatic admin creation is disabled.');
}
module.exports = { createDefaultAdmin };
