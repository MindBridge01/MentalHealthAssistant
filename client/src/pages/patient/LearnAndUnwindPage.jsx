import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import { readLearnContent } from "../../data/learnContent";

const types = ["All", "Podcast", "Expert talk", "Research explained", "Gentle read", "Relaxation guide"];
const topics = ["All", "Stress", "Anxiety", "Sleep", "Mindfulness"];
const languages = ["All", "English", "Sinhala", "Tamil"];

function BookmarkButton({ isBookmarked, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      <span className="material-icons text-base">{isBookmarked ? "bookmark" : "bookmark_border"}</span>
      {isBookmarked ? "Saved" : "Save"}
    </button>
  );
}

export default function LearnAndUnwindPage() {
  const [resources, setResources] = useState([]);
  const [selectedType, setSelectedType] = useState("All");
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [selectedLanguage, setSelectedLanguage] = useState("All");
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    setResources(readLearnContent());

    try {
      const saved = JSON.parse(localStorage.getItem("mindbridge-learn-bookmarks") || "[]");
      if (Array.isArray(saved)) {
        setBookmarks(saved);
      }
    } catch {
      setBookmarks([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("mindbridge-learn-bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const matchesType = selectedType === "All" || resource.type === selectedType;
      const matchesTopic = selectedTopic === "All" || resource.topic === selectedTopic;
      const matchesLanguage = selectedLanguage === "All" || resource.language === selectedLanguage;
      return matchesType && matchesTopic && matchesLanguage;
    });
  }, [resources, selectedType, selectedTopic, selectedLanguage]);

  const toggleBookmark = (id) => {
    setBookmarks((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Learn & Unwind"
        title="Small, useful resources for calmer days"
        description="Explore wellbeing guidance, grounding exercises, and gentle information that sits alongside the community without turning into peer chat or diagnosis."
        actions={
          <Link to="/patient/learn/submit" className="primary-button">
            Suggest a resource
          </Link>
        }
      />

      <section className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-soft">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 flex-wrap gap-3">
            <label className="min-w-[170px] flex-1">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Topic
              </span>
              <select
                value={selectedTopic}
                onChange={(event) => setSelectedTopic(event.target.value)}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              >
                {topics.map((topic) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </label>

            <label className="min-w-[170px] flex-1">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Language
              </span>
              <select
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value)}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              >
                {languages.map((language) => (
                  <option key={language} value={language}>{language}</option>
                ))}
              </select>
            </label>

            <label className="min-w-[170px] flex-1">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">
                Format
              </span>
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              >
                {types.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm font-medium text-[var(--color-text)]">
            {bookmarks.length} saved
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredResources.map((resource) => {
          const isBookmarked = bookmarks.includes(resource.id);

          return (
            <article
              key={resource.id}
              className="overflow-hidden rounded-[32px] border border-white/70 bg-white/90 shadow-soft"
            >
              <img
                src={resource.thumbnail}
                alt={resource.title}
                className="h-52 w-full object-cover"
              />

              <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]">
                    {resource.type}
                  </span>
                  <BookmarkButton isBookmarked={isBookmarked} onToggle={() => toggleBookmark(resource.id)} />
                </div>

                <div>
                  <h3 className="font-display text-2xl font-semibold text-[var(--color-text)]">{resource.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--color-text-muted)]">{resource.description}</p>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--color-text-muted)]">
                  <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">{resource.language}</span>
                  <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">{resource.topic}</span>
                  <span className="rounded-full bg-[var(--color-surface)] px-2.5 py-1">{resource.duration}</span>
                </div>

                <div className="flex items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-subtle)]">Speaker</p>
                    <p className="text-sm font-medium text-[var(--color-text)]">{resource.author}</p>
                  </div>
                  <Link
                    to={`/patient/learn/${resource.id}`}
                    className="inline-flex rounded-2xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(42,133,122,0.22)]"
                  >
                    View
                  </Link>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {filteredResources.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-[var(--color-border)] bg-white/70 p-10 text-center text-[var(--color-text-muted)]">
          No resources match this set of filters yet. Try another format or topic.
        </div>
      ) : null}
    </div>
  );
}
