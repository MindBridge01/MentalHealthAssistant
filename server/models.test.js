const { normalizeId } = require("./models/_shared");
const postModel = require("./models/postModel");
const userModel = require("./models/userModel");
const doctorModel = require("./models/doctorModel");
const profileModel = require("./models/profileModel");
const appointmentModel = require("./models/appointmentModel");
const communityModel = require("./models/communityModel");
const patientModel = require("./models/patientModel");
const messageModel = require("./models/messageModel");
const knowledgeModel = require("./models/knowledgeModel");
const auditLogService = require("./services/auditLogService");
const { errorHandler } = require("./middleware/errorHandler");
const db = require("./config/database");

jest.mock("./config/database");

describe("Comprehensive Logic Tests", () => {
  beforeAll(() => {
    db.withTransaction.mockImplementation(async (callback) => {
      return callback(db);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Model Unit Tests", () => {
    test("userModel findUserByEmail", async () => {
      db.query.mockResolvedValue({ rows: [{ id: "1", email: "a@b.com" }] });
      const user = await userModel.findUserByEmail("a@b.com");
      expect(user.email).toBe("a@b.com");
    });

    test("doctorModel upsertDoctorProfile", async () => {
      db.query.mockResolvedValue({ rows: [{ id: "d1", name: "Dr. New" }] });
      const result = await doctorModel.upsertDoctorProfile("u1", { name: "Dr. New" });
      expect(result.doctor.name).toBe("Dr. New");
    });

    test("patientModel createAssessmentSession", async () => {
      db.query.mockResolvedValue({ rows: [{ id: "a1" }] });
      const result = await patientModel.createAssessmentSession({ _id: "a1", userId: "u1" });
      expect(result._id).toBe("a1");
    });

    test("messageModel saveConversation", async () => {
      db.query.mockResolvedValue({ rows: [{id: 'conversation-1', user_id: 'u1', messages: []}] });
      const saved = await messageModel.saveConversation({ id: 'external-1', userId: "u1", messages: [] });
      expect(saved.userId).toBe('u1');
    });

    test("knowledgeModel searchKnowledgeChunks", async () => {
      db.query.mockResolvedValue({ rows: [{ content: "test knowledge" }] });
      const result = await knowledgeModel.searchKnowledgeChunks([0.1, 0.2]);
      expect(result.length).toBe(1);
      expect(db.query.mock.calls[0][1]).toEqual(['[0.1,0.2]', 5]);
    });

    test("auditLogService logAuditEvent", async () => {
      db.query.mockResolvedValue({ rows: [{ id: "log1" }] });
      await auditLogService.logAuditEvent({ action: "test", resourceType: "test" });
      expect(db.query).toHaveBeenCalled();
    });
  });

  describe("Middleware Unit Tests", () => {
    test("errorHandler should respond with error", () => {
      const err = new Error("Test Error");
      const req = { path: "/test", method: "GET" };
      const res = { 
        status: jest.fn().mockReturnThis(), 
        json: jest.fn() 
      };
      const next = jest.fn();
      
      errorHandler(err, req, res, next);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });
});
