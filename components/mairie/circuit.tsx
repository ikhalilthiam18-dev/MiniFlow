"use client";
import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import {
  enRetard,
  etapeSuivante,
  fmt,
  joursRestants,
  statuts,
  toneStatut,
  type Courrier,
  type Notify,
} from "@/lib/mairie";
import { Avatar, PageHead, Segmented, Spinner } from "./ui";

const dot: Record<string, string> = {
  green: "bg-brand-600",
  amber: "bg-gold-400",
  red: "bg-[#e5484d]",
  blue: "bg-navy-700",
  gray: "bg-[#9aaba3]",
};

export function Circuit({
  items,
  onAdvance,
  notify,
  open,
}: {
  items: Courrier[];
  onAdvance: (id: number, statut: string) => Promise<Courrier>;
  notify: Notify;
  open: (c: Courrier) => void;
}) {
  const [q, setQ] = useState("");
  const [vue, setVue] = useState<"Actifs" | "Tous">("Actifs");
  const [busy, setBusy] = useState<number | null>(null);
  // Every status except the archive gets a column, so no dossier is hidden.
  const cols = statuts.filter((x) =>
    vue === "Actifs" ? !["Traité", "Expédié", "Archivé"].includes(x) : x !== "Archivé",
  );
  const visibles = items.filter((c) =>
    `${c.numero} ${c.objet} ${c.responsable}`.toLowerCase().includes(q.toLowerCase()),
  );
  const advance = async (c: Courrier) => {
    const n = etapeSuivante(c);
    if (!n) return;
    setBusy(c.id);
    try {
      await onAdvance(c.id, n);
      notify(`${c.numero} passe à l’étape « ${n} »`);
    } catch {
      notify("Impossible de faire avancer le dossier", "error");
    } finally {
      setBusy(null);
    }
  };
  return (
    <div>
      <PageHead
        eyebrow="Suivi opérationnel"
        title="Circuit de traitement"
        desc="Visualisez chaque dossier par étape et faites-le avancer d’un clic."
        actions={
          <>
            <label className="field-row w-full py-2 sm:w-64">
              <Search size={15} />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer les dossiers…" aria-label="Filtrer les dossiers" />
            </label>
            <Segmented label="Étapes affichées" value={vue} options={["Actifs", "Tous"] as const} onChange={setVue} />
          </>
        }
      />
      <div className="-mx-4 overflow-x-auto px-4 pb-4 scrollbar-thin sm:-mx-7 sm:px-7">
        <div className="flex gap-4">
          {cols.map((col) => {
            const list = visibles
              .filter((x) => x.statut === col)
              .sort((a, b) => a.echeance.localeCompare(b.echeance));
            return (
              <section key={col} className="flex w-[285px] shrink-0 flex-col rounded-2xl bg-[#e9efec] p-3">
                <header className="mb-3 flex items-center justify-between px-1">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-ink">
                    <span className={`size-2 rounded-full ${dot[toneStatut(col)]}`} />
                    {col}
                  </span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-muted-ink">{list.length}</span>
                </header>
                <div className="space-y-2.5">
                  {list.length === 0 && (
                    <p className="rounded-xl border border-dashed border-[#c9d6cf] px-3 py-6 text-center text-xs text-[#8a9b93]">
                      Aucun dossier
                    </p>
                  )}
                  {list.map((c) => {
                    const n = etapeSuivante(c);
                    return (
                      <article key={c.id} className="rounded-xl border border-white bg-white p-3.5 shadow-sm transition hover:border-brand-200 hover:shadow-md">
                        <button onClick={() => open(c)} className="w-full text-left">
                          <span className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-muted-ink">{c.numero}</span>
                            {c.priorite === "Urgente" && <span className="tag tag-red px-2 py-0.5 text-[10px]">Urgent</span>}
                          </span>
                          <h3 className="mt-1.5 line-clamp-2 text-[13px] font-semibold leading-5 text-ink">{c.objet}</h3>
                          <p className="mt-1 truncate text-[11.5px] text-muted-ink">{c.service}</p>
                        </button>
                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-2.5">
                          <span className="flex min-w-0 items-center gap-2">
                            <Avatar name={c.responsable} size={24} />
                            <span className={`text-[11px] ${enRetard(c) ? "font-semibold text-[#c2261d]" : "text-muted-ink"}`}>
                              {enRetard(c) ? `${-joursRestants(c)} j de retard` : fmt(c.echeance)}
                            </span>
                          </span>
                          {n && (
                            <button
                              onClick={() => advance(c)}
                              disabled={busy === c.id}
                              title={`Passer à « ${n} »`}
                              aria-label={`Passer ${c.numero} à l’étape « ${n} »`}
                              className="grid size-7 place-items-center rounded-lg bg-brand-800 text-white transition hover:bg-brand-900 disabled:opacity-60"
                            >
                              {busy === c.id ? <Spinner className="size-3" /> : <ChevronRight size={14} />}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
