"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  FileInput,
  FileOutput,
  FileText,
  Filter,
  LayoutDashboard,
  Mail,
  Menu,
  Plus,
  Printer,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Courrier = {
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
type Contact = {
  id: number;
  nom: string;
  categorie: string;
  email: string;
  telephone: string;
};
type AppUser = {
  id: number;
  nom: string;
  email: string;
  role:
    | "Administrateur système"
    | "Secrétariat général / Bureau du courrier"
    | "DGS / Secrétaire municipal"
    | "Chef de service municipal"
    | "Agent communal";
  service: string;
  actif: boolean;
};
type AppNotification = {
  id: number;
  destinataire: string;
  courrier: string;
  message: string;
  date: string;
  lue: boolean;
};
const services = [
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
const seed: Courrier[] = [
  {
    id: 1,
    numero: "ARR-2026-0048",
    sens: "Arrivée",
    date: "2026-08-27",
    tiers: "Préfecture de Rufisque",
    objet: "Transmission du contrôle de légalité — délibération n°18",
    service: "Direction générale",
    type: "Recommandé",
    priorite: "Urgente",
    statut: "Ventilé",
    echeance: "2026-08-29",
    responsable: "A. Ndiaye",
    notes: "Traiter sous 48 h — instruction DGS",
  },
  {
    id: 2,
    numero: "ARR-2026-0047",
    sens: "Arrivée",
    date: "2026-08-27",
    tiers: "Association And Liguey",
    objet: "Demande d’autorisation d’occupation temporaire",
    service: "Services techniques",
    type: "Dépôt physique",
    priorite: "Normale",
    statut: "En cours de traitement",
    echeance: "2026-09-04",
    responsable: "M. Fall",
  },
  {
    id: 3,
    numero: "DEP-2026-0031",
    sens: "Départ",
    date: "2026-08-26",
    tiers: "Ministère des Collectivités territoriales",
    objet: "Réponse à la demande de situation budgétaire",
    service: "Finances",
    type: "Recommandé avec AR",
    priorite: "Urgente",
    statut: "En attente de signature",
    echeance: "2026-08-28",
    responsable: "F. Sarr",
    signataire: "Maire",
  },
  {
    id: 4,
    numero: "ARR-2026-0046",
    sens: "Arrivée",
    date: "2026-08-25",
    tiers: "Mamadou Diop",
    objet: "Demande de copie d’acte de naissance",
    service: "État civil",
    type: "Email",
    priorite: "Normale",
    statut: "Traité",
    echeance: "2026-08-30",
    responsable: "A. Ba",
  },
  {
    id: 5,
    numero: "ARR-2026-0042",
    sens: "Arrivée",
    date: "2026-08-21",
    tiers: "Entreprise SOTRACOM",
    objet: "Réclamation relative au marché de voirie",
    service: "Services techniques",
    type: "Lettre",
    priorite: "Normale",
    statut: "En attente de réponse",
    echeance: "2026-08-25",
    responsable: "M. Fall",
  },
  {
    id: 6,
    numero: "DEP-2026-0030",
    sens: "Départ",
    date: "2026-08-24",
    tiers: "Trésorerie municipale",
    objet: "Transmission du compte administratif",
    service: "Finances",
    type: "Courrier simple",
    priorite: "Normale",
    statut: "Expédié",
    echeance: "2026-08-24",
    responsable: "F. Sarr",
    signataire: "DGS",
  },
];
const seedContacts: Contact[] = [
  {
    id: 1,
    nom: "Préfecture de Rufisque",
    categorie: "Administration",
    email: "courrier@prefecture.sn",
    telephone: "33 000 00 01",
  },
  {
    id: 2,
    nom: "Association And Liguey",
    categorie: "Association",
    email: "contact@andliguey.sn",
    telephone: "77 200 10 10",
  },
  {
    id: 3,
    nom: "Trésorerie municipale",
    categorie: "Administration",
    email: "tresorerie@finances.sn",
    telephone: "33 000 00 02",
  },
];
const seedUsers: AppUser[] = [
  {
    id: 1,
    nom: "Pape Ibrahima Niang",
    email: "admin@mairie.sn",
    role: "Administrateur système",
    service: "Direction des systèmes d’information",
    actif: true,
  },
  {
    id: 2,
    nom: "Aïssatou Ndiaye",
    email: "courrier@mairie.sn",
    role: "Secrétariat général / Bureau du courrier",
    service: "Bureau du courrier",
    actif: true,
  },
  {
    id: 3,
    nom: "Oumar Diallo",
    email: "dgs@mairie.sn",
    role: "DGS / Secrétaire municipal",
    service: "Direction générale",
    actif: true,
  },
  {
    id: 4,
    nom: "Moussa Fall",
    email: "m.fall@mairie.sn",
    role: "Chef de service municipal",
    service: "Services techniques",
    actif: true,
  },
  {
    id: 5,
    nom: "Fatou Sarr",
    email: "f.sarr@mairie.sn",
    role: "Agent communal",
    service: "Finances",
    actif: true,
  },
  {
    id: 6,
    nom: "Abdou Ba",
    email: "a.ba@mairie.sn",
    role: "Agent communal",
    service: "État civil",
    actif: false,
  },
];
const nav = [
  ["dashboard", "Tableau de bord", LayoutDashboard],
  ["courriers", "Courriers", Mail],
  ["circuit", "Circuit & délais", ChevronRight],
  ["registres", "Registres officiels", BookOpen],
  ["contacts", "Répertoire", Users],
  ["administration", "Administration", Settings],
] as const;
const monthly = [
  { m: "Mars", a: 82, d: 55 },
  { m: "Avr.", a: 96, d: 61 },
  { m: "Mai", a: 88, d: 67 },
  { m: "Juin", a: 112, d: 75 },
  { m: "Juil.", a: 104, d: 71 },
  { m: "Août", a: 126, d: 84 },
];
const byService = services
  .slice(0, 6)
  .map((s, i) => ({ name: s, value: [28, 21, 18, 14, 11, 8][i] }));
const colors = [
  "#0f5b46",
  "#1f8a68",
  "#61a98e",
  "#d6a94b",
  "#59748b",
  "#a86d59",
];

export default function Home() {
  const [tab, setTab] = useState("dashboard"),
    [mobile, setMobile] = useState(false),
    [dialog, setDialog] = useState<
      "in" | "out" | "detail" | "profile" | "notifications" | null
    >(null),
    [selected, setSelected] = useState<Courrier | null>(null),
    [query, setQuery] = useState(""),
    [status, setStatus] = useState("Tous"),
    [service, setService] = useState("Tous"),
    [toast, setToast] = useState(""),
    [logged, setLogged] = useState(false),
    [role, setRole] = useState<AppUser["role"]>("Administrateur système"),
    [currentUser, setCurrentUser] = useState("Pape Ibrahima Niang");
  const [items, setItems] = useState<Courrier[]>(seed),
    [contacts, setContacts] = useState<Contact[]>(seedContacts),
    [users, setUsers] = useState<AppUser[]>(seedUsers),
    [notifications, setNotifications] = useState<AppNotification[]>([]),
    [avatars, setAvatars] = useState<Record<string,string>>({});
  useEffect(() => {
    const c = localStorage.getItem("mairie-courriers"),
      p = localStorage.getItem("mairie-contacts"),
      u = localStorage.getItem("mairie-users"),
      n = localStorage.getItem("mairie-notifications"),
      a = localStorage.getItem("mairie-avatars");
    if (c) setItems(JSON.parse(c));
    if (p) setContacts(JSON.parse(p));
    if (u) setUsers(JSON.parse(u));
    if (n) setNotifications(JSON.parse(n));
    if (a) setAvatars(JSON.parse(a));
  }, []);
  useEffect(() => {
    localStorage.setItem("mairie-courriers", JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    localStorage.setItem("mairie-contacts", JSON.stringify(contacts));
  }, [contacts]);
  useEffect(() => {
    localStorage.setItem("mairie-users", JSON.stringify(users));
  }, [users]);
  useEffect(() => {
    localStorage.setItem("mairie-notifications", JSON.stringify(notifications));
  }, [notifications]);
  useEffect(() => { localStorage.setItem("mairie-avatars", JSON.stringify(avatars)); }, [avatars]);
  const scopedItems =
    role === "Chef de service municipal"
      ? items.filter((x) => x.service === "Services techniques")
      : role === "Agent communal"
        ? items.filter(
            (x) => x.responsable === "F. Sarr" || x.service === "Finances",
          )
        : items;
  const visibleNotifications = [
    "Administrateur système",
    "Secrétariat général / Bureau du courrier",
    "DGS / Secrétaire municipal",
  ].includes(role)
    ? notifications
    : notifications.filter((n) => n.destinataire === currentUser);
  const currentAccount = users.find((u) => u.nom === currentUser);
  const avatar = avatars[currentUser];
  const setAvatarFile = (file?:File) => { if(!file)return; if(!file.type.startsWith("image/")){notify("Sélectionnez une image valide");return} if(file.size>2*1024*1024){notify("La photo ne doit pas dépasser 2 Mo");return} const reader=new FileReader();reader.onload=()=>{setAvatars((v)=>({...v,[currentUser]:String(reader.result)}));notify("Photo de profil enregistrée")};reader.readAsDataURL(file); };
  const filtered = useMemo(
    () =>
      scopedItems.filter(
        (c) =>
          (c.numero + " " + c.tiers + " " + c.objet)
            .toLowerCase()
            .includes(query.toLowerCase()) &&
          (status === "Tous" || c.statut === status) &&
          (service === "Tous" || c.service === service),
      ),
    [scopedItems, query, status, service],
  );
  const stats = {
    jour: scopedItems.filter((x) => x.date === "2026-08-27").length,
    attente: scopedItems.filter(
      (x) => !["Traité", "Expédié", "Archivé"].includes(x.statut),
    ).length,
    retard: scopedItems.filter(
      (x) =>
        x.echeance < "2026-08-27" &&
        !["Traité", "Expédié", "Archivé"].includes(x.statut),
    ).length,
    signature: scopedItems.filter((x) => x.statut.includes("signature")).length,
    traites: scopedItems.filter((x) =>
      ["Traité", "Expédié", "Archivé"].includes(x.statut),
    ).length,
  };
  const notify = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };
  const add = (fd: FormData, sens: "Arrivée" | "Départ") => {
    const n = items.filter((x) => x.sens === sens).length + 49;
    const c: Courrier = {
      id: Date.now(),
      numero: `${sens === "Arrivée" ? "ARR" : "DEP"}-2026-${String(n).padStart(4, "0")}`,
      sens,
      date: String(fd.get("date")),
      tiers: String(fd.get("tiers")),
      objet: String(fd.get("objet")),
      service: String(fd.get("service")),
      type: String(fd.get("type")),
      priorite: String(fd.get("priorite")) as Courrier["priorite"],
      statut: sens === "Arrivée" ? "Reçu" : "En préparation",
      echeance: String(fd.get("echeance")),
      responsable:
        sens === "Arrivée"
          ? String(fd.get("responsable"))
          : "Bureau du courrier",
      signataire: String(fd.get("signataire") || ""),
    };
    setItems((v) => [c, ...v]);
    if (sens === "Arrivée")
      setNotifications((v) => [
        {
          id: Date.now(),
          destinataire: c.responsable,
          courrier: c.numero,
          message: `Nouveau courrier affecté : ${c.objet} — échéance ${fmt(c.echeance)}`,
          date: new Date().toISOString(),
          lue: false,
        },
        ...v,
      ]);
    setDialog(null);
    notify(`${c.numero} enregistré avec succès`);
  };
  const exportCSV = () => {
    const data = [
      "Numero;Sens;Date;Tiers;Objet;Service;Statut;Echeance",
      ...filtered.map((x) =>
        [
          x.numero,
          x.sens,
          x.date,
          x.tiers,
          x.objet,
          x.service,
          x.statut,
          x.echeance,
        ].join(";"),
      ),
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([data], { type: "text/csv;charset=utf-8" }),
    );
    a.download = "registre-courrier-2026.csv";
    a.click();
    notify("Export CSV généré");
  };
  if (!logged)
    return (
      <Login
        users={users}
        onLogin={(user) => {
          setRole(user.role);
          setCurrentUser(user.nom);
          setLogged(true);
          notify(`Bienvenue ${user.nom}`);
        }}
      />
    );
  const visibleNav = nav.filter(
    ([v]) => role === "Administrateur système" || v !== "administration",
  );
  return (
    <main className="min-h-screen bg-[#f3f5f4] text-[#17261f]">
      {toast && (
        <div className="fixed right-5 top-5 z-[100] flex items-center gap-2 rounded-xl bg-[#123f31] px-4 py-3 text-sm text-white shadow-2xl">
          <CheckCircle2 size={17} className="text-[#d5f65a]" />
          {toast}
        </div>
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[248px] bg-[#123f31] text-white transition-transform lg:translate-x-0 ${mobile ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center overflow-hidden rounded-xl bg-white p-1"><img src="/logo-mairie-ziguinchor.jpeg" alt="Logo de la Commune de Ziguinchor" className="h-full w-full object-contain" /></span>
            <div>
              <b className="block">Mairie de Ziguinchor</b>
              <small className="text-white/50">Gestion du courrier</small>
            </div>
          </div>
          <button className="lg:hidden" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <nav className="p-3 pt-6">
          {visibleNav.map(([v, l, I]) => (
            <button
              key={v}
              onClick={() => {
                setTab(v);
                setMobile(false);
              }}
              className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm ${tab === v ? "bg-white/12 text-[#d5f65a]" : "text-white/65 hover:bg-white/5"}`}
            >
              <I size={18} />
              {l}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-white/10 bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs">
            <ShieldCheck size={15} className="text-[#d5f65a]" />
            <b>{role}</b>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-white/45">
            Session sécurisée • droits appliqués
            <br />
            Dernière activité : maintenant
          </p>
        </div>
      </aside>
      {mobile && (
        <button
          className="fixed inset-0 z-40 bg-black/35 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <section className="lg:ml-[248px]">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-black/5 bg-[#f3f5f4]/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobile(true)}>
              <Menu />
            </button>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#658076]">
                Commune de Ziguinchor
              </p>
              <h1 className="font-semibold">Bureau du courrier</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setDialog("notifications")}
              className="relative grid size-10 place-items-center rounded-xl border bg-white"
            >
              <Bell size={18} />
              {visibleNotifications.some((n) => !n.lue) && (
                <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                  {visibleNotifications.filter((n) => !n.lue).length}
                </span>
              )}
            </button>
            <button onClick={() => setDialog("profile")} className="hidden max-w-[265px] items-center gap-2 rounded-xl border bg-white px-2.5 py-1.5 text-left transition hover:border-[#4d7d6b] sm:flex"><span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dceae4] text-xs font-bold text-[#19513e]">{avatar?<img src={avatar} alt="Photo de profil" className="h-full w-full object-cover"/>:currentUser.split(" ").map(n=>n[0]).slice(0,2).join("")}</span><span className="min-w-0"><b className="block truncate text-xs">{currentUser}</b><span className="block truncate text-[10px] text-[#6c7e76]">{role} • Mon profil</span></span></button>
            <button
              onClick={() => setLogged(false)}
              className="hidden rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-bold text-red-700 xl:block"
            >
              Déconnexion
            </button>
            {(role === "Administrateur système" ||
              role === "Secrétariat général / Bureau du courrier") && (
              <button
                onClick={() => setDialog("in")}
                className="hidden items-center gap-2 rounded-xl bg-[#123f31] px-4 py-2.5 text-sm font-semibold text-white sm:flex"
              >
                <Plus size={16} /> Nouveau courrier
              </button>
            )}
          </div>
        </header>
        <div className="mx-auto max-w-[1450px] p-4 sm:p-7">
          {tab === "dashboard" && (
            <Dashboard
              stats={stats}
              items={scopedItems}
              open={(x) => {
                setSelected(x);
                setDialog("detail");
              }}
              setDialog={setDialog}
            />
          )}
          {tab === "courriers" && (
            <Courriers
              items={filtered}
              query={query}
              setQuery={setQuery}
              status={status}
              setStatus={setStatus}
              service={service}
              setService={setService}
              open={(x) => {
                setSelected(x);
                setDialog("detail");
              }}
              exportCSV={exportCSV}
              setDialog={setDialog}
            />
          )}
          {tab === "circuit" && (
            <Circuit items={scopedItems} setItems={setItems} notify={notify} />
          )}
          {tab === "registres" && (
            <Registres items={items} exportCSV={exportCSV} notify={notify} />
          )}
          {tab === "contacts" && (
            <Contacts
              contacts={contacts}
              setContacts={setContacts}
              notify={notify}
            />
          )}
          {tab === "administration" && role === "Administrateur système" && (
            <Administration users={users} setUsers={setUsers} notify={notify} />
          )}
        </div>
      </section>
      <Dialog
        open={dialog === "in" || dialog === "out"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {dialog === "out"
                ? "Enregistrer un courrier départ"
                : "Enregistrer un courrier arrivée"}
            </DialogTitle>
            <DialogDescription>
              Les champs marqués sont obligatoires. Le numéro chrono sera généré
              automatiquement.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-4 rounded-xl border p-4"><span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-full bg-[#dceae4] text-xl font-bold text-[#19513e]">{avatar?<img src={avatar} alt="Photo de profil" className="h-full w-full object-cover"/>:currentUser.split(" ").map(n=>n[0]).slice(0,2).join("")}</span><div><b className="text-sm">Photo ou avatar</b><p className="mt-1 text-xs text-[#6b7d74]">JPG, PNG ou WebP • 2 Mo maximum</p><div className="mt-3 flex gap-2"><label className="btn-main cursor-pointer py-2">Choisir une photo<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e)=>setAvatarFile(e.target.files?.[0])}/></label>{avatar&&<button onClick={()=>{setAvatars(v=>{const n={...v};delete n[currentUser];return n});notify("Photo supprimée")}} className="btn-light py-2">Supprimer</button>}</div></div></div>
          <MailForm
            sens={dialog === "out" ? "Départ" : "Arrivée"}
            onSubmit={add}
            users={users}
          />
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "detail"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          {selected && (
            <Detail
              c={selected}
              update={(s) => {
                setItems((v) =>
                  v.map((x) =>
                    x.id === selected.id ? { ...x, statut: s } : x,
                  ),
                );
                setSelected({ ...selected, statut: s });
                notify("Statut mis à jour");
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "profile"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mon profil</DialogTitle>
            <DialogDescription>
              Informations du compte et paramètres de sécurité.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 rounded-xl bg-[#edf3f0] p-4 text-sm sm:grid-cols-2"><div><small className="text-[#718279]">Nom complet</small><b className="block">{currentUser}</b></div><div><small className="text-[#718279]">Fonction</small><b className="block">{role}</b></div><div><small className="text-[#718279]">Adresse professionnelle</small><b className="block">{currentAccount?.email}</b></div><div><small className="text-[#718279]">Service municipal</small><b className="block">{currentAccount?.service}</b></div></div>
          <h3 className="border-t pt-4 text-sm font-semibold">Changer mon mot de passe</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setDialog(null);
              notify("Mot de passe modifié");
            }}
            className="space-y-3"
          >
            <input
              className="control w-full"
              type="password"
              placeholder="Mot de passe actuel"
              required
            />
            <input
              className="control w-full"
              type="password"
              placeholder="Nouveau mot de passe"
              required
            />
            <input
              className="control w-full"
              type="password"
              placeholder="Confirmer le mot de passe"
              required
            />
            <button className="btn-main w-full justify-center">
              Mettre à jour mon mot de passe
            </button>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={dialog === "notifications"}
        onOpenChange={(o) => !o && setDialog(null)}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Centre de notifications</DialogTitle>
            <DialogDescription>
              Affectations adressées aux agents communaux.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[420px] space-y-3 overflow-y-auto">
            {visibleNotifications.length === 0 ? (
              <div className="rounded-xl bg-[#edf2f0] p-6 text-center text-sm text-[#687b72]">
                Aucune notification pour ce compte.
              </div>
            ) : (
              visibleNotifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() =>
                    setNotifications((v) =>
                      v.map((x) => (x.id === n.id ? { ...x, lue: true } : x)),
                    )
                  }
                  className={`w-full rounded-xl border p-4 text-left ${n.lue ? "bg-white" : "border-[#9dc8b7] bg-[#edf8f3]"}`}
                >
                  <div className="flex justify-between gap-3">
                    <b className="text-sm">{n.destinataire}</b>
                    <span className="text-[10px] text-[#71837a]">
                      {n.lue ? "Lue" : "Nouvelle"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[#50665d]">
                    {n.message}
                  </p>
                  <span className="mt-2 block text-xs font-bold text-[#18523f]">
                    {n.courrier}
                  </span>
                </button>
              ))
            )}
          </div>
          {visibleNotifications.some((n) => !n.lue) && (
            <button
              onClick={() =>
                setNotifications((v) => v.map((x) => ({ ...x, lue: true })))
              }
              className="btn-light justify-center"
            >
              Tout marquer comme lu
            </button>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

function Dashboard({
  stats,
  items,
  open,
  setDialog,
}: {
  stats: any;
  items: Courrier[];
  open: (x: Courrier) => void;
  setDialog: (x: "in" | "out") => void;
}) {
  const urgent = items.filter(
    (x) => x.priorite === "Urgente" || x.echeance < "2026-08-27",
  );
  return (
    <div>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-[#687d74]">Jeudi 27 août 2026</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-tight">
            Bonjour, Bureau du courrier
          </h2>
          <p className="mt-2 text-sm text-[#687d74]">
            Voici les dossiers qui demandent votre attention aujourd’hui.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setDialog("in")} className="btn-main">
            <FileInput size={17} /> Courrier arrivée
          </button>
          <button onClick={() => setDialog("out")} className="btn-light">
            <FileOutput size={17} /> Courrier départ
          </button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Courriers du jour", stats.jour, Mail, "#e4f4ee"],
          ["À traiter", stats.attente, Clock3, "#fff2d9"],
          ["En retard", stats.retard, CalendarDays, "#ffe5e3"],
          ["À signer", stats.signature, FileText, "#e8edff"],
          ["Traités ce mois", stats.traites, CheckCircle2, "#e8f5dc"],
        ].map(([l, n, I, b]) => {
          const Icon = I as typeof Mail;
          return (
            <div key={l as string} className="card p-5">
              <span
                style={{ background: b as string }}
                className="grid size-10 place-items-center rounded-xl"
              >
                <Icon size={18} />
              </span>
              <strong className="mt-5 block text-3xl">{n as number}</strong>
              <span className="text-xs text-[#6a7e75]">{l as string}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.45fr_.85fr]">
        <div className="card p-6">
          <div className="mb-5 flex justify-between">
            <div>
              <h3 className="font-semibold">Volume mensuel</h3>
              <p className="text-xs text-[#6f827a]">
                Registres arrivée et départ
              </p>
            </div>
            <span className="tag">6 derniers mois</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e9eeeb"
                />
                <XAxis
                  dataKey="m"
                  axisLine={false}
                  tickLine={false}
                  fontSize={11}
                />
                <YAxis axisLine={false} tickLine={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey="a"
                  name="Arrivées"
                  fill="#155d47"
                  radius={[5, 5, 0, 0]}
                />
                <Bar
                  dataKey="d"
                  name="Départs"
                  fill="#9dc8b7"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-6">
          <h3 className="font-semibold">Répartition par service</h3>
          <p className="text-xs text-[#6f827a]">Part des courriers actifs</p>
          <div className="h-[280px]">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={byService}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {byService.map((_, i) => (
                    <Cell key={i} fill={colors[i]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="mt-5 card overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h3 className="font-semibold">Alertes et échéances</h3>
            <p className="text-xs text-[#6f827a]">
              Urgents, recommandés ou délais dépassés
            </p>
          </div>
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
            {urgent.length} alertes
          </span>
        </div>
        {urgent.map((c) => (
          <button
            key={c.id}
            onClick={() => open(c)}
            className="grid w-full gap-2 border-b px-5 py-4 text-left hover:bg-[#f8faf9] sm:grid-cols-[145px_1fr_160px_120px] sm:items-center"
          >
            <b className="text-sm">{c.numero}</b>
            <span>
              <strong className="block text-sm">{c.objet}</strong>
              <small className="text-[#708179]">{c.tiers}</small>
            </span>
            <span className="text-xs">{c.service}</span>
            <span
              className={`tag ${c.echeance < "2026-08-27" ? "tag-red" : "tag-amber"}`}
            >
              {c.echeance < "2026-08-27" ? "Échéance dépassée" : "Urgent"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Courriers({
  items,
  query,
  setQuery,
  status,
  setStatus,
  service,
  setService,
  open,
  exportCSV,
  setDialog,
}: any) {
  return (
    <div>
      <PageHead
        title="Registre des courriers"
        desc="Rechercher, filtrer et consulter l’ensemble des arrivées et départs."
        actions={
          <>
            <button onClick={exportCSV} className="btn-light">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setDialog("in")} className="btn-main">
              <Plus size={16} /> Enregistrer
            </button>
          </>
        }
      />
      <div className="card mb-4 grid gap-3 p-4 md:grid-cols-[1fr_180px_200px]">
        <label className="field-row">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="N° chrono, expéditeur, objet…"
          />
        </label>
        <select
          className="control"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option>Tous</option>
          {[...new Set(seed.map((x) => x.statut))].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          className="control"
          value={service}
          onChange={(e) => setService(e.target.value)}
        >
          <option>Tous</option>
          {services.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-[#e8efec] text-left text-[10px] uppercase tracking-wider text-[#587067]">
              <th>N° chrono</th>
              <th>Date</th>
              <th>Correspondant / objet</th>
              <th>Service</th>
              <th>Statut</th>
              <th>Échéance</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c: Courrier) => (
              <tr
                key={c.id}
                onClick={() => open(c)}
                className="cursor-pointer border-t hover:bg-[#f8faf9]"
              >
                <td>
                  <b>{c.numero}</b>
                  <span
                    className={`ml-2 rounded px-1.5 py-0.5 text-[9px] ${c.sens === "Arrivée" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}
                  >
                    {c.sens}
                  </span>
                </td>
                <td>{fmt(c.date)}</td>
                <td>
                  <b className="block">{c.tiers}</b>
                  <small className="text-[#6b7d75]">{c.objet}</small>
                </td>
                <td>{c.service}</td>
                <td>
                  <span className="tag">{c.statut}</span>
                </td>
                <td
                  className={
                    c.echeance < "2026-08-27" ? "font-bold text-red-600" : ""
                  }
                >
                  {fmt(c.echeance)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Circuit({ items, setItems, notify }: any) {
  const cols = [
    "Reçu",
    "Ventilé",
    "En cours de traitement",
    "En attente de signature",
    "En attente de réponse",
    "Traité",
    "Expédié",
  ];
  const advance = (c: Courrier) => {
    const i = cols.indexOf(c.statut),
      n = cols[Math.min(i + 1, cols.length - 1)];
    setItems((v: Courrier[]) =>
      v.map((x) => (x.id === c.id ? { ...x, statut: n } : x)),
    );
    notify(`${c.numero} passe au statut « ${n} »`);
  };
  return (
    <div>
      <PageHead
        title="Circuit de traitement"
        desc="Suivi opérationnel des dossiers par étape, responsable et échéance."
      />
      <div className="grid gap-4 xl:grid-cols-4">
        {cols.slice(0, 4).map((col) => (
          <section key={col} className="rounded-2xl bg-[#e7edeb] p-3">
            <div className="mb-3 flex items-center justify-between px-1">
              <b className="text-sm">{col}</b>
              <span className="tag">
                {items.filter((x: Courrier) => x.statut === col).length}
              </span>
            </div>
            {items
              .filter((x: Courrier) => x.statut === col)
              .map((c: Courrier) => (
                <article
                  key={c.id}
                  className="mb-3 rounded-xl bg-white p-4 shadow-sm"
                >
                  <span className="text-[10px] font-bold text-[#5e766b]">
                    {c.numero}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold leading-5">
                    {c.objet}
                  </h3>
                  <p className="mt-2 text-xs text-[#718078]">
                    {c.responsable} • {c.service}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={
                        c.echeance < "2026-08-27"
                          ? "text-xs font-bold text-red-600"
                          : "text-xs"
                      }
                    >
                      {fmt(c.echeance)}
                    </span>
                    <button
                      onClick={() => advance(c)}
                      className="rounded-lg bg-[#123f31] p-2 text-white"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </article>
              ))}
          </section>
        ))}
      </div>
    </div>
  );
}

function Registres({ items, exportCSV, notify }: any) {
  return (
    <div>
      <PageHead
        title="Registres officiels"
        desc="Éditions réglementaires du registre arrivée et du registre départ, exercice 2026."
      />
      <div className="grid gap-5 md:grid-cols-2">
        {["Arrivée", "Départ"].map((s) => (
          <div key={s} className="card overflow-hidden">
            <div className="bg-[#123f31] p-6 text-white">
              <BookOpen className="text-[#d5f65a]" />
              <h3 className="mt-5 text-xl font-semibold">
                Registre courrier {s.toLowerCase()}
              </h3>
              <p className="mt-1 text-sm text-white/55">
                Exercice 2026 •{" "}
                {items.filter((x: Courrier) => x.sens === s).length} écritures
                affichées
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 p-5">
              <button
                onClick={() => {
                  window.print();
                  notify("Impression préparée");
                }}
                className="btn-light justify-center"
              >
                <Printer size={16} /> Imprimer
              </button>
              <button onClick={exportCSV} className="btn-main justify-center">
                <Download size={16} /> Exporter
              </button>
            </div>
          </div>
        ))}
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
    </div>
  );
}

function Contacts({ contacts, setContacts, notify }: any) {
  const [q, setQ] = useState("");
  const add = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setContacts((v: Contact[]) => [
      ...v,
      {
        id: Date.now(),
        nom: String(f.get("nom")),
        categorie: String(f.get("categorie")),
        email: String(f.get("email")),
        telephone: String(f.get("telephone")),
      },
    ]);
    e.currentTarget.reset();
    notify("Contact ajouté au répertoire");
  };
  return (
    <div>
      <PageHead
        title="Répertoire administratif"
        desc="Contacts récurrents : administrations, associations, entreprises et élus."
      />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="card">
          <div className="border-b p-4">
            <label className="field-row">
              <Search size={16} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un contact…"
              />
            </label>
          </div>
          {contacts
            .filter((c: Contact) =>
              c.nom.toLowerCase().includes(q.toLowerCase()),
            )
            .map((c: Contact) => (
              <div
                key={c.id}
                className="grid gap-2 border-b p-5 sm:grid-cols-[1fr_160px_180px]"
              >
                <div>
                  <b>{c.nom}</b>
                  <small className="block text-[#6c7c75]">{c.email}</small>
                </div>
                <span className="tag w-fit">{c.categorie}</span>
                <span className="text-sm">{c.telephone}</span>
              </div>
            ))}
        </div>
        <form onSubmit={add} className="card h-fit p-5">
          <h3 className="font-semibold">Ajouter un contact</h3>
          <div className="mt-4 space-y-3">
            <input
              className="control w-full"
              name="nom"
              placeholder="Nom ou organisme"
              required
            />
            <select className="control w-full" name="categorie">
              <option>Administration</option>
              <option>Association</option>
              <option>Entreprise</option>
              <option>Élu</option>
              <option>Citoyen</option>
            </select>
            <input
              className="control w-full"
              name="email"
              type="email"
              placeholder="Adresse email"
            />
            <input
              className="control w-full"
              name="telephone"
              placeholder="Téléphone"
            />
            <button className="btn-main w-full justify-center">
              <Plus size={16} /> Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Administration({
  users,
  setUsers,
  notify,
}: {
  users: AppUser[];
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>;
  notify: (x: string) => void;
}) {
  const [view, setView] = useState("utilisateurs");
  const add = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setUsers((v) => [
      ...v,
      {
        id: Date.now(),
        nom: String(f.get("nom")),
        email: String(f.get("email")),
        role: String(f.get("role")) as AppUser["role"],
        service: String(f.get("service")),
        actif: true,
      },
    ]);
    e.currentTarget.reset();
    notify("Compte utilisateur créé");
  };
  return (
    <div>
      <PageHead
        title="Administration municipale"
        desc="Agents communaux, fonctions, habilitations, services et paramètres de sécurité."
      />
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="mb-5 bg-[#e2eae6] p-1">
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="roles">Rôles & permissions</TabsTrigger>
          <TabsTrigger value="services">Services & directions</TabsTrigger>
          <TabsTrigger value="parametres">Paramètres</TabsTrigger>
        </TabsList>
        <TabsContent value="utilisateurs">
          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[780px] text-sm">
                <thead>
                  <tr className="bg-[#e8efec] text-left text-[10px] uppercase tracking-wider text-[#587067]">
                    <th>Utilisateur</th>
                    <th>Rôle</th>
                    <th>Service</th>
                    <th>État</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t">
                      <td>
                        <b className="block">{u.nom}</b>
                        <small className="text-[#6b7d75]">{u.email}</small>
                      </td>
                      <td>
                        <span className="tag">{u.role}</span>
                      </td>
                      <td>{u.service}</td>
                      <td>
                        <span className={`tag ${u.actif ? "" : "tag-red"}`}>
                          {u.actif ? "Actif" : "Désactivé"}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            setUsers((v) =>
                              v.map((x) =>
                                x.id === u.id ? { ...x, actif: !x.actif } : x,
                              ),
                            );
                            notify(
                              u.actif ? "Compte désactivé" : "Compte activé",
                            );
                          }}
                          className="btn-light py-2"
                        >
                          {u.actif ? "Désactiver" : "Activer"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <form onSubmit={add} className="card h-fit p-5">
              <h3 className="font-semibold">Créer un utilisateur</h3>
              <p className="mt-1 text-xs text-[#6a7d74]">
                Un mot de passe temporaire sera demandé à la première connexion.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  className="control w-full"
                  name="nom"
                  placeholder="Nom complet"
                  required
                />
                <input
                  className="control w-full"
                  name="email"
                  type="email"
                  placeholder="Adresse professionnelle"
                  required
                />
                <select className="control w-full" name="role">
                  <option>Administrateur système</option>
                  <option>Secrétariat général / Bureau du courrier</option>
                  <option>DGS / Secrétaire municipal</option>
                  <option>Chef de service municipal</option>
                  <option>Agent communal</option>
                </select>
                <select className="control w-full" name="service">
                  {services.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <button className="btn-main w-full justify-center">
                  <Plus size={16} /> Créer le compte
                </button>
              </div>
            </form>
          </div>
        </TabsContent>
        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              [
                "Administrateur système",
                "Administre les comptes, habilitations, services, paramètres, sauvegardes et journaux.",
              ],
              [
                "Secrétariat général / Bureau du courrier",
                "Réception, enregistrement chrono, numérisation, ventilation, expédition et tenue des registres officiels.",
              ],
              [
                "DGS / Secrétaire municipal",
                "Supervision générale, instructions, ventilation stratégique, circuit de signature et contrôle des délais.",
              ],
              [
                "Chef de service municipal",
                "Courriers de son service, attribution aux agents, instructions et validation des projets de réponse.",
              ],
              [
                "Agent communal",
                "Dossiers affectés, compte rendu, préparation de réponse et ajout de pièces justificatives.",
              ],
            ].map(([r, d]) => (
              <article key={r} className="card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-[#e4f0eb]">
                    <ShieldCheck size={19} />
                  </span>
                  <h3 className="font-semibold">{r}</h3>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#63776e]">{d}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    "Consulter",
                    "Créer",
                    "Modifier",
                    "Affecter",
                    "Valider",
                  ].map((p, i) => (
                    <span
                      key={p}
                      className={`tag ${r === "Agent communal" && i > 2 ? "opacity-30" : ""}`}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="services">
          <div className="card overflow-hidden">
            {services.map((s, i) => (
              <div
                key={s}
                className="grid gap-3 border-b p-5 sm:grid-cols-[70px_1fr_220px_120px] sm:items-center"
              >
                <span className="text-xs font-bold text-[#6c8077]">
                  SRV-{String(i + 1).padStart(2, "0")}
                </span>
                <b>{s}</b>
                <span className="text-sm text-[#6b7d75]">
                  Direction municipale
                </span>
                <button
                  onClick={() => notify(`Paramètres de « ${s} » ouverts`)}
                  className="btn-light justify-center py-2"
                >
                  Configurer
                </button>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="parametres">
          <div className="grid gap-4 md:grid-cols-2">
            <Setting
              title="Numérotation annuelle"
              text="ARR-{année}-{chrono} et DEP-{année}-{chrono}"
            />
            <Setting
              title="Sécurité des comptes"
              text="Verrouillage après 5 échecs • session de 30 minutes"
            />
            <Setting
              title="Réinitialisation"
              text="Lien temporaire et changement obligatoire à la connexion"
            />
            <Setting
              title="Journalisation"
              text="Connexions, changements de rôles et actions sensibles conservés"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Login({
  onLogin,
  users,
}: {
  onLogin: (user: AppUser) => void;
  users: AppUser[];
}) {
  const [sent, setSent] = useState(false),
    [error, setError] = useState("");
  return (
    <main className="grid min-h-screen place-items-center bg-[#123f31] p-5">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <div className="mb-7 flex items-center gap-3">
          <span className="grid size-16 place-items-center overflow-hidden rounded-xl border bg-white p-1"><img src="/logo-mairie-ziguinchor.jpeg" alt="Logo de la Commune de Ziguinchor" className="h-full w-full object-contain" /></span>
          <div>
            <h1 className="text-xl font-semibold">Mairie de Ziguinchor</h1>
            <p className="text-sm text-[#6c7e76]">
              Espace administratif sécurisé
            </p>
          </div>
        </div>
        {!sent ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget),
                email = String(f.get("email")).toLowerCase(),
                password = String(f.get("password"));
              const user = users.find((u) => u.email.toLowerCase() === email);
              if (!user) {
                setError(
                  "Adresse inconnue. Utilisez l’un des comptes de démonstration.",
                );
                return;
              }
              if (!user.actif) {
                setError(
                  "Ce compte municipal est désactivé. Contactez l’administrateur.",
                );
                return;
              }
              if (password !== "demo2026") {
                setError(
                  "Mot de passe incorrect. Mot de passe de démonstration : demo2026",
                );
                return;
              }
              setError("");
              onLogin(user);
            }}
            className="space-y-4"
          >
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">
                Adresse professionnelle
              </span>
              <input
                className="control w-full"
                name="email"
                type="email"
                placeholder="nom@mairie.sn"
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold">
                Mot de passe
              </span>
              <input
                className="control w-full"
                name="password"
                type="password"
                placeholder="Votre mot de passe"
                required
              />
            </label>
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </p>
            )}
            <button className="btn-main w-full justify-center">
              Se connecter
            </button>
            <div className="rounded-xl border border-[#dce5e1] bg-[#f7f9f8] p-3 text-xs text-[#5b7067]">
              <b className="block text-[#294d3f]">Comptes de démonstration</b>
              <div className="mt-2 space-y-1">
                {users
                  .filter((u) => u.actif)
                  .map((u) => (
                    <button
                      type="button"
                      key={u.id}
                      onClick={(e) => {
                        const form = e.currentTarget.closest("form");
                        const input = form?.querySelector<HTMLInputElement>(
                          'input[name="email"]',
                        );
                        if (input) input.value = u.email;
                      }}
                      className="block w-full truncate text-left hover:font-bold"
                    >
                      {u.email} — {u.role}
                    </button>
                  ))}
              </div>
              <p className="mt-2 border-t pt-2">
                Mot de passe commun : <b>demo2026</b>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSent(true)}
              className="w-full text-sm font-bold text-[#18523f]"
            >
              Mot de passe oublié ?
            </button>
          </form>
        ) : (
          <div className="rounded-xl bg-[#e8f3ee] p-5 text-sm">
            <b>Demande enregistrée</b>
            <p className="mt-2 text-[#5c7067]">
              Si le compte existe, un lien de réinitialisation temporaire sera
              envoyé.
            </p>
            <button
              onClick={() => setSent(false)}
              className="mt-4 font-bold text-[#18523f]"
            >
              Retour à la connexion
            </button>
          </div>
        )}
        <p className="mt-7 text-center text-xs text-[#84938d]">
          Accès réservé aux agents habilités de la commune
        </p>
      </div>
    </main>
  );
}

function Setting({ title, text }: { title: string; text: string }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#e8f1ed]">
        <Settings size={18} />
      </span>
      <div>
        <b>{title}</b>
        <p className="mt-1 text-sm leading-6 text-[#687b72]">{text}</p>
      </div>
    </div>
  );
}

function MailForm({
  sens,
  onSubmit,
  users,
}: {
  sens: "Arrivée" | "Départ";
  onSubmit: (f: FormData, s: "Arrivée" | "Départ") => void;
  users: AppUser[];
}) {
  return (
    <form
      action={(fd) => onSubmit(fd, sens)}
      className="grid gap-4 sm:grid-cols-2"
    >
      <Field l={sens === "Arrivée" ? "Date de réception" : "Date d’envoi"}>
        <input name="date" type="date" defaultValue="2026-08-27" required />
      </Field>
      <Field l="Échéance de traitement">
        <input name="echeance" type="date" defaultValue="2026-09-03" required />
      </Field>
      <Field l={sens === "Arrivée" ? "Expéditeur" : "Destinataire"} wide>
        <input
          name="tiers"
          placeholder="Citoyen, administration, entreprise…"
          required
        />
      </Field>
      <Field l="Objet" wide>
        <textarea
          name="objet"
          rows={3}
          placeholder="Objet administratif précis"
          required
        />
      </Field>
      <Field l={sens === "Arrivée" ? "Type de courrier" : "Mode d’envoi"}>
        <select name="type">
          {(sens === "Arrivée"
            ? ["Lettre", "Recommandé", "Colis", "Email", "Dépôt physique"]
            : [
                "Courrier simple",
                "Recommandé avec AR",
                "Email",
                "Remise en main propre",
              ]
          ).map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      <Field
        l={sens === "Arrivée" ? "Service destinataire" : "Service émetteur"}
      >
        <select name="service">
          {services.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </Field>
      {sens === "Arrivée" && (
        <Field l="Agent responsable *">
          <select name="responsable" required defaultValue="">
            <option value="" disabled>
              Sélectionner obligatoirement un agent
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
      <Field l="Priorité">
        <select name="priorite">
          <option>Normale</option>
          <option>Urgente</option>
        </select>
      </Field>
      {sens === "Départ" && (
        <Field l="Signataire">
          <select name="signataire">
            <option>Maire</option>
            <option>Adjoint au Maire</option>
            <option>DGS</option>
            <option>Chef de service municipal</option>
          </select>
        </Field>
      )}
      <Field l="Pièces jointes" wide>
        <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
      </Field>
      <div className="sm:col-span-2 flex justify-end">
        <button className="btn-main">
          <CheckCircle2 size={17} /> Enregistrer dans le registre
        </button>
      </div>
    </form>
  );
}
function Detail({ c, update }: { c: Courrier; update: (s: string) => void }) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>{c.numero}</DialogTitle>
        <DialogDescription>
          {c.sens} • enregistré le {fmt(c.date)}
        </DialogDescription>
      </DialogHeader>
      <div className="rounded-xl bg-[#edf2f0] p-5">
        <h3 className="font-semibold">{c.objet}</h3>
        <p className="mt-2 text-sm text-[#64776e]">{c.tiers}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <D l="Service" v={c.service} />
        <D l="Responsable" v={c.responsable} />
        <D l="Priorité" v={c.priorite} />
        <D l="Échéance" v={fmt(c.echeance)} />
        <D l="Mode / type" v={c.type} />
        <D l="Signataire" v={c.signataire || "—"} />
      </div>
      {c.notes && (
        <div className="rounded-xl border-l-4 border-[#d4a72e] bg-amber-50 p-4 text-sm">
          <b>Annotation</b>
          <p>{c.notes}</p>
        </div>
      )}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase text-[#61756c]">
          Modifier le statut
        </label>
        <select
          className="control w-full"
          value={c.statut}
          onChange={(e) => update(e.target.value)}
        >
          {[
            "Reçu",
            "Ventilé",
            "En cours de traitement",
            "En attente de réponse",
            "En attente de signature",
            "Signé",
            "Expédié",
            "Traité",
            "Archivé",
          ].map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
      </div>
    </>
  );
}
function PageHead({
  title,
  desc,
  actions,
}: {
  title: string;
  desc: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 text-sm text-[#687d74]">{desc}</p>
      </div>
      <div className="flex gap-2">{actions}</div>
    </div>
  );
}
function Field({
  l,
  children,
  wide,
}: {
  l: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-bold text-[#52685e]">{l}</span>
      <div className="form-control">{children}</div>
    </label>
  );
}
function D({ l, v }: { l: string; v: string }) {
  return (
    <div>
      <small className="text-[#75867f]">{l}</small>
      <b className="block">{v}</b>
    </div>
  );
}
function Doc({
  title,
  text,
  notify,
}: {
  title: string;
  text: string;
  notify: (x: string) => void;
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e6f1ed]">
        <FileText />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-[#6a7c74]">{text}</p>
        <button
          onClick={() => notify(`${title} prêt à être édité`)}
          className="mt-3 text-sm font-bold text-[#12503d]"
        >
          Créer le document →
        </button>
      </div>
    </div>
  );
}
const fmt = (d: string) =>
  new Date(d + "T00:00:00").toLocaleDateString("fr-FR");
