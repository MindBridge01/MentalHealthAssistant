function getPhiEncryptionKey() {
  const secret = process.env.PHI_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error("PHI_ENCRYPTION_KEY is required");
  }

  if (/^[a-f0-9]{64}$/i.test(secret)) {
    return Buffer.from(secret, "hex");
  }

  const base64Bytes = Buffer.from(secret, "base64");
  if (base64Bytes.length === 32) {
    return base64Bytes;
  }

  throw new Error(
    "PHI_ENCRYPTION_KEY must be 32 bytes (base64) or 64 hex characters"
  );
}

module.exports = {
  getPhiEncryptionKey,
};
