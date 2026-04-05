import { ensurePostgres } from "./lib/postgres";
import { requireAuth } from "./lib/requireAuth";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { runChatPipeline } = require("../server/services/chatPipelineService");
const { appendMedicalDisclaimer } = require("../server/services/safeResponseService");

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ content: "Method not allowed" });
  }

  const user = requireAuth(req);
  if (!user) {
    return res.status(401).json({ content: "Authentication required" });
  }

  try {
    await ensurePostgres();
    const bodyMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const explicitMessage = typeof req.body?.message === "string" ? req.body.message : "";
    const fallbackMessage = bodyMessages[bodyMessages.length - 1]?.content || "";

    const pipelineResult = await runChatPipeline({
      message: explicitMessage || fallbackMessage,
      rawMessages: bodyMessages,
    });

    return res.status(200).json({
      content: appendMedicalDisclaimer(
        pipelineResult.blocked
          ? pipelineResult.responseText
          : pipelineResult.moderation.content
      ),
      sources: pipelineResult.knowledgeMatches.map((item) => ({
        title: item.title,
        documentKey: item.document_key,
        similarity: item.similarity,
      })),
      ...(pipelineResult.safety ? { safety: pipelineResult.safety } : {}),
    });
  } catch {
    console.error("[api/chat] request failed");
    res.status(500).json({ content: "Sorry, something went wrong on our end!" });
  }
}
