import { useEffect, useState } from "react";
import PageHeader from "../../components/patient/PageHeader";
import PostCard from "../../components/patient/PostCard";
import { useAuth } from "../../context/AuthContext";
import {
  addComment,
  createCommunityPost,
  getCommunityPosts,
  togglePostLike,
  togglePostSave,
} from "../../services/communityService";
import { uploadImage } from "../../services/patientService";

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  async function loadPosts() {
    const response = await getCommunityPosts();
    setPosts(response.posts || []);
  }

  useEffect(() => {
    loadPosts().catch((loadError) => setError(loadError.message));
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let imagePath = "";
      if (selectedFile) {
        const uploadResult = await uploadImage(selectedFile);
        imagePath = uploadResult.imagePath;
      }

      const response = await createCommunityPost({
        caption,
        location,
        image: imagePath,
      });
      setPosts((current) => [response.post, ...current]);
      setCaption("");
      setLocation("");
      setSelectedFile(null);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function updatePost(postId, updater) {
    const response = await updater();
    setPosts((current) => current.map((post) => (post._id === postId ? response.post : post)));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Community"
        title="Share something supportive, honest, or hopeful"
        description="The community space is for gentle encouragement, personal reflections, and practical coping ideas. Please avoid sharing crisis details that need immediate emergency support."
      />

      <section className="rounded-[36px] border border-white/70 bg-white/85 p-6 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)]">
            {(user?.name || "M").slice(0, 1)}
          </div>
          <form onSubmit={handleSubmit} className="flex-1 space-y-4">
            <textarea
              rows="4"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              className="w-full rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
              placeholder="What is helping you lately, or what kind of encouragement would you like to share?"
            />
            <div className="grid gap-4 md:grid-cols-[1fr_auto_auto]">
              <input
                value={location}
                onChange={(event) => setLocation(event.target.value)}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text)] outline-none transition focus:border-[var(--color-primary)]"
                placeholder="Optional location"
              />
              <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-[var(--color-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--color-text)]">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
                {selectedFile ? selectedFile.name : "Add image"}
              </label>
              <button type="submit" disabled={isSubmitting} className="primary-button">
                {isSubmitting ? "Posting..." : "Share post"}
              </button>
            </div>
            {error ? <p className="rounded-2xl bg-[var(--color-danger-soft)] px-4 py-3 text-sm text-[var(--color-danger)]">{error}</p> : null}
          </form>
        </div>
      </section>

      <section className="space-y-5">
        {posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={() => updatePost(post._id, () => togglePostLike(post._id))}
            onSave={() => updatePost(post._id, () => togglePostSave(post._id))}
            onComment={async (content) => {
              await addComment(post._id, content);
              await loadPosts();
            }}
          />
        ))}
      </section>
    </div>
  );
}
