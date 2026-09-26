"use client";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Baby,
  Bell,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock3,
  Coins,
  FileInput,
  GitBranch,
  HardHat,
  HeartHandshake,
  Landmark,
  LayoutDashboard,
  Lock,
  Mail,
  MapPin,
  Menu,
  Send,
  ShieldCheck,
  Timer,
  Users,
  X,
} from "lucide-react";
import { Logo } from "./ui";

const features = [
  { icon: FileInput, title: "Enregistrement chrono", text: "Chaque arrivée et chaque départ reçoit automatiquement un numéro ARR ou DEP unique, daté et rattaché à son service." },
  { icon: GitBranch, title: "Circuit de traitement", text: "Chaque dossier est suivi étape par étape : ventilation, traitement, signature, réponse et expédition." },
  { icon: BookOpen, title: "Registres officiels", text: "Registres arrivée et départ tenus à jour en continu, imprimables et exportables en un clic." },
  { icon: Bell, title: "Notifications ciblées", text: "L’agent responsable est prévenu dès qu’un courrier lui est affecté, avec son échéance." },
  { icon: LayoutDashboard, title: "Tableaux de bord", text: "Volumes, délais, retards et répartition par service pour piloter l’activité en temps réel." },
  { icon: ShieldCheck, title: "Rôles et habilitations", text: "Cinq profils métiers, du bureau du courrier à l’agent communal, chacun avec ses propres droits." },
];

const indicateurs = [
  ["9", "services municipaux", "connectés à la plateforme"],
  ["5", "profils métiers", "avec des droits adaptés"],
  ["2", "registres officiels", "arrivée et départ"],
  ["100 %", "des courriers numérotés", "et traçables"],
];

const servicesMunicipaux = [
  { icon: Landmark, name: "Cabinet du Maire", text: "Correspondances officielles, audiences et relations institutionnelles." },
  { icon: Building2, name: "Direction générale", text: "Coordination des services et contrôle de légalité des actes." },
  { icon: Baby, name: "État civil", text: "Demandes d’actes de naissance, de mariage et de décès." },
  { icon: MapPin, name: "Urbanisme", text: "Autorisations de construire, occupation du domaine public." },
  { icon: HardHat, name: "Services techniques", text: "Voirie, assainissement, éclairage public et travaux." },
  { icon: HeartHandshake, name: "Affaires sociales", text: "Aides sociales, associations et actions de solidarité." },
  { icon: Coins, name: "Finances", text: "Budget communal, marchés publics et recettes municipales." },
  { icon: Mail, name: "Bureau du courrier", text: "Réception, enregistrement et expédition de tous les plis." },
];

const steps = [
  ["Réception", "Le bureau du courrier enregistre le pli et désigne l’agent responsable."],
  ["Ventilation", "Le dossier est transmis au service concerné avec une échéance claire."],
  ["Traitement", "L’agent instruit le dossier et prépare la réponse ou la signature."],
  ["Clôture", "Le courrier est signé, expédié puis archivé dans le registre officiel."],
];

const benefits = [
  { icon: CheckCircle2, title: "Traçabilité complète", text: "On sait à tout moment où se trouve un dossier et qui en a la charge." },
  { icon: Timer, title: "Délais maîtrisés", text: "Les échéances dépassées et les urgences remontent automatiquement." },
  { icon: Lock, title: "Accès sécurisé", text: "Connexion par compte professionnel, droits appliqués selon la fonction." },
  { icon: Users, title: "Service public renforcé", text: "Des réponses plus rapides aux citoyens, associations et partenaires." },
];

/**
 * Fades its children in as they scroll into view. Pure CSS (see .reveal in
 * globals.css): browsers without scroll-driven animations simply show the content.
 */
function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string; delay?: number }) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

function SectionIntro({ eyebrow, title, text, center, light }: { eyebrow: string; title: string; text: string; center?: boolean; light?: boolean }) {
  return (
    <Reveal className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className={`eyebrow ${light ? "!text-gold-400" : ""}`}>{eyebrow}</p>
      <h2 className={`font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${light ? "text-white" : "text-brand-950"}`}>{title}</h2>
      <p className={`mt-4 leading-7 ${light ? "text-white/65" : "text-muted-ink"}`}>{text}</p>
    </Reveal>
  );
}

function HeroPreview() {
  const rows = [
    ["ARR-2026-0142", "Demande d’autorisation de construire", "Urbanisme", "Reçu", "tag-gray"],
    ["ARR-2026-0141", "Convocation réunion de coordination", "Cabinet du Maire", "Ventilé", "tag-blue"],
    ["DEP-2026-0087", "Réponse subvention associative", "Affaires sociales", "À signer", "tag-amber"],
  ];
  return (
    <div className="relative mx-auto w-full max-w-[540px]" aria-hidden>
      <div className="absolute -inset-6 -z-10 rounded-[36px] bg-gradient-to-br from-gold-400/30 via-brand-200/40 to-transparent blur-2xl" />
      <div className="animate-float rounded-[26px] border border-white/80 bg-white/95 p-5 shadow-[0_30px_80px_-20px_rgba(10,58,38,.4)] backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow !text-[9px]">Aperçu de l’espace agents</p>
            <b className="text-sm text-ink">Bureau du courrier</b>
          </div>
          <span className="tag tag-green">En ligne</span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {(
            [
              ["Aujourd’hui", "12", Mail, "bg-brand-100 text-brand-700"],
              ["À traiter", "27", Clock3, "bg-gold-100 text-[#8a5d00]"],
              ["Expédiés", "54", Send, "bg-navy-100 text-navy-700"],
            ] as const
          ).map(([l, n, Icon, c]) => (
            <div key={l} className="rounded-2xl border border-line p-3">
              <span className={`grid size-8 place-items-center rounded-lg ${c}`}>
                <Icon size={15} />
              </span>
              <b className="font-display mt-2 block text-xl text-ink">{n}</b>
              <small className="text-[11px] text-muted-ink">{l}</small>
            </div>
          ))}
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-line">
          {rows.map(([n, o, s, st, t]) => (
            <div key={n} className="flex items-center justify-between gap-3 border-b border-line px-3.5 py-3 last:border-0">
              <span className="min-w-0">
                <b className="block text-[11px] text-muted-ink">{n}</b>
                <span className="block truncate text-xs font-semibold text-ink">{o}</span>
                <small className="text-[10px] text-muted-ink">{s}</small>
              </span>
              <span className={`tag shrink-0 ${t}`}>{st}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="animate-float-delayed absolute -bottom-6 -left-4 hidden items-center gap-3 rounded-2xl border border-white bg-white p-3 pr-5 shadow-xl sm:flex">
        <span className="grid size-9 place-items-center rounded-xl bg-brand-800 text-gold-400">
          <Bell size={16} />
        </span>
        <span>
          <b className="block text-xs text-ink">Nouveau courrier affecté</b>
          <small className="text-[10px] text-muted-ink">Échéance dans 7 jours</small>
        </span>
      </div>
    </div>
  );
}

export default function Landing({ onLogin }: { onLogin: () => void }) {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    ["#plateforme", "La plateforme"],
    ["#fonctionnalites", "Fonctionnalités"],
    ["#services", "Services"],
    ["#circuit", "Circuit"],
  ];
  return (
    <div className="min-h-screen bg-[#f7f9f8] text-ink">
      <div className="relative z-50 bg-brand-950 text-white">
        <div className="flex h-1">
          <span className="flex-1 bg-[#00853f]" />
          <span className="flex-1 bg-[#fdef42]" />
          <span className="flex-1 bg-[#e31b23]" />
        </div>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-2 text-[11px] text-white/70 sm:px-8">
          <span>République du Sénégal — Un Peuple, Un But, Une Foi</span>
          <span className="hidden sm:inline">Région de Ziguinchor · Casamance</span>
        </div>
      </div>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${scrolled || menu ? "border-b border-line bg-white/90 shadow-sm backdrop-blur-xl" : "bg-white/60 backdrop-blur"}`}
      >
        <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8" aria-label="Navigation du site">
          <a href="#accueil" aria-label="Mairie de Ziguinchor — accueil">
            <Logo subtitle="Commune de Ziguinchor" />
          </a>
          <div className="hidden items-center gap-7 lg:flex">
            {links.map(([h, l]) => (
              <a key={h} href={h} className="text-sm font-medium text-[#3f564c] transition hover:text-brand-800">
                {l}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onLogin} className="btn-main hidden sm:inline-flex">
              Espace agents <ArrowRight size={15} />
            </button>
            <button
              className="icon-btn lg:hidden"
              onClick={() => setMenu((v) => !v)}
              aria-label={menu ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={menu}
            >
              {menu ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>
        {menu && (
          <div className="animate-in fade-in slide-in-from-top-2 border-t border-line bg-white px-5 pb-5 pt-2 lg:hidden">
            {links.map(([h, l]) => (
              <a key={h} href={h} onClick={() => setMenu(false)} className="block rounded-xl px-3 py-3 text-sm font-medium text-[#3f564c] hover:bg-brand-50">
                {l}
              </a>
            ))}
            <button onClick={onLogin} className="btn-main mt-2 w-full">
              Accéder à l’espace agents <ArrowRight size={15} />
            </button>
          </div>
        )}
      </header>

      <main>
        <section id="accueil" className="relative overflow-hidden px-5 pb-24 pt-16 sm:px-8 lg:pb-28 lg:pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,#dcefe4_0%,transparent_55%),radial-gradient(ellipse_at_bottom_left,#fbf1cf_0%,transparent_45%)]" />
          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-brand-700">
                <span className="size-1.5 rounded-full bg-gold-500" />
                Plateforme numérique officielle de la commune
              </span>
              <h1 className="font-display mt-6 text-4xl font-extrabold leading-[1.08] tracking-tight text-brand-950 sm:text-5xl lg:text-[3.5rem]">
                Mairie de Ziguinchor :{" "}
                <span className="relative text-brand-600">
                  le courrier administratif
                  <svg viewBox="0 0 200 12" className="absolute -bottom-2 left-0 h-3 w-full text-gold-400" preserveAspectRatio="none" aria-hidden>
                    <path d="M2 9C50 3 150 3 198 9" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round" />
                  </svg>
                </span>{" "}
                suivi de bout en bout.
              </h1>
              <p className="mt-7 max-w-xl text-base leading-7 text-[#4c6358] sm:text-lg sm:leading-8">
                La plateforme de gestion du courrier de la Mairie de Ziguinchor
                centralise l’enregistrement, l’affectation et le suivi de chaque
                pli adressé à la commune ou émis par ses services. Les agents
                savent quoi traiter, les responsables voient où en sont les dossiers.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button onClick={onLogin} className="btn-main px-6 py-3.5 text-sm shadow-lg shadow-brand-900/20 hover:-translate-y-0.5">
                  Accéder à l’espace agents <ArrowRight size={16} />
                </button>
                <a href="#plateforme" className="btn-light px-6 py-3.5 text-sm hover:-translate-y-0.5">
                  Découvrir la plateforme
                </a>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#4c6358]">
                {["Numérotation automatique", "Registres officiels", "Accès sécurisé par rôle"].map((t) => (
                  <span key={t} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-brand-600" /> {t}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <HeroPreview />
            </div>
          </div>
        </section>

        <section aria-label="Indicateurs clés" className="relative z-10 -mt-10 px-5 sm:px-8">
          <Reveal className="mx-auto max-w-7xl">
            <dl className="grid overflow-hidden rounded-3xl border border-line bg-white shadow-[0_20px_50px_-30px_rgba(10,58,38,.4)] sm:grid-cols-2 lg:grid-cols-4">
              {indicateurs.map(([n, l, s], i) => (
                <div key={l} className={`p-7 ${i > 0 ? "border-t border-line sm:border-t-0" : ""} ${i % 2 === 1 ? "sm:border-l" : ""} ${i === 2 ? "sm:border-t lg:border-t-0 lg:border-l" : ""} ${i === 3 ? "sm:border-t lg:border-t-0" : ""}`}>
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-4xl font-extrabold text-brand-800">{n}</dd>
                  <dd className="mt-1 font-semibold text-ink">{l}</dd>
                  <dd className="text-sm text-muted-ink">{s}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </section>

        <section id="plateforme" className="scroll-mt-24 px-5 py-24 sm:px-8">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.95fr_1.05fr] lg:items-center">
            <SectionIntro
              eyebrow="La plateforme"
              title="Une administration communale plus rapide et plus transparente"
              text="La plateforme remplace les cahiers papier et les relances manuelles par un suivi partagé, fiable et consultable à tout moment par les agents habilités de la Mairie de Ziguinchor."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              {benefits.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 80}>
                  <article className="h-full rounded-3xl border border-line bg-white p-7">
                    <span className="grid size-11 place-items-center rounded-2xl bg-gold-100 text-[#8a5d00]">
                      <Icon size={20} />
                    </span>
                    <h3 className="font-display mt-4 font-bold text-brand-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-ink">{text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="fonctionnalites" className="scroll-mt-24 border-y border-line bg-white px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              center
              eyebrow="Fonctionnalités"
              title="Tout le cycle du courrier, dans un seul outil"
              text="Conçue pour le bureau du courrier et les services municipaux, du guichet jusqu’aux archives."
            />
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, text }, i) => (
                <Reveal key={title} delay={i * 70}>
                  <article className="group h-full rounded-3xl border border-line bg-[#fbfcfb] p-7 transition duration-300 hover:-translate-y-1 hover:border-brand-200 hover:bg-white hover:shadow-[0_20px_50px_-24px_rgba(10,58,38,.35)]">
                    <span className="grid size-12 place-items-center rounded-2xl bg-brand-100 text-brand-700 transition group-hover:bg-brand-800 group-hover:text-gold-400">
                      <Icon size={21} />
                    </span>
                    <h3 className="font-display mt-6 text-lg font-bold text-brand-950">{title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-ink">{text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-24 px-5 py-24 sm:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <SectionIntro
                eyebrow="Services municipaux"
                title="Tous les services de la commune, connectés"
                text="Chaque courrier est ventilé vers le service compétent, qui en assure le traitement dans les délais."
              />
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {servicesMunicipaux.map(({ icon: Icon, name, text }, i) => (
                <Reveal key={name} delay={(i % 4) * 70}>
                  <article className="flex h-full gap-4 rounded-2xl border border-line bg-white p-5 transition hover:border-brand-200 hover:shadow-md">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-navy-100 text-navy-700">
                      <Icon size={18} />
                    </span>
                    <span>
                      <h3 className="font-semibold text-brand-950">{name}</h3>
                      <p className="mt-1 text-[13px] leading-5 text-muted-ink">{text}</p>
                    </span>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section id="circuit" className="scroll-mt-24 bg-brand-900 px-5 py-24 text-white sm:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionIntro
              light
              eyebrow="Comment ça marche"
              title="Un circuit clair, en quatre étapes"
              text="Chaque étape est horodatée et visible par les personnes concernées."
            />
            <ol className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {steps.map(([t, d], i) => (
                <Reveal key={t} delay={i * 90}>
                  <li className="relative h-full rounded-3xl border border-white/10 bg-white/[.04] p-7">
                    <span className="font-display text-4xl font-extrabold text-gold-400">0{i + 1}</span>
                    <h3 className="font-display mt-4 text-lg font-bold">{t}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/60">{d}</p>
                    {i < steps.length - 1 && <ArrowRight size={18} className="absolute right-6 top-8 hidden text-white/25 lg:block" />}
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </section>

        <section className="px-5 py-24 sm:px-8">
          <Reveal className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-brand-700 to-brand-950 px-7 py-14 text-center text-white sm:px-14">
              <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-gold-400/20 blur-3xl" />
              <div className="relative mx-auto mb-6 grid size-16 place-items-center overflow-hidden rounded-2xl bg-white p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-mairie-ziguinchor.jpeg" alt="" className="h-full w-full object-contain" />
              </div>
              <h2 className="font-display relative text-3xl font-bold tracking-tight sm:text-4xl">Agents de la commune, connectez-vous</h2>
              <p className="relative mx-auto mt-4 max-w-xl text-white/70">
                Utilisez vos identifiants professionnels délivrés par la direction des systèmes d’information.
              </p>
              <button onClick={onLogin} className="btn-gold relative mt-8 px-6 py-3.5 text-sm hover:-translate-y-0.5">
                Accéder à l’espace agents <ArrowRight size={16} />
              </button>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="bg-brand-950 px-5 pt-14 text-white sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 pb-12 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo light subtitle="Commune de Ziguinchor" />
            <p className="mt-5 max-w-sm text-sm leading-6 text-white/60">
              Plateforme numérique de gestion et de suivi du courrier administratif de la Mairie de Ziguinchor.
            </p>
            <p className="font-display mt-4 text-xs font-bold uppercase tracking-[.2em] text-gold-400">Invicta Felix</p>
          </div>
          <div>
            <b className="text-sm">Navigation</b>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              {links.map(([h, l]) => (
                <li key={h}>
                  <a href={h} className="hover:text-white">{l}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <b className="text-sm">Espace agents</b>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li><button onClick={onLogin} className="hover:text-white">Se connecter</button></li>
              <li>Accès réservé aux agents habilités</li>
              <li>Assistance : direction des systèmes d’information</li>
            </ul>
          </div>
          <div>
            <b className="text-sm">Mairie de Ziguinchor</b>
            <ul className="mt-4 space-y-2.5 text-sm text-white/60">
              <li className="flex gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-gold-400" /> Hôtel de ville, Ziguinchor — Sénégal</li>
              <li className="flex gap-2"><Landmark size={15} className="mt-0.5 shrink-0 text-gold-400" /> Collectivité territoriale de la région de Ziguinchor</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 border-t border-white/10 py-6 text-xs text-white/45 sm:flex-row">
          <span>© {new Date().getFullYear()} Mairie de Ziguinchor. Tous droits réservés.</span>
          <span>République du Sénégal</span>
        </div>
      </footer>
    </div>
  );
}
