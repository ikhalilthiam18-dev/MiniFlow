"use client";
import { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Lock, RefreshCw, X } from "lucide-react";
import { changePassword } from "@/lib/api";
import type { Notify } from "@/lib/mairie";
import { Spinner } from "./ui";

/** Client-side mirror of the Django validators (the API stays the authority). */
function regles(pwd: string, confirm: string) {
  return [
    { ok: pwd.length >= 8, label: "Au moins 8 caractères" },
    { ok: pwd.length > 0 && !/^\d+$/.test(pwd), label: "Pas uniquement des chiffres" },
    { ok: /[a-zA-Z]/.test(pwd) && /\d/.test(pwd), label: "Lettres et chiffres (recommandé)", optional: true },
    { ok: pwd.length > 0 && pwd === confirm, label: "Les deux saisies correspondent" },
  ];
}

function force(pwd: string) {
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  if (!pwd) return { niveau: 0, label: "", color: "" };
  if (score <= 2) return { niveau: 1, label: "Faible", color: "bg-[#e5484d]" };
  if (score <= 3) return { niveau: 2, label: "Moyen", color: "bg-gold-400" };
  return { niveau: 3, label: "Robuste", color: "bg-brand-600" };
}

/** Readable random password, e.g. "Zig-kbtm-4827". */
export function genererMotDePasse() {
  const lettres = "abcdefghjkmnpqrstuvwxyz";
  const r = new Uint32Array(8);
  crypto.getRandomValues(r);
  const mot = Array.from(r.slice(0, 4), (n) => lettres[n % lettres.length]).join("");
  const chiffres = Array.from(r.slice(4), (n) => n % 10).join("");
  return `Zig-${mot}-${chiffres}`;
}

/**
 * New password + confirmation with live rules. Field names are `new` and
 * `confirm`; `onValidChange` reports whether the mandatory rules are met.
 */
export function PasswordFields({
  onValidChange,
  withGenerator = false,
  label = "Nouveau mot de passe",
}: {
  onValidChange: (valid: boolean) => void;
  withGenerator?: boolean;
  label?: string;
}) {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const liste = regles(pwd, confirm);
  const f = force(pwd);
  const update = (p: string, c: string) => {
    setPwd(p);
    setConfirm(c);
    onValidChange(regles(p, c).every((x) => x.ok || x.optional));
  };
  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="pwd-new" className="text-xs font-semibold text-[#44584f]">
            {label}
          </label>
          {withGenerator && (
            <button
              type="button"
              onClick={() => {
                const g = genererMotDePasse();
                setShow(true);
                update(g, g);
              }}
              className="flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
            >
              <RefreshCw size={12} /> Générer
            </button>
          )}
        </div>
        <span className="field-row">
          <KeyRound size={16} />
          <input
            id="pwd-new"
            name="new"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={pwd}
            onChange={(e) => update(e.target.value, confirm)}
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            className="text-muted-ink hover:text-ink"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
        {pwd && (
          <div className="mt-2 flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3].map((n) => (
                <span key={n} className={`h-1 flex-1 rounded-full ${n <= f.niveau ? f.color : "bg-[#e3eae6]"}`} />
              ))}
            </div>
            <span className="text-[11px] font-semibold text-muted-ink">{f.label}</span>
          </div>
        )}
      </div>
      <div>
        <label htmlFor="pwd-confirm" className="mb-1.5 block text-xs font-semibold text-[#44584f]">
          Confirmer le mot de passe
        </label>
        <span className="field-row">
          <Lock size={16} />
          <input
            id="pwd-confirm"
            name="confirm"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => update(pwd, e.target.value)}
            required
          />
        </span>
      </div>
      <ul className="grid gap-1 rounded-xl bg-surface p-3 text-xs sm:grid-cols-2" aria-label="Règles du mot de passe">
        {liste.map((r) => (
          <li key={r.label} className={`flex items-center gap-1.5 ${r.ok ? "text-brand-700" : "text-muted-ink"}`}>
            {r.ok ? <Check size={13} /> : <X size={13} className="opacity-60" />}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Self-service password change for the signed-in user. */
export function ChangePasswordForm({
  onDone,
  notify,
  footer,
}: {
  onDone: () => void;
  notify: Notify;
  footer?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  const [valid, setValid] = useState(false);
  const [error, setError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [key, setKey] = useState(0);
  return (
    <form
      key={key}
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const current = String(f.get("current"));
        const n1 = String(f.get("new"));
        if (current === n1) {
          setError("Le nouveau mot de passe doit être différent de l’actuel.");
          return;
        }
        setBusy(true);
        setError("");
        try {
          await changePassword(current, n1);
          setKey((k) => k + 1);
          setValid(false);
          onDone();
          notify("Mot de passe modifié. Utilisez-le lors de votre prochaine connexion.");
        } catch (err) {
          setError(
            err instanceof Error && err.message !== "Erreur serveur"
              ? err.message
              : "Impossible de modifier le mot de passe. Réessayez.",
          );
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label htmlFor="pwd-current" className="mb-1.5 block text-xs font-semibold text-[#44584f]">
          Mot de passe actuel
        </label>
        <span className="field-row">
          <Lock size={16} />
          <input
            id="pwd-current"
            name="current"
            type={showCurrent ? "text" : "password"}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            aria-label={showCurrent ? "Masquer le mot de passe actuel" : "Afficher le mot de passe actuel"}
            className="text-muted-ink hover:text-ink"
          >
            {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </span>
      </div>
      <PasswordFields onValidChange={setValid} />
      {error && (
        <p role="alert" className="rounded-xl border border-[#f6cdc9] bg-[#fdecea] p-3 text-xs font-medium text-[#a3211a]">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse justify-between gap-2 pt-1 sm:flex-row sm:items-center">
        {footer ?? <span />}
        <button disabled={busy || !valid} className="btn-main">
          {busy && <Spinner className="size-4" />} Mettre à jour le mot de passe
        </button>
      </div>
    </form>
  );
}
