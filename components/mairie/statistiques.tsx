"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Inbox, Timer } from "lucide-react";
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
import { enRetard, isClos, statuts, type Courrier } from "@/lib/mairie";
import { chartColors, tooltipStyle } from "./dashboard";
import { Empty, PageHead, SectionTitle, Segmented, StatCard } from "./ui";

const periodes = ["Tout", "12 mois", "3 mois", "30 jours"] as const;

function depuis(p: (typeof periodes)[number]) {
  const d = new Date();
  if (p === "12 mois") d.setMonth(d.getMonth() - 12);
  else if (p === "3 mois") d.setMonth(d.getMonth() - 3);
  else if (p === "30 jours") d.setDate(d.getDate() - 30);
  else return "";
  return d.toISOString().slice(0, 10);
}

function compter(items: Courrier[], key: (c: Courrier) => string) {
  const m = new Map<string, number>();
  items.forEach((c) => m.set(key(c), (m.get(key(c)) ?? 0) + 1));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export function Statistiques({ items }: { items: Courrier[] }) {
  const [periode, setPeriode] = useState<(typeof periodes)[number]>("Tout");
  const min = depuis(periode);
  const data = items.filter((c) => !min || c.date >= min);
  const clos = data.filter(isClos).length;
  const retard = data.filter(enRetard).length;
  const actifs = data.length - clos;
  const parStatut = statuts
    .map((s) => ({ name: s, value: data.filter((c) => c.statut === s).length }))
    .filter((x) => x.value > 0);
  const parService = compter(data, (c) => c.service);
  const parType = compter(data, (c) => c.type).slice(0, 6);
  const parSens = compter(data, (c) => c.sens);
  const parPriorite = compter(data, (c) => c.priorite);
  return (
    <div className="space-y-5">
      <PageHead
        eyebrow="Pilotage"
        title="Statistiques"
        desc="Analyse de l’activité du courrier municipal sur la période choisie."
        actions={<Segmented label="Période" value={periode} options={periodes} onChange={setPeriode} />}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Courriers sur la période" value={data.length} icon={Inbox} tone="green" />
        <StatCard label="Dossiers actifs" value={actifs} icon={Timer} tone="amber" />
        <StatCard
          label="Taux de clôture"
          value={`${data.length ? Math.round((clos / data.length) * 100) : 0} %`}
          icon={CheckCircle2}
          tone="blue"
          hint={`${clos} dossiers clôturés`}
        />
        <StatCard
          label="Taux de retard"
          value={`${actifs ? Math.round((retard / actifs) * 100) : 0} %`}
          icon={AlertTriangle}
          tone="red"
          hint={`${retard} dossiers actifs en retard`}
        />
      </div>
      {data.length === 0 ? (
        <div className="card">
          <Empty text="Aucun courrier sur cette période." />
        </div>
      ) : (
        <>
          <div className="grid gap-5 xl:grid-cols-2">
            <ChartCard title="Répartition par statut" desc="Nombre de courriers à chaque étape">
              <ResponsiveContainer>
                <BarChart data={parStatut} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e9eeeb" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} fontSize={11} />
                  <Tooltip cursor={{ fill: "#f1f8f4" }} {...tooltipStyle} />
                  <Bar dataKey="value" name="Courriers" fill="#13603f" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Volume par service" desc="Courriers rattachés à chaque service">
              <ResponsiveContainer>
                <BarChart data={parService} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e9eeeb" />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} fontSize={11} />
                  <YAxis type="category" dataKey="name" width={150} axisLine={false} tickLine={false} fontSize={11} />
                  <Tooltip cursor={{ fill: "#f1f8f4" }} {...tooltipStyle} />
                  <Bar dataKey="value" name="Courriers" fill="#243f8f" radius={[0, 6, 6, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <Donut title="Arrivées / départs" data={parSens} />
            <Donut title="Priorité" data={parPriorite} colors={["#13603f", "#e5484d"]} />
            <Donut title="Type / mode d’envoi" data={parType} />
          </div>
        </>
      )}
    </div>
  );
}

function ChartCard({ title, desc, children }: { title: string; desc: string; children: React.ReactElement }) {
  return (
    <div className="card p-6">
      <SectionTitle title={title} desc={desc} />
      <div className="mt-5 h-[300px]">{children}</div>
    </div>
  );
}

function Donut({
  title,
  data,
  colors = chartColors,
}: {
  title: string;
  data: { name: string; value: number }[];
  colors?: string[];
}) {
  const total = data.reduce((s, x) => s + x.value, 0);
  return (
    <div className="card p-6">
      <SectionTitle title={title} />
      <div className="mt-2 h-[170px]">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3} stroke="none">
              {data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
            </Pie>
            <Tooltip {...tooltipStyle} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1.5 text-xs">
        {data.map((x, i) => (
          <li key={x.name} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: colors[i % colors.length] }} />
              <span className="truncate">{x.name}</span>
            </span>
            <span className="text-muted-ink">
              <b className="text-ink">{x.value}</b> · {total ? Math.round((x.value / total) * 100) : 0} %
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
