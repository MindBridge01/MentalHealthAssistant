process.env.PHI_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

const { encryptClassifiedFields, decryptClassifiedFields } = require("./services/encryptionService");
const auditLogService = require("./services/auditLogService");
const db = require("./config/database");

jest.mock("./config/database");

describe("Service Unit Tests", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("encryptionService", () => {
    test("should encrypt and decrypt classified fields", () => {
      const sensitiveData = {
        patientEmail: "patient@example.com",
        notes: "Sensitive clinical notes",
        other: "non-sensitive"
      };

      const encrypted = encryptClassifiedFields(sensitiveData);
      expect(encrypted.patientEmail).not.toBe(sensitiveData.patientEmail);
      expect(encrypted.other).toBe(sensitiveData.other);

      const decrypted = decryptClassifiedFields(encrypted);
      expect(decrypted.patientEmail).toBe(sensitiveData.patientEmail);
      expect(decrypted.notes).toBe(sensitiveData.notes);
    });

    test("should handle null or non-object inputs gracefully", () => {
        // The service returns {} for null inputs
        expect(encryptClassifiedFields(null)).toEqual({});
        expect(decryptClassifiedFields(null)).toEqual({});
    });
  });

  describe("auditLogService", () => {
    test("listAuditLogs should return mapped rows from database", async () => {
      const mockRows = [{ id: 1, action: "test_action" }];
      db.query.mockResolvedValue({ rows: mockRows });

      const logs = await auditLogService.listAuditLogs();
      expect(logs[0].action).toBe("test_action");
      expect(db.query).toHaveBeenCalled();
    });

    test("logAuditEvent should insert into database", async () => {
        db.query.mockResolvedValue({ rows: [{ id: 100 }] });
        
        await auditLogService.logAuditEvent({
            action: "user_login",
            resourceType: "auth",
            resourceId: "u123",
            metadata: { ip: "127.0.0.1" }
        });

        expect(db.query).toHaveBeenCalled();
    });

    test("logAuditEvent should throw error if action or resourceType is missing", async () => {
        await expect(auditLogService.logAuditEvent({ action: "test" }))
            .rejects.toThrow();
    });
  });
});
