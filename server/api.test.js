const request = require("supertest");
const postModel = require("./models/postModel");
const userModel = require("./models/userModel");
const profileModel = require("./models/profileModel");
const patientModel = require("./models/patientModel");
const communityModel = require("./models/communityModel");
const doctorModel = require("./models/doctorModel");
const appointmentModel = require("./models/appointmentModel");
const messageModel = require("./models/messageModel");
const auditLogService = require("./services/auditLogService");
const chatPipelineService = require("./services/chatPipelineService");
const bcrypt = require("bcrypt");
const axios = require("axios");

// --- Global Mocks ---
jest.mock("./models/postModel");
jest.mock("./models/userModel");
jest.mock("./models/profileModel");
jest.mock("./models/patientModel");
jest.mock("./models/communityModel");
jest.mock("./models/doctorModel");
jest.mock("./models/appointmentModel");
jest.mock("./models/messageModel");
jest.mock("./services/auditLogService");
jest.mock("./services/chatPipelineService");
jest.mock("bcrypt");
jest.mock("axios");
jest.mock('google-auth-library');

process.env.JWT_SECRET = "test_jwt_secret_must_be_at_least_32_chars_long";
process.env.PHI_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
process.env.OLLAMA_BASE_URL = "http://localhost:11434";

jest.mock("./middleware/authMiddleware", () => ({
  authenticateJWT: () => (req, res, next) => {
    req.user = { _id: "user123", email: "test@example.com", role: "doctor" };
    next();
  },
  authorizeRoles: () => (req, res, next) => next(),
}));

jest.mock("./middleware/permissionMiddleware", () => ({
  requirePermission: () => (req, res, next) => next(),
  normalizeRole: (r) => r,
}));

jest.mock("./middleware/crisisDetectionMiddleware", () => ({ crisisDetectionMiddleware: (req, res, next) => next() }));
jest.mock("./middleware/promptGuardrail", () => ({ promptGuardrailMiddleware: (req, res, next) => next() }));
jest.mock("./middleware/piiFilterMiddleware", () => ({ piiFilterMessage: (req, res, next) => next() }));
jest.mock("./middleware/disclaimerMiddleware", () => ({ disclaimerMiddleware: (req, res, next) => next() }));

const app = require("./server");

describe("API Coverage Suite", () => {
  afterEach(() => { jest.clearAllMocks(); });

  test("Health Check", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
  });

  describe("Admin APIs", () => {
    test("GET /api/admin/pending-doctors", async () => {
      userModel.listPendingDoctors.mockResolvedValue([]);
      const res = await request(app).get("/api/admin/pending-doctors");
      expect(res.statusCode).toBe(200);
    });

    test("POST /api/admin/approve-doctor", async () => {
      userModel.approveDoctor.mockResolvedValue({ success: true });
      const res = await request(app).post("/api/admin/approve-doctor").send({ doctorId: "d1" });
      expect(res.statusCode).toBe(200);
    });
  });

  describe("Auth APIs", () => {
    test("POST /api/auth/signup - Success", async () => {
      userModel.findUserByEmail.mockResolvedValue(null);
      userModel.createUser.mockResolvedValue({ _id: "u1", role: "patient" });
      bcrypt.hash.mockResolvedValue("hp");
      const res = await request(app).post("/api/auth/signup").send({ email: "a@b.com", name: "A", password: "p" });
      expect(res.statusCode).toBe(201);
    });

    test("POST /api/auth/login - Success", async () => {
      userModel.findUserByEmail.mockResolvedValue({ _id: "u1", password: "hp", role: "patient" });
      bcrypt.compare.mockResolvedValue(true);
      const res = await request(app).post("/api/auth/login").send({ email: "a@b.com", password: "p" });
      expect(res.statusCode).toBe(200);
    });

    test("POST /api/auth/logout", async () => {
      const res = await request(app).post("/api/auth/logout");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("Doctor APIs", () => {
    test("GET /api/doctor/profile/:userId", async () => {
      doctorModel.getDoctorByUserId.mockResolvedValue({ name: "Dr" });
      const res = await request(app).get("/api/doctor/profile/user123");
      expect(res.statusCode).toBe(200);
    });

    test("GET /api/doctor/messages/:userId", async () => {
      doctorModel.getDoctorByUserId.mockResolvedValue({ name: "Dr" });
      doctorModel.findDoctorMessages.mockResolvedValue([]);
      const res = await request(app).get("/api/doctor/messages/user123");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("Patient APIs", () => {
    test("PUT /api/patient/onboarding - Success", async () => {
      profileModel.upsertProfile.mockResolvedValue({ onboardingCompleted: true });
      const res = await request(app).put("/api/patient/onboarding").send({ 
        name: "T", age: 25, gender: "M", consentAccepted: true 
      });
      expect(res.statusCode).toBe(200);
    });

    test("POST /api/patient/community/posts/:postId/like", async () => {
      communityModel.togglePostEngagement.mockResolvedValue({ active: true });
      communityModel.findCommunityPostById.mockResolvedValue({ _id: "p1" });
      const res = await request(app).post("/api/patient/community/posts/p1/like");
      expect(res.statusCode).toBe(200);
    });
  });

  describe("Chat APIs", () => {
    test("POST /api/chat", async () => {
      chatPipelineService.runChatPipeline.mockResolvedValue({ 
        responseText: "H",
        moderation: { moderated: false, content: "H" }, 
        knowledgeMatches: [],
        sanitizedHistory: [],
        blocked: false
      });
      const res = await request(app).post("/api/chat").send({ message: "Hi" });
      expect(res.statusCode).toBe(200);
    });
  });
});