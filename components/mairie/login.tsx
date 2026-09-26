"use client";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { login as apiLogin } from "@/lib/api";
import type { AppUser } from "@/lib/mairie";
import { Logo, Spinner } from "./ui";

export function Login({
  onLogin,
  onBack,
}: {
  onLogin: (user: AppUser) => void | Promise<void>;
  onBack: () => void;
}) {
  const [forgot, setForgot] = useState(false),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false),
    [show, setShow] = useState(false);
  return (
    <main className="grid min-h-screen bg-surface lg:grid-cols-[1fr_1.05fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 top-1/3 size-96 rounded-full bg-gold-400/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-gradient-to-r from-brand-500 via-gold-400 to-navy-700" />
        <Logo light subtitle="Commune de Ziguinchor · Sénégal" />
        <div className="relative max-w-md">
          <p className="eyebrow !text-gold-400">Espace agents</p>
          <h2 className="font-display mt-3 text-4xl font-bold leading-tight tracking-tight">
            Le courrier de la commune, suivi de bout en bout.
          </h2>
          <ul className="mt-8 space-y-4 text-white/75">
            {[
              "Enregistrement chrono automatique",
              "Circuit de traitement et échéances",
              "Registres officiels toujours à jour",
            ].map((t) => (
              <li key={t} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-gold-400" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-white/45">
          © {new Date().getFullYear()} Mairie de Ziguinchor — Invicta Felix
        </p>
      </section>
      <section className="flex flex-col px-5 py-6 sm:px-10">
        <button onClick={onBack} className="btn-ghost w-fit">
          <ArrowLeft size={16} /> Retour à l’accueil
        </button>
        <div className="animate-in fade-in slide-in-from-bottom-4 m-auto w-full max-w-md py-10 duration-500">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {forgot ? "Mot de passe oublié" : "Connexion"}
          </h1>
          <p className="mt-2 text-sm text-muted-ink">
            {forgot
              ? "La réinitialisation est assurée par la direction des systèmes d’information."
              : "Accédez à l’espace administratif sécurisé de la Mairie de Ziguinchor."}
          </p>
          <div className="mt-8">
            {!forgot ? (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget),
                    email = String(f.get("email")).trim().toLowerCase(),
                    password = String(f.get("password"));
                  setLoading(true);
                  setError("");
                  try {
                    const { user } = await apiLogin(email, password);
                    await onLogin(user);
                  } catch (err) {
                    setError(
                      err instanceof TypeError
                        ? "Serveur injoignable. Vérifiez votre connexion ou réessayez dans un instant."
                        : err instanceof Error
                          ? err.message
                          : "Connexion impossible.",
                    );
                  } finally {
                    setLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <label className="block">
                  <span className="mb-1.5 block text-xs font-semibold text-[#44584f]">Adresse professionnelle</span>
                  <span className="field-row py-3">
                    <Mail size={16} />
                    <input name="email" type="email" autoComplete="email" placeholder="nom@mairie.sn" required />
                  </span>
                </label>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-[#44584f]">
                    <label htmlFor="login-password">Mot de passe</label>
                    <button type="button" onClick={() => setForgot(true)} className="font-semibold text-brand-700 hover:underline">
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <span className="field-row py-3">
                    <Lock size={16} />
                    <input id="login-password" name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Votre mot de passe" required />
                    <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? "Masquer le mot de passe" : "Afficher le mot de passe"} className="text-muted-ink hover:text-ink">
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </span>
                </div>
                {error && (
                  <p role="alert" className="rounded-xl border border-[#f6cdc9] bg-[#fdecea] p-3 text-xs font-medium text-[#a3211a]">
                    {error}
                  </p>
                )}
                <button disabled={loading} className="btn-main w-full py-3">
                  {loading && <Spinner className="size-4" />}
                  {loading ? "Connexion…" : "Se connecter"}
                </button>
              </form>
            ) : (
              <div className="rounded-2xl border border-line bg-white p-5 text-sm">
                <p className="leading-6 text-ink/80">
                  Contactez la direction des systèmes d’information de la mairie en
                  précisant votre adresse professionnelle. Un nouveau mot de passe
                  vous sera communiqué ; pensez à le modifier depuis « Mon profil »
                  après connexion.
                </p>
                <button onClick={() => setForgot(false)} className="btn-light mt-4">
                  <ArrowLeft size={15} /> Retour à la connexion
                </button>
              </div>
            )}
          </div>
          <p className="mt-8 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-xs text-muted-ink">
            <Lock size={14} className="shrink-0 text-brand-700" />
            Accès réservé aux agents habilités de la commune. Identifiants délivrés par la DSI.
          </p>
        </div>
      </section>
    </main>
  );
}
