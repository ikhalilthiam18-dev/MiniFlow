"use client";
import { useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { initiales, toneStatut, type Tone } from "@/lib/mairie";

export function Logo({
  light = false,
  subtitle = "Plateforme de gestion du courrier",
  compact = false,
}: {
  light?: boolean;
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <span
        className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 shadow-sm ring-1 ring-black/5 ${compact ? "size-10" : "size-12"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-mairie-ziguinchor.jpeg"
          alt="Blason de la Commune de Ziguinchor"
          className="h-full w-full object-contain"
        />
      </span>
      <span className="min-w-0 leading-tight">
        <b
          className={`font-display block truncate font-extrabold uppercase ${compact ? "text-[12.5px] tracking-[.02em]" : "text-[15px] tracking-[.04em]"} ${light ? "text-white" : "text-brand-900"}`}
        >
          Mairie de Ziguinchor
        </b>
        {subtitle && (
          <small
            className={`block truncate text-[11.5px] ${light ? "text-white/60" : "text-muted-ink"}`}
          >
            {subtitle}
          </small>
        )}
      </span>
    </span>
  );
}

export function PageHead({
  eyebrow,
  title,
  desc,
  actions,
}: {
  eyebrow?: string;
  title: string;
  desc?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
          {title}
        </h2>
        {desc && <p className="mt-1.5 max-w-2xl text-sm text-muted-ink">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const toneBox: Record<Tone, string> = {
  green: "bg-brand-100 text-brand-700",
  amber: "bg-gold-100 text-[#8a5d00]",
  red: "bg-[#fdecea] text-[#a3211a]",
  blue: "bg-navy-100 text-navy-700",
  gray: "bg-[#eef1f0] text-[#54645c]",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "green",
  hint,
  onClick,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: Tone;
  hint?: string;
  onClick?: () => void;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={`grid size-10 place-items-center rounded-xl ${toneBox[tone]}`}>
          <Icon size={18} />
        </span>
        {onClick && (
          <ChevronRight
            size={16}
            className="text-[#9aaba3] transition group-hover:translate-x-0.5 group-hover:text-brand-700"
          />
        )}
      </div>
      <strong className="font-display mt-4 block text-3xl font-bold text-ink">{value}</strong>
      <span className="text-[13px] font-medium text-ink/80">{label}</span>
      {hint && <span className="mt-0.5 block text-[11.5px] text-muted-ink">{hint}</span>}
    </>
  );
  return onClick ? (
    <button
      onClick={onClick}
      className="card group p-4 text-left sm:p-5 transition hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
    >
      {body}
    </button>
  ) : (
    <div className="card p-4 sm:p-5">{body}</div>
  );
}

const toneTag: Record<Tone, string> = {
  green: "tag-green",
  amber: "tag-amber",
  red: "tag-red",
  blue: "tag-blue",
  gray: "tag-gray",
};

export function Badge({ tone = "gray", children }: { tone?: Tone; children: React.ReactNode }) {
  return <span className={`tag ${toneTag[tone]}`}>{children}</span>;
}

export function StatusBadge({ statut }: { statut: string }) {
  return (
    <Badge tone={toneStatut(statut)}>
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {statut}
    </Badge>
  );
}

export function SensBadge({ sens }: { sens: "Arrivée" | "Départ" }) {
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${sens === "Arrivée" ? "bg-brand-100 text-brand-700" : "bg-navy-100 text-navy-700"}`}
    >
      {sens}
    </span>
  );
}

export function Avatar({
  name,
  src,
  size = 36,
  className = "",
}: {
  name: string;
  src?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      className={`grid shrink-0 place-items-center overflow-hidden rounded-full bg-brand-100 font-bold text-brand-800 ${className}`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- data-URL avatar
        <img src={src} alt={`Photo de ${name}`} className="h-full w-full object-cover" />
      ) : (
        initiales(name)
      )}
    </span>
  );
}

export function Empty({
  title = "Aucun élément",
  text,
  icon: Icon = Inbox,
  action,
}: {
  title?: string;
  text: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-5 py-12 text-center">
      <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
        <Icon size={22} />
      </span>
      <b className="text-sm text-ink">{title}</b>
      <p className="max-w-sm text-sm text-muted-ink">{text}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function ErrorState({ text, onRetry }: { text: string; onRetry?: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-2 px-5 py-14 text-center">
      <span className="mb-1 grid size-12 place-items-center rounded-2xl bg-[#fdecea] text-[#a3211a]">
        <AlertTriangle size={22} />
      </span>
      <b className="text-sm text-ink">Une erreur est survenue</b>
      <p className="max-w-md text-sm text-muted-ink">{text}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-light mt-3">
          <RefreshCw size={15} /> Réessayer
        </button>
      )}
    </div>
  );
}

export function Spinner({ className = "size-5" }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Chargement"
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
    />
  );
}

export function LoadingScreen({ text = "Chargement…" }: { text?: string }) {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-5">
      <div className="flex flex-col items-center gap-6 text-center">
        <Logo />
        <div className="flex items-center gap-3 text-sm text-muted-ink">
          <Spinner className="size-5 text-brand-700" /> {text}
        </div>
      </div>
    </main>
  );
}

/** Client-side pagination; the page is clamped when the list shrinks. */
export function usePagination<T>(items: T[], size = 10) {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / size));
  const current = Math.min(page, pageCount);
  return {
    page: current,
    pageCount,
    setPage,
    pageItems: items.slice((current - 1) * size, current * size),
    from: items.length ? (current - 1) * size + 1 : 0,
    to: Math.min(current * size, items.length),
    total: items.length,
  };
}

export function Pagination({
  page,
  pageCount,
  setPage,
  from,
  to,
  total,
  label = "éléments",
}: {
  page: number;
  pageCount: number;
  setPage: (p: number) => void;
  from: number;
  to: number;
  total: number;
  label?: string;
}) {
  if (total === 0) return null;
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-5 py-3.5 text-xs text-muted-ink sm:flex-row">
      <span>
        {from}–{to} sur {total} {label}
      </span>
      {pageCount > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            aria-label="Page précédente"
            className="icon-btn size-8 disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>
          {Array.from({ length: pageCount }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1)
            .map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1">
                {i > 0 && p - arr[i - 1] > 1 && <span className="px-1">…</span>}
                <button
                  onClick={() => setPage(p)}
                  aria-current={p === page ? "page" : undefined}
                  className={`grid size-8 place-items-center rounded-lg text-xs font-semibold ${p === page ? "bg-brand-800 text-white" : "hover:bg-brand-50"}`}
                >
                  {p}
                </button>
              </span>
            ))}
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === pageCount}
            aria-label="Page suivante"
            className="icon-btn size-8 disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmer",
  danger = false,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void | Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onConfirm();
                onOpenChange(false);
              } finally {
                setBusy(false);
              }
            }}
            className={danger ? "btn-danger" : "btn-main"}
          >
            {busy && <Spinner className="size-4" />}
            {confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Field({
  label,
  children,
  wide,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-semibold text-[#44584f]">
        {label}
        {required && <span className="ml-0.5 text-[#c2261d]">*</span>}
      </span>
      <div className="form-control">{children}</div>
      {hint && <span className="mt-1 block text-[11px] text-muted-ink">{hint}</span>}
    </label>
  );
}

export function SectionTitle({
  title,
  desc,
  action,
}: {
  title: string;
  desc?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-display text-[15px] font-bold text-ink">{title}</h3>
        {desc && <p className="mt-0.5 text-xs text-muted-ink">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-xl bg-[#eef2f0] p-1">
      {options.map((o) => (
        <button
          key={o}
          role="radio"
          aria-checked={value === o}
          onClick={() => onChange(o)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${value === o ? "bg-white text-brand-800 shadow-sm" : "text-muted-ink hover:text-ink"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}
