import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
async function api(path, options = {}) {
  const multipart = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: multipart ? {} : {
      'Content-Type': 'application/json'
    },
    body: options.body ? multipart ? options.body : JSON.stringify(options.body) : undefined
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw Error('The service is unavailable. Please try again.');
  }
  if (!response.ok) throw Error(data.error || 'The request could not be completed.');
  return data;
}
function Icon({
  name,
  ...props
}) {
  const paths = {
    leaf: <><path d="M19 4c-8-2-14 2-14 8a7 7 0 0 0 7 7c6 0 8-7 7-15Z" /><path d="m5 21 10-12" /></>,
    chat: <><path d="M21 11a9 9 0 0 1-9 9H4l-2 2V11a9 9 0 0 1 19 0Z" /><path d="M7 9h10M7 13h7" /></>,
    book: <><path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Z" /><path d="M12 5v15" /></>,
    shield: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z" /><path d="m8 12 3 3 5-6" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <><path d="M12 19V5m-6 6 6-6 6 6" /></>,
    trash: <><path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7" /></>
  };
  return <svg {...props} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.leaf}</svg>;
}
const ApiContext=createContext(api);
export default function ChatbotApp({request=api, embedded=false, initialPage='chat', logoUrl}) {
  return <ApiContext.Provider value={request}><div className="mindbridge-chatbot"><App embedded={embedded} initialPage={initialPage} logoUrl={logoUrl}/></div></ApiContext.Provider>;
}
function App({embedded,initialPage,logoUrl}) {
  const api=useContext(ApiContext);
  const [health, setHealth] = useState(null),
    [user, setUser] = useState(null),
    [page, setPage] = useState(initialPage),
    [chats, setChats] = useState([]),
    [current, setCurrent] = useState(null),
    [messages, setMessages] = useState([]),
    [input, setInput] = useState(''),
    [busy, setBusy] = useState(false),
    [consent, setConsent] = useState(false),
    [error, setError] = useState('');
  const end = useRef(null);
  useEffect(() => {
    api('/health').then(setHealth).catch(e => setError(e.message));
    api('/me').then(d => setUser(d.user)).catch(e => {if(embedded)setError(e.message);});
  }, []);
  useEffect(() => {
    if (user) refreshChats();
  }, [user]);
  useEffect(() => {
    const area = end.current?.parentElement;
    if (area && messages.length) area.scrollTo({
      top: area.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages, busy]);
  async function refreshChats() {
    try {
      setChats(await api('/conversations'));
    } catch (e) {
      setError(e.message);
    }
  }
  async function login(role) {
    setBusy(true);
    setError('');
    try {
      let d;
      if (embedded) d = await api('/me'); else if (health?.mode === 'preview') d = await api('/demo-session', {
        method: 'POST',
        body: {
          role
        }
      });else {
        const token = await api('/auth/chatbot-token', {
          method: 'POST',
          body: {}
        });
        d = await api('/session', {
          method: 'POST',
          body: {
            token: token.token
          }
        });
      }
      setUser(d.user);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function openChat(id) {
    setBusy(true);
    setError('');
    try {
      const c = await api(`/conversations/${id}`);
      setCurrent(c.id);
      setMessages(c.messages);
      setPage('chat');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function send(event) {
    event?.preventDefault();
    if (busy || !input.trim()) return;
    if (!user) {
      setError('Connect your account before starting a conversation.');
      return;
    }
    if (!current && !consent) {
      setError('Please read and accept conversation storage before continuing.');
      return;
    }
    const question = input.trim();
    setBusy(true);
    setError('');
    try {
      let id = current;
      if (!id) {
        const c = await api('/conversations', {
          method: 'POST',
          body: {
            consent
          }
        });
        id = c.id;
        setCurrent(id);
      }
      const reply = await api(`/conversations/${id}/messages`, {
        method: 'POST',
        body: {
          message: question
        }
      });
      setMessages(prev => [...prev, {
        role: 'user',
        content: question
      }, reply]);
      setInput('');
      await refreshChats();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function removeChat() {
    if (!window.confirm('Delete this conversation and its related feedback and safety records? This cannot be undone.')) return;
    try {
      await api(`/conversations/${current}`, {
        method: 'DELETE'
      });
      setCurrent(null);
      setMessages([]);
      await refreshChats();
    } catch (e) {
      setError(e.message);
    }
  }
  async function feedback(message, rating) {
    try {
      await api('/feedback', {
        method: 'POST',
        body: {
          messageId: message.id,
          rating,
          reason: rating === -1 ? 'unhelpful' : undefined
        }
      });
      setMessages(prev => prev.map(m => m.id === message.id ? {
        ...m,
        feedback: rating
      } : m));
    } catch (e) {
      setError(e.message);
    }
  }
  return <div className="app"><aside className="sidebar">
    <button className="new-chat" disabled={busy} onClick={() => {
        setCurrent(null);
        setMessages([]);
        setPage('chat');
        setInput('');
        setError('');
      }}><Icon name="plus" />New conversation</button>
    <nav aria-label="Main navigation"><button className={page === 'chat' ? 'active' : ''} onClick={() => setPage('chat')}><Icon name="chat" />Your conversations</button><button className={page === 'privacy' ? 'active' : ''} onClick={() => setPage('privacy')}><Icon name="shield" />Privacy & memory</button>{user?.role === 'admin' && <button className={page === 'knowledge' ? 'active' : ''} onClick={() => setPage('knowledge')}><Icon name="book" />Knowledge review</button>}</nav>
    <div className="history"><span className="eyebrow">RECENT CONVERSATIONS</span>{chats.length === 0 ? <p className="muted small">A fresh start, whenever you need it.</p> : chats.map(c => <button key={c.id} className={current === c.id ? 'selected' : ''} disabled={busy} onClick={() => openChat(c.id)}><Icon name="chat" /><span>Conversation<small>{new Date(c.created_at).toLocaleDateString()}</small></span></button>)}</div>
    <div className="sidebar-note"><Icon name="leaf" /><p>One thought at a time.<br /><strong>At your own pace.</strong></p></div><div className="account"><span className="avatar">{user?.role === 'admin' ? 'A' : 'M'}</span><div>{user ? `${user.role === 'admin' ? 'Administrator' : 'Your'} workspace` : 'Your private space'}<small>{health?.mode === 'preview' ? 'Local interface preview' : 'MindBridge account'}</small></div>{user && !embedded && <button className="text-button" onClick={async () => {
          await api('/logout', {
            method: 'POST',
            body: {}
          });
          setUser(null);
          setCurrent(null);
          setMessages([]);
          setChats([]);
          setPage('chat');
        }}>Exit</button>}</div>
  </aside><main><header><div><span className="eyebrow">MINDBRIDGE ASSISTANT</span><h1>{page === 'knowledge' ? 'Knowledge, carefully reviewed' : page === 'privacy' ? 'You choose what stays' : 'A little space for you'}</h1></div><span className="status"><span />{health?.mode === 'preview' ? 'Preview mode' : 'Supportive AI'}</span></header>
    {user && <div className="mobile-tools"><select aria-label="Open a previous conversation" value={current || ''} disabled={busy} onChange={e => e.target.value && openChat(e.target.value)}><option value="">Previous conversations</option>{chats.map(c => <option key={c.id} value={c.id}>Conversation · {new Date(c.created_at).toLocaleString()}</option>)}</select></div>}
    {health?.mode === 'preview' && <div className="preview-banner">Interface preview · No AI model or clinical knowledge connected. Use synthetic information only. Data clears when this server restarts.</div>}
    {error && <div className="error" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
    {!user && <section className="connect"><div><strong>Welcome to your space</strong><p>Connect to start a conversation and manage your privacy choices.</p></div><button className="primary" disabled={busy || !health} onClick={() => login('patient')}>{health?.mode === 'preview' ? 'Enter patient preview' : 'Connect MindBridge account'}</button>{health?.mode === 'preview' && <button className="secondary" disabled={busy} onClick={() => login('admin')}>Admin preview</button>}</section>}
    {page === 'chat' ? <div className="chat-layout"><section className="conversation" aria-label="Conversation"><div className="conversation-scroll" aria-live="polite">
      {messages.length === 0 ? <div className="welcome"><div className="welcome-mark"><Icon name="leaf" /></div><span className="eyebrow">YOU CAN START ANYWHERE</span><h2>What's on your mind?</h2><p>You don't need to have the right words.<br />For free-tier testing, use fictional examples only. Do not enter personal or patient information.</p><div className="prompts">{[['A feeling', 'I have been feeling overwhelmed lately.'], ['A question', 'What is the difference between stress and anxiety?'], ['A small step', 'How can I make space to unwind?']].map(([label, value]) => <button key={label} onClick={() => setInput(value)}><span>{label}</span>{value}<b>↗</b></button>)}</div></div> : messages.map((m, i) => <article className={`message ${m.role}`} key={m.id || i}><span className="message-label">{m.role === 'user' ? 'You' : 'MindBridge'}</span><p>{m.content}</p>{m.sources?.length > 0 && <details className="sources"><summary>{m.sources.length} approved sources</summary>{m.sources.map(s => <a href={s.url} key={s.id} target="_blank" rel="noopener noreferrer">[{s.label}] {s.title}<small>{s.source} · {s.section}{s.page ? ` · p. ${s.page}` : ''}</small></a>)}</details>}{m.role === 'assistant' && m.id && <div className="feedback">{m.feedback ? <span>Thank you for your feedback.</span> : <><span>Was this helpful?</span><button onClick={() => feedback(m, 1)}>Yes</button><button onClick={() => feedback(m, -1)}>Not quite</button></>}</div>}</article>)}
      {busy && <div className="thinking" role="status">Taking a moment…</div>}<div ref={end} /></div>
      <div className="composer-area">{!current && <label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I agree to store this conversation for up to 30 days and send relevant messages, summaries and saved context to Google Gemini to generate replies. I can delete my stored chat.</label>}<form onSubmit={send} className="composer"><textarea aria-label="Your message" maxLength={4000} value={input} onChange={e => setInput(e.target.value)} disabled={busy} placeholder="Share what's on your mind…" rows={2} /><button type="submit" className="send" disabled={busy || !input.trim() || !user || !current && !consent} aria-label="Send message"><Icon name="arrow" /></button></form><div className="composer-footer"><span>AI can make mistakes. This is not diagnosis, therapy, or emergency care.</span>{current && <button disabled={busy} onClick={removeChat} className="text-button"><Icon name="trash" />Delete chat</button>}</div></div>
    </section><aside className="support">{embedded && user?.role === 'patient' && <div className="support-card"><span className="eyebrow">OPTIONAL CHECK-IN</span><h3>Explore how you feel</h3><p>Open the existing self-assessment. This is a reflection tool, not a diagnosis. Your answers are not added to the shared knowledge base.</p><a className="primary" href="/patient/assessments">Open self-assessment</a></div>}<div className="support-card"><span className="eyebrow">A GENTLE REMINDER</span><h3>You set the pace.</h3><p>Share only what feels comfortable. You can pause or leave whenever you like.</p><div className="decor-leaves" aria-hidden="true"><Icon name="leaf" /><Icon name="leaf" /></div></div><div className="principles"><div><Icon name="book" /><span><strong>Sources you can explore</strong><p>Factual answers use reviewed knowledge with citations.</p></span></div><div><Icon name="shield" /><span><strong>Privacy is a choice</strong><p>Personal memory is optional. No conversations enter the knowledge index.</p></span></div></div><div className="human-note"><strong>Human support matters</strong><p>This assistant cannot replace a qualified professional. If you are in immediate danger, contact local emergency services or a trusted person nearby.</p><p className="small">No automatic contact or alert is sent.</p></div></aside></div> : page === 'privacy' ? <Privacy user={user} onError={setError} /> : user?.role === 'admin' ? <Knowledge onError={setError} /> : null}
  </main></div>;
}
function Privacy({
  user,
  onError
}) {
  const api=useContext(ApiContext);
  const [memories, setMemories] = useState([]),
    [memory, setMemory] = useState(''),
    [consent, setConsent] = useState(false),
    [busy, setBusy] = useState(false);
  async function load() {
    try {
      setMemories(await api('/memories'));
    } catch (e) {
      onError(e.message);
    }
  }
  useEffect(() => {
    if (user) load();
  }, [user]);
  async function add(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api('/memories', {
        method: 'POST',
        body: {
          memory,
          consent
        }
      });
      setMemory('');
      setConsent(false);
      await load();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <section className="content-page"><div className="privacy-grid"><div className="paper"><Icon name="shield" /><h2>Your conversation, your choice</h2><p>Conversations are stored only after you agree. They expire after 30 days. You can delete a conversation from the chat screen before then.</p><p>In connected mode, private messages, summaries, and optional memories are encrypted at rest. They are kept separate from approved knowledge.</p><p>Relevant recent messages and your chosen memories are processed by the configured AI services. Avoid names, addresses, medical record numbers, and other details you do not need to share.</p><p>Deleting a chat also deletes its feedback and associated safety and retrieval records. Optional memories are separate: delete them here.</p></div><div className="paper"><span className="eyebrow">OPTIONAL · EXPIRES AFTER 30 DAYS</span><h2>What should I remember?</h2><p>For example, “I prefer short explanations.” Nothing is automatically added here.</p><form onSubmit={add}><label>Personal preference<textarea maxLength={500} value={memory} onChange={e => setMemory(e.target.value)} placeholder="A preference you want to share" required /></label><label className="consent"><input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} />I explicitly agree to save this memory and use it in future replies.</label><button className="primary" disabled={!user || !consent || busy || !memory.trim()}>Save optional memory</button></form>{memories.map(m => <div className="memory" key={m.id}><p>{m.memory}</p><button className="text-button" onClick={async () => {
            try {
              await api(`/memories/${m.id}`, {
                method: 'DELETE'
              });
              await load();
            } catch (e) {
              onError(e.message);
            }
          }}>Delete</button></div>)}</div></div></section>;
}
function Knowledge({
  onError
}) {
  const api=useContext(ApiContext);
  const [docs, setDocs] = useState([]),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState('');
  async function load() {
    try {
      setDocs(await api('/admin/documents'));
    } catch (e) {
      onError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  async function upload(e) {
    e.preventDefault();
    const form = e.currentTarget,
      values = new FormData(form),
      metadata = {};
    for (const [k, v] of values) if (k !== 'file') metadata[k] = v;
    const data = new FormData();
    data.append('file', values.get('file'));
    data.append('metadata', JSON.stringify(metadata));
    setBusy(true);
    try {
      await api('/admin/documents', {
        method: 'POST',
        body: data
      });
      form.reset();
      setNotice('Source submitted for review. It is not searchable yet.');
      await load();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function review(id, decision) {
    if (!window.confirm(decision === 'approve' ? 'Confirm this exact source has been reviewed by a qualified clinical reviewer, is suitable for adult English-language education, and you have permission to use it?' : 'Reject this source and remove it from retrieval?')) return;
    setBusy(true);
    try {
      const r = await api(`/admin/documents/${id}/review`, {
        method: 'POST',
        body: {
          decision,
          clinicalReviewConfirmed: decision === 'approve'
        }
      });
      setNotice(r.notice || 'Review recorded. Approved sources are queued for indexing.');
      await load();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return <section className="content-page"><div className="knowledge-heading"><div><h2>Approved knowledge library</h2><p>Upload → clinical review → approval → extraction & indexing → retrieval</p></div><button className="secondary" onClick={load}>Refresh status</button></div>{notice && <div className="success" role="status">{notice}</div>}<div className="knowledge-grid"><form className="paper" onSubmit={upload}><span className="eyebrow">NEW SOURCE</span><h3>Submit for review</h3><p className="muted small">Public educational sources only. Never upload patient records or private conversations. PDF or UTF-8 text, up to 5 MB. English / adult content in version 1.</p>{[['title', 'Document title'], ['source', 'Source organisation'], ['source_url', 'Original source URL'], ['author', 'Author / organisation'], ['publication_date', 'Publication date'], ['topic', 'Topic']].map(([name, label]) => <label key={name}>{label}<input name={name} type={name === 'publication_date' ? 'date' : name === 'source_url' ? 'url' : 'text'} maxLength={name === 'source_url' ? 1500 : 250} required /></label>)}<label>Evidence type<select name="evidence_type">{['clinical_guideline', 'systematic_review', 'research_paper', 'professional_guidance', 'patient_information'].map(t => <option key={t} value={t}>{t.replaceAll('_', ' ')}</option>)}</select></label><label>Source file<input name="file" type="file" accept=".pdf,.txt" required /></label><button className="primary" disabled={busy}>{busy ? 'Working…' : 'Submit source'}</button></form><div><div className="library-count"><strong>{docs.length} sources</strong><span>Only approved, indexed sources are searchable</span></div>{docs.length === 0 ? <div className="empty-library"><Icon name="book" /><h3>Start with a trusted source</h3><p>No documents have been submitted. Approval is a human responsibility; the assistant does not certify clinical quality.</p></div> : docs.map(d => <article className="document" key={d.id}><span className={`pill ${d.review_status}`}>{d.review_status}</span><h3>{d.metadata.title}</h3><p>{d.metadata.source} · {d.metadata.publication_date}</p><p className="small">{d.metadata.evidence_type.replaceAll('_', ' ')} · Index: {d.state}</p>{d.reviewed_at && <p className="small">Reviewed: {new Date(d.reviewed_at).toLocaleString()}</p>}<div className="document-actions"><a href={api.url ? api.url(`/admin/documents/${d.id}/file`) : `/api/admin/documents/${d.id}/file`} download className="secondary">Download for review</a><button className="primary" disabled={busy} onClick={() => review(d.id, 'approve')}>{d.state === 'failed' ? 'Approve & retry' : 'Approve & index'}</button><button className="text-button" disabled={busy} onClick={() => review(d.id, 'reject')}>Reject</button></div></article>)}</div></div></section>;
}

