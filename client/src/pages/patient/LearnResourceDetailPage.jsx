import { useMemo, useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { readLearnContent } from "../../data/learnContent";

function ResourceActionButton({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(42,133,122,0.22)]"
    >
      {label}
      <span className="material-icons text-base">open_in_new</span>
    </a>
  );
}

export default function LearnResourceDetailPage() {
  const { resourceId } = useParams();
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("mindbridge-learn-bookmarks") || "[]");
      setBookmarks(Array.isArray(saved) ? saved : []);
    } catch {
      setBookmarks([]);
    }
  }, []);

  const resources = useMemo(() => readLearnContent(), []);
  const resource = resources.find((item) => item.id === resourceId) || resources[0];

  if (!resource) {
    return (
      <div className="rounded-[32px] border border-white/70 bg-white/85 p-8 text-center text-[var(--color-text-muted)] shadow-soft">
        This resource is no longer available.
      </div>
    );
  }

  const isBookmarked = bookmarks.includes(resource.id);
  const actionLabel =
    resource.type === "Podcast"
      ? "Listen to podcast"
      : resource.type === "Expert talk"
        ? "Watch on YouTube"
        : resource.type === "Research explained"
          ? "Read original source"
          : resource.type === "Gentle read"
            ? "Read original source"
            : "Try the guide";

  const reportConcern = () => {
    window.alert("Thanks. This issue has been flagged for review by the admin team.");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/patient/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <span className="material-icons">arrow_back</span>
          Back to Learn & Unwind
        </Link>

        <button
          type="button"
          onClick={() => {
            setBookmarks((current) =>
              current.includes(resource.id)
                ? current.filter((item) => item !== resource.id)
                : [...current, resource.id]
            );
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)]"
        >
          <span className="material-icons text-base">{isBookmarked ? "bookmark" : "bookmark_border"}</span>
          {isBookmarked ? "Saved" : "Save for later"}
        </button>
      </div>

      <section className="overflow-hidden rounded-[36px] border border-white/70 bg-white/90 shadow-soft">
        <img src={resource.thumbnail} alt={resource.title} className="h-72 w-full object-cover md:h-96" />

        <div className="grid gap-8 p-6 md:p-8 xl:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                {resource.type}
              </span>
              <span className="inline-flex rounded-full bg-[var(--color-surface)] px-3 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                {resource.topic}
              </span>
              {resource.isClinicallyReviewed ? (
                <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Clinically reviewed
                </span>
              ) : null}
            </div>

            <h1 className="mt-5 font-display text-4xl font-semibold text-[var(--color-text)]">{resource.title}</h1>
            <p className="mt-4 text-base leading-8 text-[var(--color-text-muted)]">{resource.description}</p>

            {resource.contentNote ? (
              <div className="mt-5 rounded-[24px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {resource.contentNote}
              </div>
            ) : null}

            <div className="mt-6 flex flex-wrap gap-3">
              <ResourceActionButton href={resource.externalLink} label={actionLabel} />
              <button
                type="button"
                onClick={reportConcern}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)]"
              >
                Report a concern
              </button>
            </div>
          </div>

          <aside className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Resource details</p>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-[var(--color-text-subtle)]">Author / speaker</dt>
                <dd className="mt-1 font-medium text-[var(--color-text)]">{resource.author}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-subtle)]">Source</dt>
                <dd className="mt-1 font-medium text-[var(--color-text)]">{resource.source}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-subtle)]">Publication date</dt>
                <dd className="mt-1 font-medium text-[var(--color-text)]">{new Date(resource.publicationDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-subtle)]">Language</dt>
                <dd className="mt-1 font-medium text-[var(--color-text)]">{resource.language}</dd>
              </div>
              <div>
                <dt className="text-[var(--color-text-subtle)]">Estimated duration</dt>
                <dd className="mt-1 font-medium text-[var(--color-text)]">{resource.duration}</dd>
              </div>
              {resource.reviewer ? (
                <div>
                  <dt className="text-[var(--color-text-subtle)]">Qualified reviewer</dt>
                  <dd className="mt-1 font-medium text-[var(--color-text)]">{resource.reviewer}</dd>
                </div>
              ) : null}
            </dl>
          </aside>
        </div>
      </section>
    </div>
  );
}
