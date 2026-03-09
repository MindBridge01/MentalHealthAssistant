function getPhiEncryptionKey() {
  const key = process.env.PHI_ENCRYPTION_KEY;
  if (!key) {
    throw new Error("PHI_ENCRYPTION_KEY is required");
  }
  return key;
}

module.exports = { getPhiEncryptionKey };
