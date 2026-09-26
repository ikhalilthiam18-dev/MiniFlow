import type { ApiUser } from "@/lib/api";

export type AppUser = ApiUser;
export type Role = AppUser["role"];

export type Courrier = {
  id: number;
  numero: string;
  sens: "Arrivée" | "Départ";
  date: string;
  tiers: string;
  objet: string;
  service: string;
  type: string;
  priorite: "Normale" | "Urgente";
  statut: string;
  echeance: string;
  responsable: string;
  signataire?: string;
  notes?: string;
};

export type Contact = {
  id: number;
  nom: string;
  categorie: string;
  email: string;
  telephone: string;
};

export type AppNotification = {
  id: number;
  destinataire: string;
  courrier: string;
  message: string;
  date: string;
  lue: boolean;
};

export type Stats = {
  jour: number;
  attente: number;
  retard: number;
  signature: number;
  traites: number;
};

export type Notify = (message: string, kind?: "success" | "error" | "info") => void;

export type CourrierFilters = {
  query: string;
  sens: "Tous" | Courrier["sens"];
  statut: string;
  service: string;
};

export const filtresVides: CourrierFilters = {
  query: "",
  sens: "Tous",
  statut: "Tous",
  service: "Tous",
};

/** Special statut filter value: overdue dossiers whatever their status. */
export const FILTRE_RETARD = "En retard";

export const services = [
  "Bureau du courrier",
  "Direction des systèmes d’information",
  "État civil",
  "Urbanisme",
  "Services techniques",
  "Cabinet du Maire",
  "Affaires sociales",
  "Finances",
  "Direction générale",
];

export const statuts = [
  "Reçu",
  "En préparation",
  "Ventilé",
  "En cours de traitement",
  "En attente de signature",
  "Signé",
  "En attente de réponse",
  "Traité",
  "Expédié",
  "Archivé",
];
export const statutsClos = ["Traité", "Expédié", "Archivé"];

export const roles: Role[] = [
  "Administrateur système",
  "Secrétariat général / Bureau du courrier",
  "DGS / Secrétaire municipal",
  "Chef de service municipal",
  "Agent communal",
];
/** Roles allowed to register a courrier (mirrors CourrierPermission in the API). */
export const rolesCreation: Role[] = roles.slice(0, 4);
/** Roles that see every courrier and every notification. */
export const rolesVueGlobale: Role[] = roles.slice(0, 3);

export const roleCourt: Record<Role, string> = {
  "Administrateur système": "Administrateur",
  "Secrétariat général / Bureau du courrier": "Bureau du courrier",
  "DGS / Secrétaire municipal": "DGS",
  "Chef de service municipal": "Chef de service",
  "Agent communal": "Agent communal",
};

export const categoriesContact = [
  "Administration",
  "Association",
  "Entreprise",
  "Élu",
  "Citoyen",
];

/** Local date as YYYY-MM-DD (same format as the API dates). */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const today = () => isoDate(new Date());
export const inDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoDate(d);
};
export const isClos = (c: Courrier) => statutsClos.includes(c.statut);
export const enRetard = (c: Courrier) => !isClos(c) && c.echeance < today();
/** Days left before the deadline (negative when overdue). */
export const joursRestants = (c: Courrier) =>
  Math.round(
    (new Date(c.echeance + "T00:00:00").getTime() -
      new Date(today() + "T00:00:00").getTime()) /
      86_400_000,
  );

export const fmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR");
export const fmtLong = (d: string) =>
  new Date(d.length === 10 ? d + "T00:00:00" : d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
export const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const initiales = (nom: string) =>
  nom
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

export type Tone = "green" | "amber" | "red" | "blue" | "gray";

export function toneStatut(statut: string): Tone {
  if (statutsClos.includes(statut)) return "green";
  if (statut.includes("signature") || statut === "Signé") return "blue";
  if (statut.includes("attente")) return "amber";
  if (statut === "Reçu" || statut === "En préparation") return "gray";
  return "blue";
}

/** Next workflow step, or null when the dossier is at the end of its flow. */
export function etapeSuivante(c: Courrier): string | null {
  // A départ starts "En préparation"; an arrivée skips that step.
  const flow =
    c.sens === "Départ" ? statuts : statuts.filter((x) => x !== "En préparation");
  const i = flow.indexOf(c.statut);
  return i >= 0 && i < flow.length - 1 ? flow[i + 1] : null;
}

export function filtrerCourriers(items: Courrier[], f: CourrierFilters) {
  const q = f.query.trim().toLowerCase();
  return items.filter(
    (c) =>
      (!q ||
        `${c.numero} ${c.tiers} ${c.objet} ${c.responsable}`
          .toLowerCase()
          .includes(q)) &&
      (f.sens === "Tous" || c.sens === f.sens) &&
      (f.statut === "Tous" ||
        (f.statut === FILTRE_RETARD ? enRetard(c) : c.statut === f.statut)) &&
      (f.service === "Tous" || c.service === f.service),
  );
}

export function exporterCSV(list: Courrier[], nom: string) {
  const cell = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const data = [
    "Numero;Sens;Date;Tiers;Objet;Service;Statut;Echeance",
    ...list.map((x) =>
      [x.numero, x.sens, x.date, x.tiers, x.objet, x.service, x.statut, x.echeance]
        .map(cell)
        .join(";"),
    ),
  ].join("\r\n");
  const url = URL.createObjectURL(
    // The BOM lets Excel read the accents correctly.
    new Blob(["﻿" + data], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nom}-${today()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
