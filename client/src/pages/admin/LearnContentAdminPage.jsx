import { useEffect, useMemo, useState } from "react";
import { readLearnContent, readLearnSubmissions, writeLearnContent, writeLearnSubmissions } from "../../data/learnContent";
import { getPendingCommunityPosts, reviewCommunityPost } from "../../services/communityService";

const defaultDraft = {
  title: "",
  type: "Podcast",
  topic: "Stress",
  language: "English",
  duration: "8 min",
  description: "",
  source: "",
  externalLink: "",
  author: "",
  publicationDate: new Date().toISOString().slice(0, 10),
  status: "Draft",
  reviewer: "",
  clinicallyReviewed: false,
  contentNote: "",
  thumbnail: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
};

export default function LearnContentAdminPage() {
  const [resources, setResources] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [communityPosts, setCommunityPosts] = useState([]);
  const [communityError, setCommunityError] = useState("");
  const [reviewingPostId, setReviewingPostId] = useState("");
  const [draft, setDraft] = useState(defaultDraft);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    setResources(readLearnContent());
    setSubmissions(readLearnSubmissions());
    getPendingCommunityPosts()
      .then((response) => setCommunityPosts(response.posts || []))
      .catch((error) => setCommunityError(error.message));
  }, []);

  const publishedCount = useMemo(
    () => resources.filter((item) => item.status === "Published").length,
    [resources]
  );

  const handleDraftChange = (event) => {
    const { name, value, type, checked } = event.target;
    setDraft((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePublish = (event) => {
    event.preventDefault();

    if (!draft.title.trim() || !draft.description.trim()) {
      setStatusMessage("Title and description are required before publishing.");
      return;
    }

    const nextResource = {
      id: `admin-${Date.now()}`,
      title: draft.title.trim(),
      type: draft.type,
      topic: draft.topic,
      language: draft.language,
      duration: draft.duration,
      description: draft.description.trim(),
      source: draft.source || "MindBridge admin review",
      author: draft.author || "MindBridge Editorial Team",
      externalLink: draft.externalLink || "https://example.com",
      thumbnail: draft.thumbnail,
      publicationDate: draft.publicationDate,
      reviewDate: new Date().toISOString().slice(0, 10),
      isClinicallyReviewed: draft.clinicallyReviewed,
      reviewer: draft.reviewer || "",
      contentNote: draft.contentNote || "",
      status: draft.status,
      format: draft.type,
    };

    const nextResources = [nextResource, ...resources];
    setResources(nextResources);
    writeLearnContent(nextResources);
    setDraft(defaultDraft);
    setStatusMessage("Resource saved to the Learn & Unwind library.");
  };

  const handleDecision = (submissionId, nextStatus) => {
    const updatedSubmissions = submissions.map((submission) =>
      submission.id === submissionId
        ? { ...submission, status: nextStatus, reviewHistory: `${submission.reviewHistory} • Admin set to ${nextStatus}.` }
        : submission
    );
    setSubmissions(updatedSubmissions);
    writeLearnSubmissions(updatedSubmissions);
  };

  const handleCommunityReview = async (postId, decision) => {
    setReviewingPostId(postId);
    setCommunityError("");
    try {
      await reviewCommunityPost(postId, decision);
      setCommunityPosts((current) => current.filter((post) => post._id !== postId));
    } catch (error) {
      setCommunityError(error.message);
    } finally {
      setReviewingPostId("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">CONTENT MODERATION</span>
            <h2>Community post review</h2>
            <p>Patient posts stay hidden from the community until an admin approves them.</p>
          </div>
          <span className="admin-badge">{communityPosts.length} awaiting review</span>
        </div>

        {communityError ? <p role="alert" className="mb-4 rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{communityError}</p> : null}
        {communityPosts.length === 0 && !communityError ? (
          <p className="rounded-2xl bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-muted)]">No community posts are waiting for review.</p>
        ) : null}
        <div className="grid gap-5 xl:grid-cols-2">
          {communityPosts.map((post) => (
            <article key={post._id} className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--color-text)]">{post.name || "Community contributor"}</h3>
                  <p className="mt-1 text-xs text-[var(--color-text-subtle)]">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-text)]">Pending review</span>
              </div>
              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[var(--color-text-muted)]">{post.caption}</p>
              {post.image ? <img src={post.image} alt="Image submitted with community post" className="mt-4 max-h-64 w-full rounded-2xl object-cover" /> : null}
              <dl className="mt-4 grid gap-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex justify-between gap-4"><dt>Submitter</dt><dd className="text-right font-medium text-[var(--color-text)]">{post.submitter?.name || "Account unavailable"}</dd></div>
                <div className="flex justify-between gap-4"><dt>Account email</dt><dd className="text-right font-medium text-[var(--color-text)]">{post.submitter?.email || "Unavailable"}</dd></div>
                {post.location ? <div className="flex justify-between gap-4"><dt>Location</dt><dd className="text-right font-medium text-[var(--color-text)]">{post.location}</dd></div> : null}
                <div className="flex justify-between gap-4"><dt>Reference</dt><dd className="font-mono text-xs text-[var(--color-text)]">{post._id}</dd></div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" disabled={Boolean(reviewingPostId)} className="admin-button admin-button-primary" onClick={() => handleCommunityReview(post._id, "approved")}>
                  {reviewingPostId === post._id ? "Saving..." : "Approve and publish"}
                </button>
                <button type="button" disabled={Boolean(reviewingPostId)} className="admin-button" onClick={() => handleCommunityReview(post._id, "rejected")}>Reject</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">CONTENT MODERATION</span>
            <h2>Learn & Unwind review queue</h2>
            <p>Review patient and professional submissions before they are published.</p>
          </div>
          <span className="admin-badge admin-badge-success">{publishedCount} published</span>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {submissions.map((submission) => (
            <div key={submission.id} className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">{submission.submissionType}</p>
                  <h3 className="mt-2 text-xl font-semibold text-[var(--color-text)]">{submission.title}</h3>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-text)]">{submission.status}</span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[var(--color-text-muted)]">{submission.explanation}</p>

              <dl className="mt-4 grid gap-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex justify-between gap-4"><dt>Submitter</dt><dd className="font-medium text-[var(--color-text)]">{submission.submitter}</dd></div>
                <div className="flex justify-between gap-4"><dt>Display</dt><dd className="font-medium text-[var(--color-text)]">{submission.displayPreference}</dd></div>
                <div className="flex justify-between gap-4"><dt>Source</dt><dd className="font-medium text-[var(--color-text)]">{submission.link}</dd></div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <button className="admin-button admin-button-primary" onClick={() => handleDecision(submission.id, "Published")}>Publish</button>
                <button className="admin-button" onClick={() => handleDecision(submission.id, "Review")}>Request changes</button>
                <button className="admin-button" onClick={() => handleDecision(submission.id, "Archived")}>Archive</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handlePublish} className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-eyebrow">ADMIN PUBLISHING FORM</span>
            <h2>Create a Learn & Unwind resource</h2>
            <p>Use the approved content workflow and keep all external links secure.</p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Title
            <input name="title" value={draft.title} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Content type
            <select name="type" value={draft.type} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option>Podcast</option>
              <option>Expert talk</option>
              <option>Research explained</option>
              <option>Gentle read</option>
              <option>Relaxation guide</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Topic
            <select name="topic" value={draft.topic} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option>Stress</option>
              <option>Anxiety</option>
              <option>Sleep</option>
              <option>Mindfulness</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Language
            <select name="language" value={draft.language} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option>English</option>
              <option>Sinhala</option>
              <option>Tamil</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Duration
            <input name="duration" value={draft.duration} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Status
            <select name="status" value={draft.status} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]">
              <option>Draft</option>
              <option>Review</option>
              <option>Published</option>
              <option>Archived</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)] md:col-span-2">
            Short description or original post body
            <textarea name="description" value={draft.description} onChange={handleDraftChange} rows="4" className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            External link
            <input name="externalLink" value={draft.externalLink} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" placeholder="https://example.com" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Source organisation
            <input name="source" value={draft.source} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Author / speaker
            <input name="author" value={draft.author} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Qualified reviewer
            <input name="reviewer" value={draft.reviewer} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Publication date
            <input type="date" name="publicationDate" value={draft.publicationDate} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
            Thumbnail URL
            <input name="thumbnail" value={draft.thumbnail} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" />
          </label>

          <label className="space-y-2 text-sm font-medium text-[var(--color-text)] md:col-span-2">
            Sensitive content note
            <input name="contentNote" value={draft.contentNote} onChange={handleDraftChange} className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]" placeholder="Optional note for trauma or sensitive content" />
          </label>

          <label className="flex items-start gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-7 text-[var(--color-text-muted)] md:col-span-2">
            <input type="checkbox" name="clinicallyReviewed" checked={draft.clinicallyReviewed} onChange={handleDraftChange} className="mt-1 h-4 w-4 accent-[var(--color-primary)]" />
            <span>This content has been clinically reviewed and its review is complete.</span>
          </label>
        </div>

        {statusMessage ? (
          <div className="mt-6 rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {statusMessage}
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" className="primary-button">Save content</button>
        </div>
      </form>
    </div>
  );
}
