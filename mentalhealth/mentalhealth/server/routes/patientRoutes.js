const express = require("express");
const { authenticateJWT, authorizeRoles } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { createObjectId } = require("../lib/objectId");
const { upsertProfile, findProfileByUserId } = require("../models/profileModel");
const { updateUser, findUserById } = require("../models/userModel");
const { listAllDoctors } = require("../models/doctorModel");
const { findAppointmentsByPatientId } = require("../models/appointmentModel");
const {
  createAssessmentSession,
  findLatestAssessmentByUserId,
  findAssessmentById,
} = require("../models/patientModel");
const {
  listCommunityPosts,
  findCommunityPostById,
  createCommunityPost,
  togglePostEngagement,
  addPostComment,
} = require("../models/communityModel");

const router = express.Router();

router.use(authenticateJWT());
router.use(authorizeRoles("patient", "pending-doctor"));

const ACTIVITIES = [
  {
    id: "breathing-reset",
    title: "Breathing Reset",
    category: "Breathing",
    durationMinutes: 4,
    intensity: "Gentle",
    description: "A guided 4-4-6 rhythm to help settle racing thoughts and bring your body back to the present.",
    steps: [
      "Sit comfortably and relax your shoulders.",
      "Breathe in through your nose for 4 seconds.",
      "Pause softly for 4 seconds.",
      "Exhale slowly for 6 seconds and repeat."
    ]
  },
  {
    id: "grounding-5-4-3-2-1",
    title: "5-4-3-2-1 Grounding",
    category: "Grounding",
    durationMinutes: 6,
    intensity: "Gentle",
    description: "Notice your surroundings step by step to reduce overwhelm and reconnect with the room around you.",
    steps: [
      "Name 5 things you can see.",
      "Notice 4 things you can feel.",
      "Listen for 3 things you can hear.",
      "Identify 2 things you can smell.",
      "Name 1 thing you can taste or appreciate."
    ]
  },
  {
    id: "evening-unwind",
    title: "Evening Unwind",
    category: "Reflection",
    durationMinutes: 8,
    intensity: "Moderate",
    description: "A short reflective practice to help release pressure from the day and prepare for rest.",
    steps: [
      "Write down one thing that felt heavy today.",
      "Write one thing you handled better than you expected.",
      "Choose one small act of care for tonight."
    ]
  }
];

function buildAssessmentOutcome(score) {
  if (score <= 4) {
    return {
      classification: "low",
      recommendation: "Your responses suggest mild current distress. Gentle activities and regular check-ins may be enough right now.",
      nextStep: "activities",
    };
  }

  if (score <= 8) {
    return {
      classification: "medium",
      recommendation: "Your responses suggest you may benefit from extra support. A guided conversation with MindBridge AI could help you reflect safely.",
      nextStep: "chat",
    };
  }

  return {
    classification: "high",
    recommendation: "Your responses suggest you may need more direct human support. Please consider booking time with a qualified doctor or counselor.",
    nextStep: "doctor",
  };
}

router.get("/dashboard", requirePermission("view_own_profile"), async (req, res) => {
  try {
    const [profile, latestAssessment, appointments, posts, doctors] = await Promise.all([
      findProfileByUserId(req.user._id),
      findLatestAssessmentByUserId(req.user._id),
      findAppointmentsByPatientId(req.user._id),
      listCommunityPosts(req.user._id),
      listAllDoctors(),
    ]);

    const upcomingAppointments = appointments
      .slice(0, 3)
      .map((appointment) => ({
        ...appointment,
        doctorName: doctors.find((doctor) => doctor.userId === appointment.doctorId)?.name || "MindBridge Doctor",
      }));

    return res.json({
      onboardingCompleted: Boolean(profile?.onboardingCompleted),
      latestAssessment,
      communityHighlights: posts.slice(0, 3),
      upcomingAppointments,
      doctorCount: doctors.length,
      activityCount: ACTIVITIES.length,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to load patient dashboard" });
  }
});

router.get("/onboarding", requirePermission("view_own_profile"), async (req, res) => {
  try {
    const [user, profile] = await Promise.all([
      findUserById(req.user._id),
      findProfileByUserId(req.user._id),
    ]);

    return res.json({
      name: user?.name || "",
      email: user?.email || "",
      age: profile?.age || "",
      gender: profile?.gender || "",
      mentalHealthContext: profile?.mentalHealthContext || "",
      guardianName: profile?.guardianName || "",
      guardianPhone: profile?.guardianPhone || "",
      guardianEmail: profile?.guardianEmail || "",
      consentAccepted: Boolean(profile?.consentAccepted),
      onboardingCompleted: Boolean(profile?.onboardingCompleted),
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load onboarding details" });
  }
});

router.put("/onboarding", requirePermission("edit_own_profile"), async (req, res) => {
  const {
    name,
    age,
    gender,
    mentalHealthContext,
    guardianName,
    guardianPhone,
    guardianEmail,
    consentAccepted,
  } = req.body || {};

  if (!name || !age || !gender || !consentAccepted) {
    return res.status(400).json({ error: "Please complete the required onboarding details." });
  }

  try {
    await updateUser(req.user._id, {
      name,
      updatedAt: new Date(),
    });

    const profile = await upsertProfile(req.user._id, {
      age,
      gender,
      guardianName,
      guardianPhone,
      guardianEmail,
      mentalHealthContext,
      consentAccepted: true,
      consentAcceptedAt: new Date(),
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    });

    return res.json({
      success: true,
      onboardingCompleted: Boolean(profile?.onboardingCompleted),
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to save onboarding details" });
  }
});

router.get("/activities", requirePermission("view_own_profile"), (_req, res) => {
  res.json({ activities: ACTIVITIES });
});

router.post("/assessments", requirePermission("view_own_profile"), async (req, res) => {
  const { responses } = req.body || {};

  if (!Array.isArray(responses) || responses.length === 0) {
    return res.status(400).json({ error: "Assessment responses are required." });
  }

  const score = responses.reduce((total, item) => total + Number(item.score || 0), 0);
  const outcome = buildAssessmentOutcome(score);

  try {
    const assessment = await createAssessmentSession({
      _id: createObjectId(),
      userId: req.user._id,
      responses,
      score,
      classification: outcome.classification,
      recommendation: outcome.recommendation,
      createdAt: new Date(),
    });

    return res.status(201).json({
      assessment: {
        ...assessment,
        nextStep: outcome.nextStep,
      },
    });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to submit assessment" });
  }
});

router.get("/assessments/latest", requirePermission("view_own_profile"), async (req, res) => {
  try {
    const assessment = await findLatestAssessmentByUserId(req.user._id);
    return res.json({ assessment });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load latest assessment" });
  }
});

router.get("/assessments/:assessmentId", requirePermission("view_own_profile"), async (req, res) => {
  try {
    const assessment = await findAssessmentById(req.params.assessmentId, req.user._id);
    if (!assessment) return res.status(404).json({ error: "Assessment not found" });
    return res.json({ assessment });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load assessment" });
  }
});

router.get("/community/posts", requirePermission("view_own_profile"), async (req, res) => {
  try {
    const posts = await listCommunityPosts(req.user._id);
    return res.json({ posts });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load community posts" });
  }
});

router.get("/community/posts/:postId", requirePermission("view_own_profile"), async (req, res) => {
  try {
    const post = await findCommunityPostById(req.params.postId, req.user._id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json({ post });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to load post" });
  }
});

router.post("/community/posts", requirePermission("view_own_profile"), async (req, res) => {
  const { caption, location, image } = req.body || {};

  if (!caption || caption.trim().length < 3) {
    return res.status(400).json({ error: "Please write a little more before posting." });
  }

  try {
    const user = await findUserById(req.user._id);
    const post = await createCommunityPost({
      _id: createObjectId(),
      caption: caption.trim(),
      location: location?.trim() || "",
      image: image?.trim() || "",
      name: user?.name || "MindBridge member",
      createdAt: new Date(),
    });

    return res.status(201).json({ post });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to create post" });
  }
});

router.post("/community/posts/:postId/comments", requirePermission("view_own_profile"), async (req, res) => {
  const { content } = req.body || {};
  if (!content || content.trim().length < 2) {
    return res.status(400).json({ error: "Comment is too short." });
  }

  try {
    const user = await findUserById(req.user._id);
    const comment = await addPostComment({
      _id: createObjectId(),
      postId: req.params.postId,
      userId: req.user._id,
      authorName: user?.name || "MindBridge member",
      content: content.trim(),
      createdAt: new Date(),
    });

    return res.status(201).json({ comment });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to add comment" });
  }
});

async function handlePostReaction(req, res, reactionType) {
  try {
    const result = await togglePostEngagement({
      postId: req.params.postId,
      userId: req.user._id,
      reactionType,
    });
    const post = await findCommunityPostById(req.params.postId, req.user._id);
    return res.json({ active: result.active, post });
  } catch (_error) {
    return res.status(500).json({ error: "Failed to update post" });
  }
}

router.post("/community/posts/:postId/like", requirePermission("view_own_profile"), async (req, res) => {
  return handlePostReaction(req, res, "like");
});

router.post("/community/posts/:postId/save", requirePermission("view_own_profile"), async (req, res) => {
  return handlePostReaction(req, res, "save");
});

module.exports = router;
