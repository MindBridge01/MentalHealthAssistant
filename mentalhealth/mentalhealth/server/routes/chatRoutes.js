const express = require("express");
const router = express.Router();
const { authenticateJWT } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { disclaimerMiddleware } = require("../middleware/disclaimerMiddleware");
const { piiFilterMessage } = require("../middleware/piiFilterMiddleware");
const { crisisDetectionMiddleware } = require("../middleware/crisisDetectionMiddleware");
const { promptGuardrailMiddleware } = require("../middleware/promptGuardrail");
const { chatController, saveConversationController } = require("../controllers/chatController");

router.post(
  "/chat",
  authenticateJWT(),
  requirePermission("chat_ai"),
  disclaimerMiddleware,
  piiFilterMessage,
  crisisDetectionMiddleware,
  promptGuardrailMiddleware,
  chatController
);

router.post(
  "/public-chat",
  piiFilterMessage,
  crisisDetectionMiddleware,
  promptGuardrailMiddleware,
  disclaimerMiddleware,
  chatController
);

router.post("/save-conversation", authenticateJWT(), saveConversationController);

module.exports = router;
