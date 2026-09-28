"use client";
import { useEffect, useState } from "react";
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
  History,
  Paperclip,
  Pencil,
  Printer,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  deletePiece,
  downloadPiece,
  fetchHistorique,
  fetchPieces,
  uploadPieces,
  type ApiHistorique,
  type ApiPiece,
} from "@/lib/api";
import { AccuseReception, usePrint } from "./documents";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  enRetard,
  etapeSuivante,
  FILTRE_RETARD,
  filtresVides,
  fmt,
  fmtDateTime,
  fmtLong,
  inDays,
  joursRestants,
  peutDonnerStatut,
  statuts,
  today,
  type AppUser,
  type Courrier,
  type CourrierFilters,
  type Notify,
  type Role,
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
  services,
}: {
  items: Courrier[];
  services: string[];
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
  services,
}: {
  sens: "Arrivée" | "Départ";
  onSubmit: (f: FormData, s: "Arrivée" | "Départ") => Promise<void>;
  users: AppUser[];
  services: string[];
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
        <Field label="Pièces jointes" wide hint="PDF, JPG ou PNG • 10 Mo maximum par fichier, 10 fichiers au plus.">
          <input name="fichiers" type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
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
  canEdit,
  users,
  services,
  userName,
  role,
  notify,
}: {
  c: Courrier;
  onUpdate: (patch: Partial<Courrier>) => Promise<boolean>;
  /** Rôles autorisés à modifier le contenu (les agents : statut et annotations). */
  canEdit: boolean;
  users: AppUser[];
  services: string[];
  userName: string;
  role: Role;
  notify: Notify;
}) {
  const [edition, setEdition] = useState(false);
  const { zone: zoneImpression, imprimer } = usePrint();
  const [notes, setNotes] = useState(c.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [historique, setHistorique] = useState<ApiHistorique[] | null>(null);
  const [histErreur, setHistErreur] = useState(false);
  useEffect(() => {
    // Recharge l'historique à l'ouverture et après chaque changement de statut.
    let actif = true;
    fetchHistorique(c.id)
      .then((h) => actif && setHistorique(h))
      .catch(() => actif && setHistErreur(true));
    return () => {
      actif = false;
    };
  }, [c.id, c.statut]);
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
        <div className="flex flex-wrap gap-2 pt-2">
          {canEdit && !edition && (
            <button onClick={() => setEdition(true)} className="btn-light btn-sm">
              <Pencil size={14} /> Modifier
            </button>
          )}
          {c.sens === "Arrivée" && (
            <button onClick={() => imprimer(<AccuseReception c={c} />)} className="btn-light btn-sm">
              <Printer size={14} /> Accusé de réception
            </button>
          )}
        </div>
      </DialogHeader>

      {edition && (
        <EditionCourrier
          c={c}
          users={users}
          services={services}
          onCancel={() => setEdition(false)}
          onSave={async (patch) => {
            if (await onUpdate(patch)) setEdition(false);
          }}
        />
      )}

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

      <section>
        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#44584f]">
          <History size={14} className="text-brand-700" /> Historique des statuts
        </p>
        {histErreur ? (
          <p className="text-xs text-muted-ink">Historique indisponible pour le moment.</p>
        ) : historique === null ? (
          <p className="flex items-center gap-2 text-xs text-muted-ink">
            <Spinner className="size-3.5" /> Chargement…
          </p>
        ) : historique.length === 0 ? (
          <p className="text-xs text-muted-ink">
            Aucun changement enregistré (dossier créé avant la mise en place de l’historique).
          </p>
        ) : (
          <ol className="space-y-2 border-l-2 border-brand-100 pl-4">
            {historique.map((h) => (
              <li key={h.id} className="relative text-sm">
                <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full border-2 border-white bg-brand-600" />
                <b className="text-ink">
                  {h.ancien_statut ? `${h.ancien_statut} → ${h.nouveau_statut}` : `Enregistré : ${h.nouveau_statut}`}
                </b>
                <span className="block text-xs text-muted-ink">
                  {fmtDateTime(h.date)}
                  {h.auteur ? ` · ${h.auteur}` : ""}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>

      <PiecesJointes courrierId={c.id} userName={userName} role={role} notify={notify} />

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-[#44584f]">Statut</span>
          <select className="control" value={c.statut} onChange={(e) => changeStatut(e.target.value)}>
            {/* Étapes propres au sens du courrier (« En préparation » : départs seulement). */}
            {/* Seules les étapes permises au rôle sont proposées (le statut actuel reste affiché). */}
            {flow
              .filter((x) => x === c.statut || peutDonnerStatut(role, x))
              .concat(flow.includes(c.statut) ? [] : [c.statut])
              .map((x) => (
                <option key={x}>{x}</option>
              ))}
          </select>
        </label>
        {next && peutDonnerStatut(role, next) && (
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
      {zoneImpression}
    </>
  );
}

function EditionCourrier({
  c,
  users,
  services,
  onCancel,
  onSave,
}: {
  c: Courrier;
  users: AppUser[];
  services: string[];
  onCancel: () => void;
  onSave: (patch: Partial<Courrier>) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  // Le service actuel reste proposé même s'il a été désactivé depuis.
  const choixServices = services.includes(c.service) ? services : [c.service, ...services];
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const patch: Partial<Courrier> = {
          tiers: String(f.get("tiers")),
          objet: String(f.get("objet")),
          service: String(f.get("service")),
          type: String(f.get("type")),
          priorite: String(f.get("priorite")) as Courrier["priorite"],
          echeance: String(f.get("echeance")),
          responsable: String(f.get("responsable")),
          signataire: String(f.get("signataire") ?? c.signataire ?? ""),
        };
        // N'envoyer que ce qui a changé (l'historique et les notifications en dépendent).
        const modifie = Object.fromEntries(
          Object.entries(patch).filter(([k, v]) => v !== (c[k as keyof Courrier] ?? "")),
        ) as Partial<Courrier>;
        if (!Object.keys(modifie).length) return onCancel();
        setBusy(true);
        try {
          await onSave(modifie);
        } finally {
          setBusy(false);
        }
      }}
      className="grid gap-3 rounded-2xl border border-brand-200 bg-brand-50/40 p-4 sm:grid-cols-2"
    >
      <p className="eyebrow sm:col-span-2">Modifier le courrier</p>
      <Field label={c.sens === "Arrivée" ? "Expéditeur" : "Destinataire"} wide required>
        <input name="tiers" defaultValue={c.tiers} required />
      </Field>
      <Field label="Objet" wide required>
        <textarea name="objet" rows={2} defaultValue={c.objet} required />
      </Field>
      <Field label="Service">
        <select name="service" defaultValue={c.service}>
          {choixServices.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </Field>
      <Field label="Échéance" required>
        <input name="echeance" type="date" defaultValue={c.echeance} required />
      </Field>
      <Field label={c.sens === "Arrivée" ? "Type de courrier" : "Mode d’envoi"}>
        <input name="type" defaultValue={c.type} required />
      </Field>
      <Field label="Priorité">
        <select name="priorite" defaultValue={c.priorite}>
          <option>Normale</option>
          <option>Urgente</option>
        </select>
      </Field>
      <Field label="Responsable" hint="Un changement d’agent lui envoie une notification.">
        <select name="responsable" defaultValue={c.responsable}>
          {!users.some((u) => u.nom === c.responsable) && <option>{c.responsable}</option>}
          {users
            .filter((u) => u.actif && u.role !== "Administrateur système")
            .map((u) => (
              <option key={u.id} value={u.nom}>
                {u.nom} — {u.service}
              </option>
            ))}
        </select>
      </Field>
      {c.sens === "Départ" && (
        <Field label="Signataire">
          <input name="signataire" defaultValue={c.signataire ?? ""} />
        </Field>
      )}
      <div className="flex justify-end gap-2 sm:col-span-2">
        <button type="button" onClick={onCancel} className="btn-ghost btn-sm">
          <X size={14} /> Annuler
        </button>
        <button disabled={busy} className="btn-main btn-sm">
          {busy ? <Spinner className="size-3.5" /> : <Save size={14} />} Enregistrer les modifications
        </button>
      </div>
    </form>
  );
}

const taille = (o: number) =>
  o < 1024 * 1024 ? `${Math.max(1, Math.round(o / 1024))} Ko` : `${(o / 1024 / 1024).toFixed(1)} Mo`;

function PiecesJointes({
  courrierId,
  userName,
  role,
  notify,
}: {
  courrierId: number;
  userName: string;
  role: Role;
  notify: Notify;
}) {
  const [pieces, setPieces] = useState<ApiPiece[] | null>(null);
  const [erreur, setErreur] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [aSupprimer, setASupprimer] = useState<ApiPiece | null>(null);
  useEffect(() => {
    let actif = true;
    fetchPieces(courrierId)
      .then((p) => actif && setPieces(p))
      .catch(() => actif && setErreur(true));
    return () => {
      actif = false;
    };
  }, [courrierId]);
  const peutSupprimer = (p: ApiPiece) =>
    role === "Administrateur système" ||
    role === "Secrétariat général / Bureau du courrier" ||
    p.ajoute_par === userName;
  const ajouter = async (fichiers: File[]) => {
    if (!fichiers.length) return;
    setEnvoi(true);
    try {
      const nouvelles = await uploadPieces(courrierId, fichiers);
      setPieces((v) => [...(v ?? []), ...nouvelles]);
      notify(`${nouvelles.length} pièce(s) jointe(s) ajoutée(s)`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Envoi impossible", "error");
    } finally {
      setEnvoi(false);
    }
  };
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-[#44584f]">
          <Paperclip size={14} className="text-brand-700" /> Pièces jointes
          {pieces && pieces.length > 0 && <span className="tag tag-gray px-1.5 py-0">{pieces.length}</span>}
        </p>
        <label className={`btn-light btn-sm cursor-pointer ${envoi ? "pointer-events-none opacity-60" : ""}`}>
          {envoi ? <Spinner className="size-3.5" /> : <Upload size={14} />} Ajouter
          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => {
              void ajouter(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {erreur ? (
        <p className="text-xs text-muted-ink">Pièces jointes indisponibles pour le moment.</p>
      ) : pieces === null ? (
        <p className="flex items-center gap-2 text-xs text-muted-ink">
          <Spinner className="size-3.5" /> Chargement…
        </p>
      ) : pieces.length === 0 ? (
        <p className="text-xs text-muted-ink">Aucune pièce jointe. Formats acceptés : PDF, JPG, PNG (10 Mo max).</p>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {pieces.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
              <Paperclip size={15} className="shrink-0 text-muted-ink" />
              <button
                onClick={() => downloadPiece(courrierId, p).catch(() => notify("Téléchargement impossible", "error"))}
                className="min-w-0 flex-1 text-left"
                title="Télécharger"
              >
                <b className="block truncate text-sm text-brand-700 hover:underline">{p.nom}</b>
                <small className="text-[11px] text-muted-ink">
                  {taille(p.taille)} · {fmtDateTime(p.date)}
                  {p.ajoute_par ? ` · ${p.ajoute_par}` : ""}
                </small>
              </button>
              <button
                onClick={() => downloadPiece(courrierId, p).catch(() => notify("Téléchargement impossible", "error"))}
                aria-label={`Télécharger ${p.nom}`}
                className="icon-btn size-8"
              >
                <Download size={14} />
              </button>
              {peutSupprimer(p) && (
                <button onClick={() => setASupprimer(p)} aria-label={`Supprimer ${p.nom}`} className="icon-btn size-8 text-[#a3211a]">
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog
        open={!!aSupprimer}
        onOpenChange={(o) => !o && setASupprimer(null)}
        danger
        title="Supprimer cette pièce jointe ?"
        description={`« ${aSupprimer?.nom} » sera définitivement supprimée du dossier.`}
        confirmLabel="Supprimer"
        onConfirm={async () => {
          if (!aSupprimer) return;
          try {
            await deletePiece(courrierId, aSupprimer.id);
            setPieces((v) => (v ?? []).filter((x) => x.id !== aSupprimer.id));
            notify("Pièce jointe supprimée");
          } catch (err) {
            notify(err instanceof Error ? err.message : "Suppression impossible", "error");
          }
        }}
      />
    </section>
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
