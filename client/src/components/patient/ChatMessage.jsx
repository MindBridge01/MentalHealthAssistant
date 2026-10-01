export default function ChatMessage({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={[
          "max-w-[85%] rounded-[28px] px-5 py-4 text-sm leading-7 shadow-soft sm:max-w-[72%]",
          isUser
            ? "rounded-br-lg bg-[var(--color-primary)] text-white"
            : "rounded-bl-lg bg-white text-[var(--color-text)]",
        ].join(" ")}
      >
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] opacity-70">
          {isUser ? "You" : "MindBridge AI"}
        </p>
        <p className="whitespace-pre-wrap">{content}</p>
      </div>
    </div>
  );
}
