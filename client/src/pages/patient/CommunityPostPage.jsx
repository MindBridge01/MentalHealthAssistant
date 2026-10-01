import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import PageHeader from "../../components/patient/PageHeader";
import PostCard from "../../components/patient/PostCard";
import { addComment, getCommunityPost, togglePostLike, togglePostSave } from "../../services/communityService";

export default function CommunityPostPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [error, setError] = useState("");

  async function loadPost() {
    const response = await getCommunityPost(postId);
    setPost(response.post);
  }

  useEffect(() => {
    loadPost().catch((loadError) => setError(loadError.message));
  }, [postId]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community post"
        title="Conversation and encouragement"
        description="See the full post, comments, and reactions in one place."
      />
      {error ? <div className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</div> : null}
      {post ? (
        <PostCard
          post={post}
          isDetail
          onLike={async () => {
            const response = await togglePostLike(post._id);
            setPost(response.post);
          }}
          onSave={async () => {
            const response = await togglePostSave(post._id);
            setPost(response.post);
          }}
          onComment={async (content) => {
            await addComment(post._id, content);
            await loadPost();
          }}
        />
      ) : null}
    </div>
  );
}
