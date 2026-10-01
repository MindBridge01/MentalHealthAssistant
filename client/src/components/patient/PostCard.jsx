import { useState } from "react";
import { Link } from "react-router-dom";

export default function PostCard({
  post,
  onLike,
  onSave,
  onComment,
  isDetail = false,
}) {
  const [comment, setComment] = useState("");
  const comments = isDetail ? post.comments : (post.comments || []).slice(0, 2);

  async function submitComment(event) {
    event.preventDefault();
    if (!comment.trim()) return;
    await onComment(comment.trim());
    setComment("");
  }

  return (
    <article className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-soft backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-[var(--color-text)]">{post.name}</p>
          <p className="mt-1 text-sm text-[var(--color-text-subtle)]">
            {post.location || "MindBridge community"} · {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
        {!isDetail ? (
          <Link
            to={`/patient/community/${post._id}`}
            className="rounded-2xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text)]"
          >
            Open
          </Link>
        ) : null}
      </div>

      <p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-[var(--color-text)]">{post.caption}</p>

      {post.image ? (
        <img
          src={post.image}
          alt="Community upload"
          className="mt-5 h-72 w-full rounded-[24px] object-cover"
        />
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onLike}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition",
            post.viewerHasLiked
              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          <span className="material-icons text-[18px]">
            {post.viewerHasLiked ? "favorite" : "favorite_border"}
          </span>
          {post.likes}
        </button>
        <button
          type="button"
          onClick={onSave}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium transition",
            post.viewerHasSaved
              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
              : "bg-[var(--color-surface)] text-[var(--color-text-muted)]",
          ].join(" ")}
        >
          <span className="material-icons text-[18px]">
            {post.viewerHasSaved ? "bookmark" : "bookmark_border"}
          </span>
          {post.savedCount}
        </button>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-[var(--color-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)]">
          <span className="material-icons text-[18px]">chat_bubble_outline</span>
          {post.commentsCount}
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {comments.map((entry) => (
          <div key={entry._id} className="rounded-2xl bg-[var(--color-surface)] px-4 py-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">{entry.authorName}</p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{entry.content}</p>
          </div>
        ))}
      </div>

      <form onSubmit={submitComment} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          className="min-w-0 flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
          placeholder="Offer something kind or encouraging..."
        />
        <button
          type="submit"
          className="rounded-2xl bg-[var(--color-primary)] px-5 py-3 text-sm font-semibold text-white"
        >
          Comment
        </button>
      </form>
    </article>
  );
}
