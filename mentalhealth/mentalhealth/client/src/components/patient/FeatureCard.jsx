import { Link } from "react-router-dom";

export default function FeatureCard({ title, description, href, accent, icon = "arrow_outward" }) {
  return (
    <Link
      to={href}
      className={`group rounded-[32px] border border-white/70 bg-gradient-to-br ${accent} p-6 shadow-soft transition duration-200 hover:-translate-y-1`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl font-semibold text-[var(--color-text)]">{title}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--color-text-muted)]">{description}</p>
        </div>
        <span className="material-icons rounded-2xl bg-white/80 p-3 text-[var(--color-text)] shadow-soft transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          {icon}
        </span>
      </div>
    </Link>
  );
}
