import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
  onCta?: () => void;
}

/**
 * Empty-state for not-yet-populated lists. Encourages the user to be the FIRST
 * to contribute (ties into the pioneer reward).
 */
export default function EmptyState({
  icon = "inbox",
  title,
  description,
  ctaLabel,
  ctaTo,
  onCta,
}: EmptyStateProps) {
  const cta = ctaLabel ? (
    ctaTo ? (
      <Link to={ctaTo}>
        <button className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-900">
          {ctaLabel}
        </button>
      </Link>
    ) : (
      <button
        onClick={onCta}
        className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-slate-900"
      >
        {ctaLabel}
      </button>
    )
  ) : null;

  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      <span className="material-symbols-outlined mb-3 text-5xl text-slate-300">{icon}</span>
      <p className="text-sm font-bold text-slate-600">{title}</p>
      {description && <p className="mt-1 text-xs leading-relaxed text-slate-400">{description}</p>}
      {cta}
    </div>
  );
}
