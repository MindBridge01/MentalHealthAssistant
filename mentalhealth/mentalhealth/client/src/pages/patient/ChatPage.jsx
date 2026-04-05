import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ChatMessage from "../../components/patient/ChatMessage";
import PageHeader from "../../components/patient/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { quickActions } from "../../data/patientContent";
import { saveConversation, sendChatMessage, sendPublicChatMessage } from "../../services/chatService";

export default function ChatPage() {
  const { isAuthenticated } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi, I'm here to support you with reflection, grounding, and next-step guidance. I am not a medical professional, but I can help you think through what you're feeling and when to reach out for human support.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isCrisisState, setCrisisState] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (isAuthenticated && messages.length > 1) {
        saveConversation(messages).catch(() => {});
      }
    };
  }, [isAuthenticated, messages]);

  async function handleSend(event) {
    event.preventDefault();
    const nextMessage = draft.trim();
    if (!nextMessage || isSending) return;

    setDraft("");
    setError("");
    setCrisisState(false);

    const updatedMessages = [...messages, { role: "user", content: nextMessage }];
    setMessages(updatedMessages);
    setSending(true);

    try {
      const response = await (isAuthenticated
        ? sendChatMessage(nextMessage, updatedMessages)
        : sendPublicChatMessage(nextMessage, updatedMessages));
      setMessages((current) => [
        ...current,
        { role: "assistant", content: response.content },
      ]);
      setCrisisState(Boolean(response?.safety?.event === "crisis_detected"));
    } catch (sendError) {
      setError(sendError.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="AI chat"
        title="A quieter place to talk things through"
        description="MindBridge AI can help you reflect, ground yourself, and explore supportive next steps. It does not diagnose conditions or replace emergency help."
      />

      {!isAuthenticated ? (
        <div className="rounded-[24px] border border-white/70 bg-white/85 px-5 py-4 text-sm leading-7 text-[var(--color-text-muted)] shadow-soft">
          You can use AI chat without logging in. If you want appointments, onboarding, saved history, or the full patient dashboard, you can still{" "}
          <Link to="/login/patient" className="font-semibold text-[var(--color-primary)]">
            log in
          </Link>{" "}
          or{" "}
          <Link to="/signup/patient" className="font-semibold text-[var(--color-primary)]">
            sign up
          </Link>.
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <section className="flex min-h-[70vh] flex-col rounded-[36px] border border-white/70 bg-white/85 shadow-soft">
          <div className="border-b border-[var(--color-border)] px-6 py-5">
            <p className="text-sm font-semibold text-[var(--color-text)]">MindBridge AI support</p>
            <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">
              Safety note: this chat is supportive only. If you feel unsafe or at immediate risk, use SOS or call local emergency services.
            </p>
          </div>

          {isCrisisState ? (
            <div className="mx-6 mt-6 rounded-[24px] border border-[var(--color-danger-border)] bg-[var(--color-danger-soft)] p-5 text-sm leading-7 text-[var(--color-danger)]">
              A higher-risk message was detected. Please prioritize immediate human support. You can use the SOS action in the header or contact emergency services now.
            </div>
          ) : null}

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {messages.map((message, index) => (
              <ChatMessage key={`${message.role}-${index}`} role={message.role} content={message.content} />
            ))}
            {isSending ? (
              <div className="rounded-[28px] bg-[var(--color-surface)] px-5 py-4 text-sm text-[var(--color-text-muted)]">
                MindBridge AI is thinking...
              </div>
            ) : null}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSend} className="border-t border-[var(--color-border)] px-6 py-5">
            {error ? <p className="mb-4 rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</p> : null}
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                rows="3"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Type what is on your mind..."
                className="min-h-[84px] flex-1 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
              />
              <button type="submit" disabled={isSending} className="primary-button sm:self-end">
                {isSending ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-4">
          {quickActions.map((action) => (
            <Link
              key={action.href}
              to={action.href}
              className="block rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-soft"
            >
              <p className="font-display text-xl font-semibold text-[var(--color-text)]">{action.title}</p>
              <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{action.description}</p>
            </Link>
          ))}
        </aside>
      </div>
    </div>
  );
}
