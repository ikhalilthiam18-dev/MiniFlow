"use client";
import { useState } from "react";
import { flushSync } from "react-dom";
import { BookOpen, Download, FileText, Printer } from "lucide-react";
import { fmt, type Courrier, type Notify } from "@/lib/mairie";
import { Empty, PageHead, Pagination, SectionTitle, StatusBadge, usePagination } from "./ui";

type Sens = Courrier["sens"];

export function Registres({
  items,
  exportCSV,
  notify,
  open,
}: {
  items: Courrier[];
  exportCSV: (list: Courrier[], nom: string) => void;
  notify: Notify;
  open: (c: Courrier) => void;
}) {
  const annee = new Date().getFullYear();
  const [sens, setSens] = useState<Sens>("Arrivée");
  const [printing, setPrinting] = useState<Sens | null>(null);
  const registre = (s: Sens) =>
    items
      .filter((x) => x.sens === s && x.date.startsWith(String(annee)))
      .sort((a, b) => a.numero.localeCompare(b.numero));
  const list = registre(sens);
  const pg = usePagination(list, 10);
  const imprimer = (s: Sens) => {
    // Render the printable register synchronously, print it, then remove it.
    flushSync(() => setPrinting(s));
    window.print();
    setPrinting(null);
  };
  return (
    <div>
      <PageHead
        eyebrow={`Exercice ${annee}`}
        title="Registres officiels"
        desc="Éditions réglementaires du registre arrivée et du registre départ."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {(["Arrivée", "Départ"] as const).map((s) => {
          const n = registre(s).length;
          return (
            <div key={s} className="card overflow-hidden">
              <div className={`relative overflow-hidden p-6 text-white ${s === "Arrivée" ? "bg-gradient-to-br from-brand-800 to-brand-950" : "bg-gradient-to-br from-navy-700 to-navy-800"}`}>
                <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
                <BookOpen className="text-gold-400" />
                <h3 className="font-display mt-4 text-xl font-bold">Registre courrier {s.toLowerCase()}</h3>
                <p className="mt-1 text-sm text-white/65">
                  Exercice {annee} · <b className="text-white">{n}</b> écriture{n > 1 ? "s" : ""}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 p-4">
                <button onClick={() => imprimer(s)} disabled={!n} className="btn-light">
                  <Printer size={16} /> Imprimer
                </button>
                <button
                  onClick={() => exportCSV(registre(s), `registre-${s === "Arrivée" ? "arrivee" : "depart"}`)}
                  disabled={!n}
                  className="btn-main"
                >
                  <Download size={16} /> Exporter
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-5 overflow-hidden">
        <div className="flex flex-col justify-between gap-3 border-b border-line px-6 py-4 sm:flex-row sm:items-center">
          <SectionTitle title={`Registre ${sens.toLowerCase()} ${annee}`} desc="Écritures classées par numéro chrono" />
          <div role="tablist" className="inline-flex rounded-xl bg-[#eef2f0] p-1">
            {(["Arrivée", "Départ"] as const).map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={sens === s}
                onClick={() => {
                  setSens(s);
                  pg.setPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${sens === s ? "bg-white text-brand-800 shadow-sm" : "text-muted-ink"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        {list.length === 0 ? (
          <Empty text={`Aucune écriture dans le registre ${sens.toLowerCase()} pour ${annee}.`} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>N° chrono</th>
                    <th>Date</th>
                    <th>{sens === "Arrivée" ? "Expéditeur" : "Destinataire"}</th>
                    <th>Objet</th>
                    <th>Service</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {pg.pageItems.map((c) => (
                    <tr key={c.id} onClick={() => open(c)} className="cursor-pointer">
                      <td className="whitespace-nowrap font-semibold">{c.numero}</td>
                      <td className="whitespace-nowrap text-muted-ink">{fmt(c.date)}</td>
                      <td>{c.tiers}</td>
                      <td className="max-w-[280px] truncate text-muted-ink">{c.objet}</td>
                      <td className="text-muted-ink">{c.service}</td>
                      <td><StatusBadge statut={c.statut} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination {...pg} label="écritures" />
          </>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Doc
          title="Accusé de réception"
          text="Générer un accusé comportant le numéro chrono, la date et le cachet du bureau du courrier."
          notify={notify}
        />
        <Doc
          title="Bordereau de transmission"
          text="Éditer la liste des courriers ventilés vers un service avec émargement."
          notify={notify}
        />
      </div>

      {printing && (
        <div className="print-area">
          <h1 style={{ fontSize: "16pt", fontWeight: 700 }}>
            Mairie de Ziguinchor — Registre courrier {printing.toLowerCase()} {annee}
          </h1>
          <p style={{ margin: "4pt 0 12pt" }}>Édité le {new Date().toLocaleDateString("fr-FR")}</p>
          <table>
            <thead>
              <tr>
                <th>N° chrono</th>
                <th>Date</th>
                <th>{printing === "Arrivée" ? "Expéditeur" : "Destinataire"}</th>
                <th>Objet</th>
                <th>Service</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {registre(printing).map((c) => (
                <tr key={c.id}>
                  <td>{c.numero}</td>
                  <td>{fmt(c.date)}</td>
                  <td>{c.tiers}</td>
                  <td>{c.objet}</td>
                  <td>{c.service}</td>
                  <td>{c.statut}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Doc({ title, text, notify }: { title: string; text: string; notify: Notify }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
        <FileText size={20} />
      </span>
      <div>
        <h3 className="font-semibold text-ink">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-ink">{text}</p>
        <button onClick={() => notify(`${title} prêt à être édité`, "info")} className="mt-2 text-sm font-semibold text-brand-700 hover:underline">
          Créer le document →
        </button>
      </div>
    </div>
  );
}
