export default function RouteLoader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-surface)] px-6">
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/80 p-8 text-center shadow-[0_20px_60px_rgba(44,94,88,0.12)] backdrop-blur">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-primary)]" />
        <p className="text-sm font-medium text-[var(--color-text-muted)]">{label}</p>
      </div>
    </div>
  );
}
