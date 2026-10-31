import { useEffect, useState } from 'react';
import { getPostsForReview, reviewCommunityPost } from '../../services/communityService';

const statuses = ['pending', 'approved', 'rejected'];
const formatDate = value => value ? new Date(value).toLocaleString() : '—';

export default function CommunityPostReview({ onReviewed }) {
  const [status, setStatus] = useState('pending');
  const [offset, setOffset] = useState(0);
  const [posts, setPosts] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(null);
  const [notes, setNotes] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    getPostsForReview(status, offset)
      .then(result => {
        if (!active) return;
        setPosts(result.posts);
        setHasMore(result.hasMore);
      })
      .catch(loadError => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [status, offset, reload]);

  async function decide(post, decision) {
    setReviewing({ id: post._id, decision });
    setError('');
    setNotice('');
    try {
      await reviewCommunityPost(post._id, decision, notes[post._id] || '');
      setNotice(decision === 'approved' ? 'Post approved and published in the community.' : 'Post rejected. It will not appear in the community.');
      setNotes(current => { const next = { ...current }; delete next[post._id]; return next; });
      if (posts.length === 1 && offset > 0) setOffset(value => Math.max(0, value - 25));
      else setReload(value => value + 1);
      onReviewed?.();
    } catch (reviewError) {
      setError(reviewError.message);
      if (reviewError.status === 409) setReload(value => value + 1);
    } finally {
      setReviewing(null);
    }
  }

  const disabled = loading || Boolean(reviewing);
  return <section className="admin-panel" aria-labelledby="community-review-heading">
    <div className="admin-panel-heading">
      <div><h2 id="community-review-heading">Community post review</h2><p>Check the message and image before publishing. Only approved posts appear in the community.</p></div>
      <button className="admin-button" disabled={disabled} onClick={() => setReload(value => value + 1)}>Refresh posts</button>
    </div>
    <label className="admin-filters">Review status
      <select aria-label="Review status" value={status} disabled={disabled} onChange={event => { setStatus(event.target.value); setOffset(0); setNotice(''); }}>
        {statuses.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}
      </select>
    </label>
    {notice && <p role="status" className="rounded-xl bg-[var(--color-primary-soft)] p-4">{notice}</p>}
    {error && <p role="alert" className="admin-error">{error}</p>}
    {loading ? <p role="status" className="admin-empty">Loading posts…</p> : error ? <div className="admin-empty">Refresh posts to try again.</div> : !posts.length ? <div className="admin-empty">{status === 'pending' ? 'No posts are waiting for review.' : `No ${status} posts yet.`}</div> :
      <div className="grid gap-5 xl:grid-cols-2">{posts.map(post => <article key={post._id} className="rounded-2xl border border-[var(--color-border)] p-5">
        <div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{post.name || 'MindBridge member'}</h3><p className="text-sm">Submitted {formatDate(post.createdAt)}{post.location ? ` · ${post.location}` : ''}</p></div><span className={`admin-badge admin-badge-${post.moderationStatus}`}>{post.moderationStatus}</span></div>
        <p className="mt-4 whitespace-pre-wrap break-words">{post.caption}</p>
        {post.image && <img src={post.image} alt="Image submitted with this community post" loading="lazy" className="mt-4 max-h-72 w-full rounded-xl object-contain" />}
        {status === 'pending' ? <>
          <label className="mt-4 block text-sm">Review note (optional)<textarea aria-label={`Review note for ${post.name || 'MindBridge member'}`} value={notes[post._id] || ''} maxLength={1000} disabled={disabled} onChange={event => setNotes(current => ({ ...current, [post._id]: event.target.value }))} className="mt-2 block w-full rounded-xl border border-[var(--color-border)] bg-white p-3" rows={3} /></label>
          <div className="mt-4 flex flex-wrap gap-3"><button className="admin-button admin-button-primary" disabled={disabled} onClick={() => decide(post, 'approved')}>{reviewing?.id === post._id && reviewing.decision === 'approved' ? 'Approving…' : 'Approve and publish'}</button><button className="admin-button" disabled={disabled} onClick={() => decide(post, 'rejected')}>{reviewing?.id === post._id && reviewing.decision === 'rejected' ? 'Rejecting…' : 'Reject post'}</button></div>
        </> : <div className="mt-4 text-sm"><p>Reviewed {formatDate(post.reviewedAt)}</p>{post.reviewNote && <p className="mt-2 whitespace-pre-wrap">Review note: {post.reviewNote}</p>}</div>}
      </article>)}</div>}
    <footer className="admin-pagination"><span>Page {offset / 25 + 1} · up to 25 posts</span><div><button className="admin-button" disabled={disabled || !offset} onClick={() => setOffset(value => Math.max(0, value - 25))}>Previous</button><button className="admin-button" disabled={disabled || !hasMore || Boolean(error)} onClick={() => setOffset(value => value + 25)}>Next</button></div></footer>
  </section>;
}
