"use client";
import { useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Download,
  FilterX,
  Plus,
  Save,
  Search,
  SearchX,
} from "lucide-react";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  enRetard,
  etapeSuivante,
  FILTRE_RETARD,
  filtresVides,
  fmt,
  fmtLong,
  inDays,
  joursRestants,
  services,
  statuts,
  today,
  type AppUser,
  type Courrier,
  type CourrierFilters,
} from "@/lib/mairie";
import {
  ConfirmDialog,
  Empty,
  Field,
  PageHead,
  Pagination,
  Segmented,
  SensBadge,
  Spinner,
  StatusBadge,
  usePagination,
} from "./ui";

export function CourriersPage({
  items,
  filters,
  setFilters,
  open,
  onExport,
  canCreate,
  onCreate,
}: {
  items: Courrier[];
  filters: CourrierFilters;
  setFilters: (f: CourrierFilters) => void;
  open: (x: Courrier) => void;
  onExport: () => void;
  canCreate: boolean;
  onCreate: (x: "in" | "out") => void;
}) {
  const pg = usePagination(items, 10);
  const set = (p: Partial<CourrierFilters>) => {
    setFilters({ ...filters, ...p });
    pg.setPage(1);
  };
  const actifs =
    filters.query !== "" ||
    filters.sens !== "Tous" ||
    filters.statut !== "Tous" ||
    filters.service !== "Tous";
  return (
    <div>
      <PageHead
        eyebrow="Gestion du courrier"
        title="Registre des courriers"
        desc="Recherchez, filtrez et consultez l’ensemble des courriers arrivée et départ."
        actions={
          <>
            <button onClick={onExport} className="btn-light" disabled={!items.length}>
              <Download size={16} /> Exporter ({items.length})
            </button>
            {canCreate && (
              <button onClick={() => onCreate("in")} className="btn-main">
                <Plus size={16} /> Enregistrer un courrier
              </button>
            )}
          </>
        }
      />
      <div className="card mb-4 space-y-3 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="field-row flex-1">
            <Search size={16} />
            <input
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="N° chrono, correspondant, objet, responsable…"
              aria-label="Rechercher"
            />
          </label>
          <Segmented
            label="Sens du courrier"
            value={filters.sens}
            options={["Tous", "Arrivée", "Départ"] as const}
            onChange={(sens) => set({ sens })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select
            className="control"
            value={filters.statut}
            onChange={(e) => set({ statut: e.target.value })}
            aria-label="Filtrer par statut"
          >
            <option value="Tous">Tous les statuts</option>
            <option value={FILTRE_RETARD}>⚠ En retard</option>
            {statuts.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select
            className="control"
            value={filters.service}
            onChange={(e) => set({ service: e.target.value })}
            aria-label="Filtrer par service"
          >
            <option value="Tous">Tous les services</option>
            {services.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <button
            onClick={() => set(filtresVides)}
            disabled={!actifs}
            className="btn-ghost disabled:opacity-40"
          >
            <FilterX size={15} /> Réinitialiser
          </button>
        </div>
      </div>
      <div className="card overflow-hidden">
        {items.length === 0 ? (
          <Empty
            icon={actifs ? SearchX : undefined}
            title={actifs ? "Aucun résultat" : "Aucun courrier"}
            text={
              actifs
                ? "Aucun courrier ne correspond à ces critères. Modifiez ou réinitialisez les filtres."
                : "Les courriers enregistrés apparaîtront ici."
            }
            action={
              actifs ? (
                <button onClick={() => set(filtresVides)} className="btn-light btn-sm">
                  Réinitialiser les filtres
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="data-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>N° chrono</th>
                    <th>Date</th>
                    <th>Correspondant / objet</th>
                    <th>Service</th>
                    <th>Statut</th>
                    <th>Échéance</th>
                  </tr>
                </thead>
                <tbody>
                  {pg.pageItems.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => open(c)}
                      onKeyDown={(e) => e.key === "Enter" && open(c)}
                      tabIndex={0}
                      className="cursor-pointer"
                    >
                      <td className="whitespace-nowrap">
                        <b className="block">{c.numero}</b>
                        <span className="mt-1 flex gap-1">
                          <SensBadge sens={c.sens} />
                          {c.priorite === "Urgente" && (
                            <span className="rounded-md bg-[#fdecea] px-1.5 py-0.5 text-[10px] font-semibold text-[#a3211a]">
                              Urgent
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="whitespace-nowrap text-muted-ink">{fmt(c.date)}</td>
                      <td className="max-w-[360px]">
                        <b className="block truncate font-semibold">{c.tiers}</b>
                        <small className="line-clamp-1 text-muted-ink">{c.objet}</small>
                      </td>
                      <td className="text-muted-ink">{c.service}</td>
                      <td>
                        <StatusBadge statut={c.statut} />
                      </td>
                      <td className="whitespace-nowrap">
                        <Echeance c={c} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <ul className="divide-y divide-line md:hidden">
              {pg.pageItems.map((c) => (
                <li key={c.id}>
                  <button onClick={() => open(c)} className="w-full space-y-2 p-4 text-left hover:bg-[#f9fbfa]">
                    <span className="flex items-center justify-between gap-2">
                      <b className="text-sm">{c.numero}</b>
                      <SensBadge sens={c.sens} />
                    </span>
                    <b className="block text-sm font-semibold text-ink">{c.objet}</b>
                    <small className="block text-xs text-muted-ink">
                      {c.tiers} · {c.service}
                    </small>
                    <span className="flex items-center justify-between gap-2">
                      <StatusBadge statut={c.statut} />
                      <Echeance c={c} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <Pagination {...pg} label="courriers" />
          </>
        )}
      </div>
    </div>
  );
}

export function Echeance({ c }: { c: Courrier }) {
  if (enRetard(c))
    return (
      <span className="text-xs font-semibold text-[#c2261d]">
        {fmt(c.echeance)}
        <small className="block font-medium">{-joursRestants(c)} j de retard</small>
      </span>
    );
  return <span className="text-xs text-muted-ink">{fmt(c.echeance)}</span>;
}

export function MailForm({
  sens,
  onSubmit,
  users,
}: {
  sens: "Arrivée" | "Départ";
  onSubmit: (f: FormData, s: "Arrivée" | "Départ") => Promise<void>;
  users: AppUser[];
}) {
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
          await onSubmit(new FormData(e.currentTarget), sens);
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-4"
    >
      <p className="eyebrow">Identification</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={sens === "Arrivée" ? "Date de réception" : "Date d’envoi"} required>
          <input name="date" type="date" defaultValue={today()} required />
        </Field>
        <Field label="Échéance de traitement" required>
          <input name="echeance" type="date" defaultValue={inDays(7)} required />
        </Field>
        <Field label={sens === "Arrivée" ? "Expéditeur" : "Destinataire"} wide required>
          <input name="tiers" placeholder="Citoyen, administration, entreprise…" required />
        </Field>
        <Field label="Objet" wide required>
          <textarea name="objet" rows={3} placeholder="Objet administratif précis" required />
        </Field>
      </div>
      <p className="eyebrow border-t border-line pt-5">Traitement</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={sens === "Arrivée" ? "Type de courrier" : "Mode d’envoi"}>
          <select name="type">
            {(sens === "Arrivée"
              ? ["Lettre", "Recommandé", "Colis", "Email", "Dépôt physique"]
              : ["Courrier simple", "Recommandé avec AR", "Email", "Remise en main propre"]
            ).map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        <Field label={sens === "Arrivée" ? "Service destinataire" : "Service émetteur"}>
          <select name="service">
            {services.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </Field>
        {sens === "Arrivée" && (
          <Field label="Agent responsable" required hint="L’agent sera notifié de cette affectation.">
            <select name="responsable" required defaultValue="">
              <option value="" disabled>
                Sélectionner un agent
              </option>
              {users
                .filter((u) => u.actif && u.role !== "Administrateur système")
                .map((u) => (
                  <option key={u.id} value={u.nom}>
                    {u.nom} — {u.service}
                  </option>
                ))}
            </select>
          </Field>
        )}
        <Field label="Priorité">
          <select name="priorite">
            <option>Normale</option>
            <option>Urgente</option>
          </select>
        </Field>
        {sens === "Départ" && (
          <Field label="Signataire">
            <select name="signataire">
              <option>Maire</option>
              <option>Adjoint au Maire</option>
              <option>DGS</option>
              <option>Chef de service municipal</option>
            </select>
          </Field>
        )}
        <Field label="Pièces jointes" wide hint="PDF, JPG ou PNG. Les fichiers ne sont pas encore transmis au serveur.">
          <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
        </Field>
      </div>
      <div className="flex justify-end gap-2 border-t border-line pt-5">
        <button disabled={busy} className="btn-main">
          {busy ? <Spinner className="size-4" /> : <CheckCircle2 size={17} />}
          {busy ? "Enregistrement…" : "Enregistrer dans le registre"}
        </button>
      </div>
    </form>
  );
}

export function CourrierDetail({
  c,
  onUpdate,
}: {
  c: Courrier;
  onUpdate: (patch: Partial<Courrier>) => Promise<boolean>;
}) {
  const [notes, setNotes] = useState(c.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const next = etapeSuivante(c);
  const flow = c.sens === "Départ" ? statuts : statuts.filter((x) => x !== "En préparation");
  const idx = flow.indexOf(c.statut);
  const changeStatut = (s: string) => {
    if (s === c.statut) return;
    if (s === "Archivé") setConfirmArchive(true);
    else void onUpdate({ statut: s });
  };
  return (
    <>
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <SensBadge sens={c.sens} />
          {c.priorite === "Urgente" && <span className="tag tag-red">Urgent</span>}
          <StatusBadge statut={c.statut} />
        </div>
        <DialogTitle className="font-display pt-1 text-xl">{c.numero}</DialogTitle>
        <DialogDescription>
          {c.sens === "Arrivée" ? "Reçu" : "Émis"} le {fmtLong(c.date)}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-2xl border border-line bg-brand-50/60 p-5">
        <p className="eyebrow">Objet</p>
        <h3 className="mt-1 font-semibold leading-6 text-ink">{c.objet}</h3>
        <p className="mt-1 text-sm text-muted-ink">
          {c.sens === "Arrivée" ? "Expéditeur" : "Destinataire"} : {c.tiers}
        </p>
      </div>

      <div>
        <p className="mb-3 text-xs font-semibold text-[#44584f]">Avancement du dossier</p>
        <ol className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {flow.map((s, i) => (
            <li key={s} className="min-w-[82px] flex-1">
              <div
                className={`h-1.5 rounded-full ${i <= idx ? "bg-brand-600" : "bg-[#e3eae6]"} ${i === idx ? "ring-2 ring-brand-200" : ""}`}
              />
              <span
                className={`mt-1.5 flex items-start gap-1 text-[10.5px] leading-tight ${i === idx ? "font-bold text-brand-800" : i < idx ? "text-ink/70" : "text-[#9aaba3]"}`}
              >
                {i < idx && <Check size={11} className="mt-px shrink-0" />}
                {s}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl border border-line p-4 text-sm sm:grid-cols-3">
        <Info l="Service" v={c.service} />
        <Info l="Responsable" v={c.responsable} />
        <Info l="Priorité" v={c.priorite} />
        <Info
          l="Échéance"
          v={fmt(c.echeance)}
          danger={enRetard(c)}
          sub={enRetard(c) ? `${-joursRestants(c)} j de retard` : undefined}
        />
        <Info l="Mode / type" v={c.type} />
        <Info l="Signataire" v={c.signataire || "—"} />
      </dl>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#44584f]">Statut</span>
          <select className="control" value={c.statut} onChange={(e) => changeStatut(e.target.value)}>
            {statuts.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {next && (
          <button onClick={() => changeStatut(next)} className="btn-main">
            Passer à « {next} » <ArrowRight size={15} />
          </button>
        )}
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setSaving(true);
          await onUpdate({ notes });
          setSaving(false);
        }}
        className="space-y-2"
      >
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#44584f]">Annotation / instructions</span>
          <textarea
            className="control min-h-[84px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Instructions, compte rendu, suite à donner…"
          />
        </label>
        <div className="flex justify-end">
          <button disabled={saving || notes === (c.notes ?? "")} className="btn-light btn-sm">
            {saving ? <Spinner className="size-3.5" /> : <Save size={14} />} Enregistrer l’annotation
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archiver ce courrier ?"
        description={`${c.numero} sera classé comme archivé et ne figurera plus parmi les dossiers actifs.`}
        confirmLabel="Archiver"
        onConfirm={async () => {
          await onUpdate({ statut: "Archivé" });
        }}
      />
    </>
  );
}

function Info({ l, v, sub, danger }: { l: string; v: string; sub?: string; danger?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-muted-ink">{l}</dt>
      <dd className={`truncate font-semibold ${danger ? "text-[#c2261d]" : "text-ink"}`}>{v}</dd>
      {sub && <dd className="text-[11px] font-medium text-[#c2261d]">{sub}</dd>}
    </div>
  );
}
