const crypto = require("crypto");
const { shouldEncryptField } = require("../security/dataClassification");
const { getPhiEncryptionKey } = require("../security/encryptionKeys");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

const KEY = getPhiEncryptionKey();

function isEncryptedValue(value) {
  return (
    value &&
    typeof value === "object" &&
    value.__enc === true &&
    typeof value.alg === "string" &&
    typeof value.iv === "string" &&
    typeof value.tag === "string" &&
    typeof value.value === "string"
  );
}

function toPlaintext(value) {
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function fromPlaintext(text) {
  try {
    return JSON.parse(text);
  } catch (_err) {
    return text;
  }
}

function encryptValue(rawValue) {
  if (rawValue === null || rawValue === undefined) return rawValue;
  if (isEncryptedValue(rawValue)) return rawValue;

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const plaintext = toPlaintext(rawValue);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return {
    __enc: true,
    alg: ALGORITHM,
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    value: encrypted.toString("base64"),
  };
}

function decryptValue(encryptedValue) {
  if (!isEncryptedValue(encryptedValue)) return encryptedValue;

  if (encryptedValue.alg !== ALGORITHM) {
    throw new Error("Unsupported encryption algorithm");
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(encryptedValue.iv, "base64"),
    { authTagLength: AUTH_TAG_LENGTH }
  );
  decipher.setAuthTag(Buffer.from(encryptedValue.tag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue.value, "base64")),
    decipher.final(),
  ]);

  return fromPlaintext(decrypted.toString("utf8"));
}

function encryptClassifiedFields(document = {}) {
  const encryptedDocument = { ...document };
  Object.keys(encryptedDocument).forEach((fieldName) => {
    if (!shouldEncryptField(fieldName)) return;
    encryptedDocument[fieldName] = encryptValue(encryptedDocument[fieldName]);
  });
  return encryptedDocument;
}

function decryptClassifiedFields(document = {}) {
  const decryptedDocument = { ...document };
  Object.keys(decryptedDocument).forEach((fieldName) => {
    if (!shouldEncryptField(fieldName)) return;
    decryptedDocument[fieldName] = decryptValue(decryptedDocument[fieldName]);
  });
  return decryptedDocument;
}

module.exports = {
  encryptValue,
  decryptValue,
  isEncryptedValue,
  encryptClassifiedFields,
  decryptClassifiedFields,
};
