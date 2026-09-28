"use client";
import { useState } from "react";
import { flushSync } from "react-dom";
import { fmt, fmtLong, type Courrier } from "@/lib/mairie";

/**
 * Impression d'un document : il est rendu dans `.print-area` (seule zone
 * imprimée, voir globals.css), puis la boîte d'impression s'ouvre ; elle
 * permet aussi d'enregistrer le document en PDF.
 */
export function usePrint() {
  const [contenu, setContenu] = useState<React.ReactNode>(null);
  const imprimer = (node: React.ReactNode) => {
    flushSync(() => setContenu(node));
    window.print();
    setContenu(null);
  };
  return { zone: contenu ? <div className="print-area">{contenu}</div> : null, imprimer };
}

const police = { fontFamily: "Inter, Arial, sans-serif", color: "#111" };

function EnTete({ titre, sousTitre }: { titre: string; sousTitre?: string }) {
  return (
    <div style={{ ...police, display: "flex", alignItems: "center", gap: 16, borderBottom: "2px solid #0e4a31", paddingBottom: 12 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-mairie-ziguinchor.jpeg" alt="" style={{ width: 64, height: 64, objectFit: "contain" }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "8pt", letterSpacing: 1 }}>RÉPUBLIQUE DU SÉNÉGAL — Un Peuple, Un But, Une Foi</div>
        <div style={{ fontSize: "14pt", fontWeight: 800 }}>MAIRIE DE ZIGUINCHOR</div>
        <div style={{ fontSize: "9pt" }}>Secrétariat général — Bureau du courrier</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: "13pt", fontWeight: 800 }}>{titre}</div>
        {sousTitre && <div style={{ fontSize: "9pt" }}>{sousTitre}</div>}
      </div>
    </div>
  );
}

function Signatures({ gauche, droite }: { gauche: string; droite: string }) {
  const bloc = { width: "45%", borderTop: "1px solid #999", paddingTop: 6, fontSize: "9pt", height: 70 };
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
      <div style={bloc}>{gauche}</div>
      <div style={bloc}>{droite}</div>
    </div>
  );
}

export function AccuseReception({ c }: { c: Courrier }) {
  const ligne = (l: string, v: string) => (
    <tr>
      <th style={{ width: "32%", background: "#f3f6f4" }}>{l}</th>
      <td>{v}</td>
    </tr>
  );
  return (
    <div style={police}>
      <EnTete titre="ACCUSÉ DE RÉCEPTION" sousTitre={`N° ${c.numero}`} />
      <p style={{ margin: "18px 0 12px", fontSize: "10.5pt", lineHeight: 1.6 }}>
        La Mairie de Ziguinchor accuse réception du courrier désigné ci-dessous, enregistré au registre
        officiel des courriers arrivée sous le numéro <b>{c.numero}</b>.
      </p>
      <table>
        <tbody>
          {ligne("Numéro d’enregistrement", c.numero)}
          {ligne("Date de réception", fmtLong(c.date))}
          {ligne("Expéditeur", c.tiers)}
          {ligne("Objet", c.objet)}
          {ligne("Mode de réception", c.type)}
          {ligne("Service destinataire", c.service)}
        </tbody>
      </table>
      <p style={{ marginTop: 14, fontSize: "9pt" }}>
        Pour toute démarche relative à ce courrier, merci de rappeler son numéro d’enregistrement.
      </p>
      <Signatures
        gauche={`Fait à Ziguinchor, le ${new Date().toLocaleDateString("fr-FR")}`}
        droite="Cachet et signature du Bureau du courrier"
      />
    </div>
  );
}

export function Bordereau({ service, items }: { service: string; items: Courrier[] }) {
  return (
    <div style={police}>
      <EnTete titre="BORDEREAU DE TRANSMISSION" sousTitre={`Édité le ${new Date().toLocaleDateString("fr-FR")}`} />
      <p style={{ margin: "16px 0 10px", fontSize: "10.5pt" }}>
        <b>Service destinataire :</b> {service} — <b>{items.length}</b> courrier(s) transmis
      </p>
      <table>
        <thead>
          <tr>
            <th>N° chrono</th>
            <th>Reçu le</th>
            <th>Expéditeur</th>
            <th>Objet</th>
            <th>Échéance</th>
            <th style={{ width: "18%" }}>Émargement</th>
          </tr>
        </thead>
        <tbody>
          {items.map((c) => (
            <tr key={c.id}>
              <td>{c.numero}</td>
              <td>{fmt(c.date)}</td>
              <td>{c.tiers}</td>
              <td>{c.objet}</td>
              <td>{fmt(c.echeance)}</td>
              <td />
            </tr>
          ))}
        </tbody>
      </table>
      <Signatures gauche="Remis par (Bureau du courrier)" droite={`Reçu par (${service})`} />
    </div>
  );
}
