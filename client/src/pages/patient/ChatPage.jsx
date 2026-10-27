import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { saveConversation, sendChatMessage, sendPublicChatMessage } from "../../services/chatService";
import "./ChatPage.css";

const introduction = "Hi, I'm here to support you with reflection, grounding, and next-step guidance. I am not a medical professional, but I can help you think through what you're feeling and when to reach out for human support.";
const initialMessages = () => [{ role: "assistant", content: introduction }];
const prompts = [
  { icon: "sun", title: "Reflect on my day", description: "Make a little room for what’s on your mind.", text: "I’d like to reflect on my day. Can you help me get started?" },
  { icon: "leaf", title: "Find a moment of calm", description: "Explore a gentle grounding exercise.", text: "Can you guide me through a simple grounding exercise?" },
  { icon: "compass", title: "Explore my next step", description: "Think through the support you need.", text: "I’m not sure what kind of support I need. Can we explore my options?" },
];

function Icon({ name, ...props }) {
  const paths = {
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></>,
    chat: <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0Z" />,
    home: <><path d="m3 10 9-7 9 7v11H3Z" /><path d="M9 21v-8h6v8" /></>,
    leaf: <><path d="M20 4C9 2 3 7 5 15c2 7 14 5 15-11Z" /><path d="M4 21 15 10" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
    arrow: <><path d="M12 20V4m-6 6 6-6 6 6" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></>,
    menu: <path d="M4 6h16M4 12h16M4 18h16" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10v.1" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 22v-2a8 8 0 0 1 16 0v2" /></>,
    external: <><path d="M8 4H4v16h16v-4M13 3h8v8m0-8L10 14" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name] || paths.chat}</svg>;
}

export default function ChatPage() {
  const { isAuthenticated, user } = useAuth();
  const { pathname } = useLocation();
  const standalone = pathname === "/ai-chat";
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isCrisisState, setCrisisState] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState("conversation-0");
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const nextId = useRef(0);
  const composerRef = useRef(null);
  const logRef = useRef(null);
  const drawerRef = useRef(null);
  const menuRef = useRef(null);
  const hasConversation = messages.some(message => message.role === "user");
  const firstName = user?.name?.trim().split(/\s+/)[0];

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, isSending]);
  useEffect(() => {
    if (!composerRef.current) return;
    composerRef.current.style.height = "auto";
    composerRef.current.style.height = `${Math.min(composerRef.current.scrollHeight, 180)}px`;
  }, [draft]);
  useEffect(() => {
    if (!hasConversation) return;
    const title = messages.find(message => message.role === "user").content;
    setSessions(current => {
      const session = { id: activeId, title, messages, crisis: isCrisisState };
      return current.some(item => item.id === activeId) ? current.map(item => item.id === activeId ? session : item) : [session, ...current];
    });
  }, [activeId, messages, hasConversation, isCrisisState]);
  // Retain the existing signed-in conversation-saving behavior.
  useEffect(() => () => {
    if (isAuthenticated && messages.length > 1) saveConversation(messages).catch(() => {});
  }, [isAuthenticated, messages]);

  const closeDrawer = () => { drawerRef.current?.close(); menuRef.current?.focus(); };
  const newChat = () => {
    if (isSending) return;
    setActiveId(`conversation-${++nextId.current}`);
    setMessages(initialMessages()); setDraft(""); setError(""); setCrisisState(false); setNotice("");
    drawerRef.current?.close(); composerRef.current?.focus();
  };
  const selectSession = session => {
    if (isSending) return;
    setActiveId(session.id); setMessages(session.messages); setCrisisState(session.crisis);
    setDraft(""); setError(""); setNotice(""); drawerRef.current?.close(); composerRef.current?.focus();
  };
  const usePrompt = prompt => { setDraft(prompt); composerRef.current?.focus(); };
  async function handleSend(event) {
    event.preventDefault();
    const nextMessage = draft.trim();
    if (!nextMessage || isSending) return;
    setDraft(""); setError(""); setCrisisState(false); setNotice("");
    const updatedMessages = [...messages, { role: "user", content: nextMessage }];
    setMessages(updatedMessages); setSending(true);
    try {
      const response = await (isAuthenticated ? sendChatMessage(nextMessage, updatedMessages) : sendPublicChatMessage(nextMessage, updatedMessages));
      setMessages(current => [...current, { role: "assistant", content: response.content }]);
      setCrisisState(Boolean(response?.safety?.event === "crisis_detected"));
    } catch (sendError) {
      setError(sendError.message || "We couldn’t send your message. Please try again.");
      setDraft(nextMessage);
    } finally { setSending(false); composerRef.current?.focus(); }
  }
  const exportChat = () => {
    if (!hasConversation) return;
    const text = `MindBridge AI conversation\n${new Date().toLocaleString()}\n\n${messages.map(message => `${message.role === "user" ? "You" : "MindBridge AI"}\n${message.content}`).join("\n\n")}\n\nAI-generated support. Not a diagnosis or emergency service.`;
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = "mindbridge-conversation.txt"; anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000); setNotice("Conversation exported to a text file.");
  };
  const sidebar = <>
    <Link className="mb-chat-brand" to="/" aria-label="MindBridge home"><span className="mb-chat-logo" aria-hidden="true" /><span>mindbridge<small>A LITTLE SPACE FOR YOU</small></span></Link>
    <button type="button" className="mb-chat-new" onClick={newChat} disabled={isSending}><Icon name="plus" />New conversation</button>
    <label className="mb-chat-search"><Icon name="search" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search conversations" aria-label="Search this session’s conversations" /></label>
    <nav className="mb-chat-nav" aria-label="Chat resources"><Link to="/"><Icon name="home" />Home</Link><Link to={isAuthenticated ? "/patient/activities" : "/#breathing"}><Icon name="leaf" />Self-guided activities</Link><Link to="/patient/doctors"><Icon name="compass" />Find a professional<Icon name="external" /></Link></nav>
    <div className="mb-chat-history"><p>CONVERSATIONS <span>This session</span></p><div>{sessions.filter(session => session.title.toLowerCase().includes(search.toLowerCase())).map(session => <button type="button" key={session.id} className={session.id === activeId ? "is-active" : ""} aria-current={session.id === activeId ? "true" : undefined} onClick={() => selectSession(session)} disabled={isSending}><Icon name="chat" /><span>{session.title}</span></button>)}{!sessions.length ? <p className="mb-chat-empty-history">Your conversations on this page will appear here.</p> : !sessions.some(session => session.title.toLowerCase().includes(search.toLowerCase())) ? <p className="mb-chat-empty-history">No conversations match your search.</p> : null}</div></div>
    <div className="mb-chat-sidebar-bottom"><p>Session list clears when you leave or reload this page.</p><Link to={isAuthenticated ? "/patient/dashboard" : "/login/patient"}><span className="mb-chat-avatar">{firstName?.[0]?.toUpperCase() || <Icon name="user" />}</span><span>{firstName || "Your support space"}<small>{isAuthenticated ? "Open your dashboard" : "Sign in to your account"}</small></span><Icon name="external" /></Link></div>
  </>;

  return <div className={`mb-chat ${standalone ? "mb-chat-standalone" : "mb-chat-embedded"}`}>
    {standalone && <aside className="mb-chat-sidebar" aria-label="Conversations and resources">{sidebar}</aside>}
    <dialog ref={drawerRef} className="mb-chat-drawer" aria-label="Conversations and resources" onClick={event => { if (event.target === event.currentTarget) closeDrawer(); }} onCancel={event => { event.preventDefault(); closeDrawer(); }}><button className="mb-chat-icon-button mb-chat-drawer-close" type="button" onClick={closeDrawer} aria-label="Close conversations"><Icon name="close" /></button>{sidebar}</dialog>
    <main className="mb-chat-main">
      <header className="mb-chat-header"><div>{standalone && <button ref={menuRef} className="mb-chat-icon-button mb-chat-mobile-menu" type="button" aria-label="Open conversations" onClick={() => drawerRef.current?.showModal()}><Icon name="menu" /></button>}<span className="mb-chat-header-symbol" aria-hidden="true">✳</span><div><strong>MindBridge AI</strong><span>Reflection & everyday support</span></div></div><div className="mb-chat-header-actions">{!standalone && <button type="button" className="mb-chat-export" onClick={newChat} disabled={isSending}><Icon name="plus" />New chat</button>}<button type="button" className="mb-chat-export" onClick={exportChat} disabled={!hasConversation || isSending}><Icon name="download" /><span>Export chat</span></button><details className="mb-chat-about"><summary aria-label="About MindBridge AI"><Icon name="info" /></summary><div><strong>Support, with clear limits.</strong><p>{introduction}</p><p>Messages are processed by MindBridge and its configured AI service. Avoid unnecessary identifying details.</p></div></details></div></header>
      <div className={`mb-chat-content ${hasConversation ? "has-conversation" : "is-welcome"}`}>
        {!hasConversation ? <div className="mb-chat-welcome"><div className="mb-chat-orb" aria-hidden="true"><span /></div><p>{firstName ? `Hello, ${firstName}.` : "A little space, just for you."}</p><h1>What’s on your mind?</h1><p className="mb-chat-welcome-description">Reflect, find your footing, or simply start a conversation.<br />We can take it one step at a time.</p></div> : <section ref={logRef} className="mb-chat-log" aria-label="Conversation" role="log" aria-live="polite" aria-relevant="additions" aria-busy={isSending}><div>{messages.map((message, index) => <article key={`${message.role}-${index}`} className={`mb-chat-message ${message.role === "user" ? "is-user" : "is-assistant"}`}><span className="mb-chat-message-avatar" aria-hidden="true">{message.role === "user" ? firstName?.[0]?.toUpperCase() || <Icon name="user" /> : "✳"}</span><div><p>{message.role === "user" ? "You" : "MindBridge AI"}</p><div>{message.content}</div></div></article>)}{isSending && <div className="mb-chat-thinking" role="status"><span /><span /><span /><p>MindBridge AI is thinking…</p></div>}{isCrisisState && <div className="mb-chat-crisis" role="alert">Please prioritize immediate human support. If there is immediate danger, contact local emergency services or go to the nearest emergency department. {isAuthenticated && <Link to="/patient/dashboard">Open your dashboard for guardian support.</Link>}</div>}</div></section>}
        <div className="mb-chat-compose-area">{error && <p className="mb-chat-error" role="alert">{error} Your message is back in the composer so you can retry.</p>}<form className="mb-chat-composer" onSubmit={handleSend}><label className="mb-chat-sr-only" htmlFor="mb-chat-draft">Your message to MindBridge AI</label><textarea ref={composerRef} id="mb-chat-draft" rows={2} value={draft} onChange={event => setDraft(event.target.value)} placeholder="Share what’s on your mind…" onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); event.currentTarget.form.requestSubmit(); } }} /><div className="mb-chat-composer-bottom"><span><span aria-hidden="true">✳</span> MindBridge AI <i /> Supportive reflection</span><button type="submit" disabled={isSending || !draft.trim()} aria-label={isSending ? "Sending message" : "Send message"}><Icon name="arrow" /></button></div></form><p className="mb-chat-disclaimer">AI support, not a clinician or emergency service. <span>Enter to send · Shift + Enter for a new line</span></p></div>
        {!hasConversation && <div className="mb-chat-prompts" aria-label="Conversation starters">{prompts.map(prompt => <button key={prompt.title} type="button" onClick={() => usePrompt(prompt.text)}><Icon name={prompt.icon} /><strong>{prompt.title}<span aria-hidden="true">↗</span></strong><span>{prompt.description}</span></button>)}</div>}
      </div>
      <footer className="mb-chat-footer"><span><i />{isAuthenticated ? "Signed-in conversation" : "Public AI chat"}</span><p>{isAuthenticated ? "Conversations use your existing account-saving settings." : <>Have an account? <Link to="/login/patient">Log in</Link> or <Link to="/signup/patient">sign up</Link>.</>}</p></footer>
      <p className="mb-chat-sr-only" role="status">{notice}</p>
    </main>
  </div>;
}
