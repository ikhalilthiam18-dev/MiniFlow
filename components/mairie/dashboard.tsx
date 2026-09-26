"use client";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileInput,
  FileOutput,
  FileSignature,
  Mail,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  enRetard,
  FILTRE_RETARD,
  fmt,
  isClos,
  isoDate,
  joursRestants,
  roleCourt,
  rolesVueGlobale,
  type Courrier,
  type CourrierFilters,
  type Role,
  type Stats,
} from "@/lib/mairie";
import { Empty, SectionTitle, SensBadge, StatCard, StatusBadge } from "./ui";
import type { Tab } from "./shell";

export const chartColors = ["#13603f", "#2a9466", "#f2c230", "#243f8f", "#8fb9a6", "#b7791f"];
export const tooltipStyle = {
  contentStyle: {
    borderRadius: 12,
    border: "1px solid #e1e8e4",
    boxShadow: "0 8px 24px rgb(16 40 28 / .08)",
    fontSize: 12,
  },
};

export function Dashboard({
  stats,
  items,
  userName,
  role,
  canCreate,
  open,
  onCreate,
  onNavigate,
  onFilter,
}: {
  stats: Stats;
  items: Courrier[];
  userName: string;
  role: Role;
  canCreate: boolean;
  open: (x: Courrier) => void;
  onCreate: (x: "in" | "out") => void;
  onNavigate: (t: Tab) => void;
  onFilter: (f: Partial<CourrierFilters>) => void;
}) {
  const now = new Date();
  const actifs = items.filter((x) => !isClos(x));
  const urgent = actifs
    .filter((x) => x.priorite === "Urgente" || enRetard(x))
    .sort((a, b) => a.echeance.localeCompare(b.echeance));
  const monthly = Array.from({ length: 6 }, (_, k) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + k, 1);
    const key = isoDate(d).slice(0, 7);
    const ofMonth = items.filter((x) => x.date.startsWith(key));
    return {
      m: d.toLocaleDateString("fr-FR", { month: "short" }),
      Arrivées: ofMonth.filter((x) => x.sens === "Arrivée").length,
      Départs: ofMonth.filter((x) => x.sens === "Départ").length,
    };
  });
  const counts = new Map<string, number>();
  actifs.forEach((x) => counts.set(x.service, (counts.get(x.service) ?? 0) + 1));
  const byService = [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);
  const tauxCloture = items.length ? Math.round((stats.traites / items.length) * 100) : 0;
  const tauxDelais = actifs.length
    ? Math.round(((actifs.length - stats.retard) / actifs.length) * 100)
    : 100;
  const global = rolesVueGlobale.includes(role);
  const focus = global
    ? [...items].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id).slice(0, 5)
    : [...actifs].sort((a, b) => a.echeance.localeCompare(b.echeance)).slice(0, 6);
  const dateLabel = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-brand-800 via-brand-900 to-brand-950 p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-1 w-full bg-gradient-to-r from-transparent via-gold-400/60 to-transparent" />
        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm capitalize text-white/65">{dateLabel}</p>
            <h2 className="font-display mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
              Bonjour, {userName.split(" ")[0]}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              {stats.attente === 0
                ? "Aucun dossier en attente. Tout est à jour."
                : `${stats.attente} dossier${stats.attente > 1 ? "s" : ""} en cours${stats.retard ? `, dont ${stats.retard} en retard` : ""}.`}{" "}
              <span className="text-white/55">Profil : {roleCourt[role]}.</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canCreate && (
              <>
                <button onClick={() => onCreate("in")} className="btn-gold">
                  <FileInput size={16} /> Courrier arrivée
                </button>
                <button
                  onClick={() => onCreate("out")}
                  className="btn-light border-white/20 bg-white/10 text-white hover:!bg-white/20"
                >
                  <FileOutput size={16} /> Courrier départ
                </button>
              </>
            )}
            <button
              onClick={() => onNavigate("circuit")}
              className="btn-light border-white/20 bg-white/10 text-white hover:!bg-white/20"
            >
              Circuit de traitement <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5 [&>*:last-child]:col-span-2 xl:[&>*:last-child]:col-span-1">
        <StatCard label="Courriers du jour" value={stats.jour} icon={Mail} tone="green" hint="Enregistrés aujourd’hui" />
        <StatCard
          label="À traiter"
          value={stats.attente}
          icon={Clock3}
          tone="amber"
          hint="Dossiers non clôturés"
          onClick={() => onNavigate("circuit")}
        />
        <StatCard
          label="En retard"
          value={stats.retard}
          icon={AlertTriangle}
          tone="red"
          hint="Échéance dépassée"
          onClick={() => onFilter({ statut: FILTRE_RETARD })}
        />
        <StatCard
          label="À signer"
          value={stats.signature}
          icon={FileSignature}
          tone="blue"
          hint="En attente de signature"
          onClick={() => onFilter({ statut: "En attente de signature" })}
        />
        <StatCard label="Traités / clôturés" value={stats.traites} icon={CheckCircle2} tone="green" hint={`${tauxCloture} % du total`} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="card p-6">
          <SectionTitle
            title="Volume mensuel"
            desc="Courriers arrivée et départ enregistrés"
            action={<span className="tag">6 derniers mois</span>}
          />
          <div className="mt-5 h-[260px]">
            <ResponsiveContainer>
              <BarChart data={monthly} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eeeb" />
                <XAxis dataKey="m" axisLine={false} tickLine={false} fontSize={11} />
                <YAxis axisLine={false} tickLine={false} fontSize={11} allowDecimals={false} width={28} />
                <Tooltip cursor={{ fill: "#f1f8f4" }} {...tooltipStyle} />
                <Bar dataKey="Arrivées" fill="#13603f" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="Départs" fill="#f2c230" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex gap-5 text-xs text-muted-ink">
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-brand-700" /> Arrivées</span>
            <span className="flex items-center gap-2"><span className="size-2.5 rounded-sm bg-gold-400" /> Départs</span>
          </div>
        </div>
        <div className="card flex flex-col gap-5 p-6">
          <SectionTitle title="Indicateurs de suivi" desc="Performance du traitement du courrier" />
          <Progress label="Taux de clôture" value={tauxCloture} hint={`${stats.traites} sur ${items.length} courriers`} />
          <Progress
            label="Dossiers dans les délais"
            value={tauxDelais}
            hint={`${actifs.length - stats.retard} sur ${actifs.length} dossiers actifs`}
            tone={tauxDelais < 60 ? "red" : tauxDelais < 85 ? "amber" : "green"}
          />
          <div className="grid grid-cols-2 gap-3">
            <MiniStat label="Urgents actifs" value={actifs.filter((x) => x.priorite === "Urgente").length} />
            <MiniStat label="Échéance < 3 j" value={actifs.filter((x) => { const j = joursRestants(x); return j >= 0 && j <= 3; }).length} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-6 py-4">
            <SectionTitle
              title="Alertes et échéances"
              desc="Dossiers urgents ou dont le délai est dépassé"
              action={
                <span className={`tag ${urgent.length ? "tag-red" : "tag-green"}`}>
                  {urgent.length} alerte{urgent.length > 1 ? "s" : ""}
                </span>
              }
            />
          </div>
          {urgent.length === 0 ? (
            <Empty icon={CheckCircle2} title="Aucune alerte" text="Tous les dossiers actifs sont dans les délais." />
          ) : (
            <ul>
              {urgent.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => open(c)}
                    className="flex w-full items-center gap-4 border-b border-line px-6 py-3.5 text-left transition last:border-0 hover:bg-[#f9fbfa]"
                  >
                    <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${enRetard(c) ? "bg-[#fdecea] text-[#a3211a]" : "bg-gold-100 text-[#8a5d00]"}`}>
                      {enRetard(c) ? <CalendarClock size={16} /> : <AlertTriangle size={16} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-muted-ink">
                        {c.numero} <SensBadge sens={c.sens} />
                      </span>
                      <b className="block truncate text-sm text-ink">{c.objet}</b>
                      <small className="block truncate text-xs text-muted-ink">{c.service} · {c.responsable}</small>
                    </span>
                    <span className={`tag shrink-0 ${enRetard(c) ? "tag-red" : "tag-amber"}`}>
                      {enRetard(c) ? `${-joursRestants(c)} j de retard` : "Urgent"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {urgent.length > 6 && (
            <button
              onClick={() => onFilter({ statut: FILTRE_RETARD })}
              className="w-full border-t border-line py-3 text-xs font-semibold text-brand-700 hover:bg-brand-50"
            >
              Voir tous les dossiers en retard
            </button>
          )}
        </div>
        <div className="card p-6">
          <SectionTitle title="Répartition par service" desc="Dossiers actifs par service" />
          {byService.length === 0 ? (
            <Empty text="Aucun dossier actif pour le moment." />
          ) : (
            <>
              <div className="relative h-[190px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={byService} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={3} stroke="none">
                      {byService.map((_, i) => (
                        <Cell key={i} fill={chartColors[i]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                  <span>
                    <b className="font-display block text-2xl text-ink">{actifs.length}</b>
                    <small className="text-[11px] text-muted-ink">actifs</small>
                  </span>
                </div>
              </div>
              <ul className="mt-3 space-y-2 text-xs">
                {byService.map((x, i) => (
                  <li key={x.name}>
                    <button
                      onClick={() => onFilter({ service: x.name })}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-0.5 hover:bg-brand-50"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-full" style={{ background: chartColors[i] }} />
                        <span className="truncate">{x.name}</span>
                      </span>
                      <b>{x.value}</b>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="border-b border-line px-6 py-4">
          <SectionTitle
            title={global ? "Derniers courriers enregistrés" : "Mes dossiers à traiter"}
            desc={global ? "Les cinq enregistrements les plus récents" : "Classés par échéance la plus proche"}
            action={
              <button onClick={() => onNavigate("courriers")} className="btn-ghost btn-sm">
                Tout voir <ArrowRight size={14} />
              </button>
            }
          />
        </div>
        {focus.length === 0 ? (
          <Empty text={global ? "Aucun courrier enregistré." : "Aucun dossier ne vous est actuellement affecté."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table min-w-[720px]">
              <thead>
                <tr>
                  <th>N° chrono</th>
                  <th>Objet</th>
                  <th>Service</th>
                  <th>Statut</th>
                  <th>Échéance</th>
                </tr>
              </thead>
              <tbody>
                {focus.map((c) => (
                  <tr key={c.id} onClick={() => open(c)} className="cursor-pointer">
                    <td className="whitespace-nowrap font-semibold">{c.numero}</td>
                    <td className="max-w-[320px]">
                      <b className="block truncate font-medium">{c.objet}</b>
                      <small className="text-muted-ink">{c.tiers}</small>
                    </td>
                    <td className="text-muted-ink">{c.service}</td>
                    <td><StatusBadge statut={c.statut} /></td>
                    <td className={enRetard(c) ? "font-semibold text-[#c2261d]" : ""}>{fmt(c.echeance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Progress({
  label,
  value,
  hint,
  tone = "green",
}: {
  label: string;
  value: number;
  hint: string;
  tone?: "green" | "amber" | "red";
}) {
  const bar = { green: "bg-brand-600", amber: "bg-gold-400", red: "bg-[#e5484d]" }[tone];
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-ink">{label}</span>
        <b className="font-display text-lg text-ink">{value} %</b>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf2ef]"
      >
        <div className={`h-full rounded-full ${bar} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-1.5 text-[11.5px] text-muted-ink">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-surface p-3.5">
      <b className="font-display block text-xl text-ink">{value}</b>
      <small className="text-[11.5px] text-muted-ink">{label}</small>
    </div>
  );
}
