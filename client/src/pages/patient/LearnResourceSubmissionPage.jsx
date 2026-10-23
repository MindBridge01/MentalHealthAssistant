import { useState } from "react";
import { Link } from "react-router-dom";
import { readLearnSubmissions, writeLearnSubmissions } from "../../data/learnContent";

const initialForm = {
  submissionType: "video",
  title: "",
  link: "",
  explanation: "",
  displayPreference: "name",
  permission: false,
};

export default function LearnResourceSubmissionPage() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState("");

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setStatus("Please add a title before sending your suggestion.");
      return;
    }

    if (!form.permission) {
      setStatus("Please confirm that you have permission to share the content and have excluded private information.");
      return;
    }

    const submissions = readLearnSubmissions();
    const nextSubmission = {
      id: `sub-${Date.now()}`,
      submitter: "Patient or approved professional",
      submissionType:
        form.submissionType === "personal-reflection"
          ? "Personal reflection"
          : form.submissionType === "podcast"
            ? "Podcast"
            : form.submissionType === "article"
              ? "Article"
              : "Video",
      title: form.title.trim(),
      link: form.link.trim() || "Not provided",
      explanation: form.explanation.trim() || "No additional context provided.",
      displayPreference: form.displayPreference === "name" ? "Name" : "Community contributor",
      status: "Pending review",
      date: new Date().toISOString().slice(0, 10),
      reviewHistory: "Submitted for admin review.",
    };

    writeLearnSubmissions([nextSubmission, ...submissions]);
    setStatus("Your submission will be reviewed before publication.");
    setForm(initialForm);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Link to="/patient/learn" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
          <span className="material-icons">arrow_back</span>
          Back to library
        </Link>
      </div>

      <div className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-soft md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-subtle)]">Suggest a resource</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--color-text)]">Share a resource or reflection</h1>
        <p className="mt-3 text-base leading-8 text-[var(--color-text-muted)]">
          This is a safe space for patient suggestions and approved professional contributions. Every submission is reviewed before publication.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
              Submission type
              <select
                name="submissionType"
                value={form.submissionType}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              >
                <option value="video">Video</option>
                <option value="podcast">Podcast</option>
                <option value="article">Article</option>
                <option value="personal-reflection">Personal reflection</option>
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--color-text)]">
              Title
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
                placeholder="For example: A gentle evening reset"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-[var(--color-text)]">
            Link, where applicable
            <input
              name="link"
              type="url"
              value={form.link}
              onChange={handleChange}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="https://example.com"
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-[var(--color-text)]">
            Short explanation or post text
            <textarea
              name="explanation"
              value={form.explanation}
              onChange={handleChange}
              rows="5"
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
              placeholder="Tell us what this resource covers and why it may help someone else."
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-[var(--color-text)]">
            Display preference
            <select
              name="displayPreference"
              value={form.displayPreference}
              onChange={handleChange}
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
            >
              <option value="name">Name</option>
              <option value="community">Community contributor</option>
            </select>
          </label>

          <label className="flex items-start gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-sm leading-7 text-[var(--color-text-muted)]">
            <input
              name="permission"
              type="checkbox"
              checked={form.permission}
              onChange={handleChange}
              className="mt-1 h-4 w-4 accent-[var(--color-primary)]"
            />
            <span>
              I confirm that I have permission to share this content and I have excluded any private information from other people.
            </span>
          </label>

          {status ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {status}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button type="submit" className="primary-button">Send for review</button>
            <Link to="/patient/learn" className="inline-flex items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)]">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
