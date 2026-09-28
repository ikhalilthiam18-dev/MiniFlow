"use client";
import { useState } from "react";
import {
  Building,
  KeyRound,
  ListOrdered,
  Plus,
  ScrollText,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  adminSetPassword,
  createAdminUser,
  createService,
  patchAdminUser,
  patchService,
  type ApiService,
} from "@/lib/api";
import {
  roleCourt,
  roles,
  type AppUser,
  type Courrier,
  type Notify,
} from "@/lib/mairie";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Avatar,
  Badge,
  ConfirmDialog,
  Empty,
  Field,
  PageHead,
  Pagination,
  Spinner,
  StatCard,
  usePagination,
} from "./ui";
import { PasswordFields } from "./password";

const descriptionsRoles: Record<AppUser["role"], string> = {
  "Administrateur système":
    "Administre les comptes, habilitations, services, paramètres, sauvegardes et journaux.",
  "Secrétariat général / Bureau du courrier":
    "Réception, enregistrement chrono, numérisation, ventilation, expédition et tenue des registres officiels.",
  "DGS / Secrétaire municipal":
    "Supervision générale, instructions, ventilation stratégique, circuit de signature et contrôle des délais.",
  "Chef de service municipal":
    "Courriers de son service, attribution aux agents, instructions et validation des projets de réponse.",
  "Agent communal":
    "Dossiers affectés, compte rendu, préparation de réponse et ajout de pièces justificatives.",
};

export function Administration({
  users,
  items,
  services,
  onUsersChange,
  onServicesChange,
  notify,
}: {
  users: AppUser[];
  items: Courrier[];
  services: ApiService[];
  onUsersChange: React.Dispatch<React.SetStateAction<AppUser[]>>;
  onServicesChange: React.Dispatch<React.SetStateAction<ApiService[]>>;
  notify: Notify;
}) {
  const [view, setView] = useState("utilisateurs");
  const [nouveauService, setNouveauService] = useState("");
  const [serviceBusy, setServiceBusy] = useState<number | "new" | null>(null);
  const [serviceAction, setServiceAction] = useState<ApiService | null>(null);
  const servicesActifs = services.filter((s) => s.actif);
  const ajouterService = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const nom = nouveauService.trim();
    if (!nom) return;
    setServiceBusy("new");
    try {
      const s = await createService(nom);
      onServicesChange((v) => [...v, s].sort((a, b) => a.nom.localeCompare(b.nom)));
      setNouveauService("");
      notify(`Service « ${s.nom} » ajouté`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Impossible d’ajouter le service", "error");
    } finally {
      setServiceBusy(null);
    }
  };
  const [q, setQ] = useState("");
  const [roleFiltre, setRoleFiltre] = useState("Tous");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [toggle, setToggle] = useState<AppUser | null>(null);
  const [reset, setReset] = useState<AppUser | null>(null);
  const [pwdValid, setPwdValid] = useState(false);
  const [formError, setFormError] = useState("");
  const list = users.filter(
    (u) =>
      (roleFiltre === "Tous" || u.role === roleFiltre) &&
      `${u.nom} ${u.email} ${u.service}`.toLowerCase().includes(q.toLowerCase()),
  );
  const pg = usePagination(list, 10);
  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    setFormError("");
    try {
      const u = await createAdminUser({
        nom: String(f.get("nom")),
        email: String(f.get("email")),
        role: String(f.get("role")) as AppUser["role"],
        service: String(f.get("service")),
        password: String(f.get("new")),
      });
      onUsersChange((v) => [...v, u]);
      form.reset();
      setCreating(false);
      notify(`Compte créé. Communiquez le mot de passe provisoire à ${u.nom} : il pourra le changer après connexion.`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Impossible de créer le compte.");
    } finally {
      setBusy(false);
    }
  };
  const actifs = users.filter((u) => u.actif).length;
  return (
    <div>
      <PageHead
        eyebrow="Système"
        title="Administration municipale"
        desc="Agents communaux, fonctions, habilitations, services et paramètres de sécurité."
        actions={
          <button onClick={() => setCreating(true)} className="btn-main">
            <Plus size={16} /> Créer un utilisateur
          </button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <StatCard label="Comptes utilisateurs" value={users.length} icon={ShieldCheck} tone="green" />
        <StatCard label="Comptes actifs" value={actifs} icon={UserCheck} tone="blue" />
        <StatCard label="Comptes désactivés" value={users.length - actifs} icon={UserX} tone="gray" />
      </div>
      <Tabs value={view} onValueChange={setView}>
        <TabsList className="mb-5 h-auto flex-wrap bg-[#e6ece9] p-1">
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="roles">Rôles & permissions</TabsTrigger>
          <TabsTrigger value="services">Services & directions</TabsTrigger>
          <TabsTrigger value="parametres">Paramètres</TabsTrigger>
        </TabsList>

        <TabsContent value="utilisateurs">
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
              <label className="field-row flex-1">
                <Search size={16} />
                <input value={q} onChange={(e) => { setQ(e.target.value); pg.setPage(1); }} placeholder="Rechercher un agent…" aria-label="Rechercher un agent" />
              </label>
              <select className="control sm:w-64" value={roleFiltre} onChange={(e) => { setRoleFiltre(e.target.value); pg.setPage(1); }} aria-label="Filtrer par rôle">
                <option value="Tous">Tous les rôles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>{roleCourt[r]}</option>
                ))}
              </select>
            </div>
            {list.length === 0 ? (
              <Empty text="Aucun utilisateur ne correspond à ces critères." />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="data-table min-w-[900px]">
                    <thead>
                      <tr>
                        <th>Utilisateur</th>
                        <th>Rôle</th>
                        <th>Service</th>
                        <th>État</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pg.pageItems.map((u) => (
                        <tr key={u.id}>
                          <td>
                            <span className="flex items-center gap-3">
                              <Avatar name={u.nom} src={u.avatar} size={36} />
                              <span className="min-w-0">
                                <b className="block truncate">{u.nom}</b>
                                <small className="text-muted-ink">{u.email}</small>
                              </span>
                            </span>
                          </td>
                          <td><Badge tone={u.role === "Administrateur système" ? "blue" : "gray"}>{roleCourt[u.role]}</Badge></td>
                          <td className="text-muted-ink">{u.service}</td>
                          <td>
                            <Badge tone={u.actif ? "green" : "red"}>
                              <span className="size-1.5 rounded-full bg-current" />
                              {u.actif ? "Actif" : "Désactivé"}
                            </Badge>
                          </td>
                          <td className="text-right">
                            <span className="inline-flex gap-2">
                            <button onClick={() => { setPwdValid(false); setFormError(""); setReset(u); }} className="btn-light btn-sm" title={`Réinitialiser le mot de passe de ${u.nom}`}>
                              <KeyRound size={14} /> Mot de passe
                            </button>
                            <button onClick={() => setToggle(u)} className={`${u.actif ? "btn-danger" : "btn-light"} btn-sm`}>
                              {u.actif ? <UserX size={14} /> : <UserCheck size={14} />}
                              {u.actif ? "Désactiver" : "Activer"}
                            </button>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination {...pg} label="utilisateurs" />
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((r) => (
              <article key={r} className="card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-100 text-brand-700">
                    <ShieldCheck size={19} />
                  </span>
                  <div>
                    <h3 className="font-semibold text-ink">{r}</h3>
                    <small className="text-xs text-muted-ink">
                      {users.filter((u) => u.role === r).length} compte(s)
                    </small>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-ink">{descriptionsRoles[r]}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["Consulter", "Créer", "Modifier", "Affecter", "Valider"].map((p, i) => {
                    const ok = !(r === "Agent communal" && i > 2);
                    return (
                      <span key={p} className={`tag ${ok ? "tag-green" : "tag-gray line-through opacity-60"}`}>
                        {p}
                      </span>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="services">
          <div className="card overflow-hidden">
            <form onSubmit={ajouterService} className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row">
              <label className="field-row flex-1">
                <Building size={16} />
                <input
                  value={nouveauService}
                  onChange={(e) => setNouveauService(e.target.value)}
                  placeholder="Nom du nouveau service ou de la direction…"
                  aria-label="Nom du nouveau service"
                />
              </label>
              <button disabled={!nouveauService.trim() || serviceBusy === "new"} className="btn-main">
                {serviceBusy === "new" ? <Spinner className="size-4" /> : <Plus size={16} />} Ajouter le service
              </button>
            </form>
            <div className="overflow-x-auto">
              <table className="data-table min-w-[720px]">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Agents actifs</th>
                    <th>Courriers</th>
                    <th>État</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {services.map((s) => (
                    <tr key={s.id} className={s.actif ? "" : "opacity-60"}>
                      <td>
                        <span className="flex items-center gap-2.5 font-semibold">
                          <Building size={16} className="text-brand-600" /> {s.nom}
                        </span>
                      </td>
                      <td>{users.filter((u) => u.service === s.nom && u.actif).length}</td>
                      <td>{items.filter((c) => c.service === s.nom).length}</td>
                      <td>
                        <Badge tone={s.actif ? "green" : "gray"}>{s.actif ? "Actif" : "Désactivé"}</Badge>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => setServiceAction(s)}
                          disabled={serviceBusy === s.id}
                          className={`${s.actif ? "btn-light" : "btn-main"} btn-sm`}
                        >
                          {s.actif ? "Désactiver" : "Réactiver"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-5 py-3 text-xs text-muted-ink">
              Un service désactivé n’est plus proposé pour les nouveaux courriers et comptes ; les dossiers existants restent inchangés.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="parametres">
          <div className="grid gap-4 md:grid-cols-2">
            <Setting icon={ListOrdered} title="Numérotation des courriers" text="Attribuée automatiquement : ARR-{année}-{chrono} pour les arrivées, DEP-{année}-{chrono} pour les départs • repart à 0001 chaque année, sans doublon possible" />
            <Setting icon={ShieldCheck} title="Sessions" text="Session de 60 minutes, prolongée automatiquement pendant 7 jours • un compte désactivé ne peut plus se connecter" />
            <Setting icon={KeyRound} title="Mots de passe" text="8 caractères minimum, ni trop courant, ni uniquement numérique • mot de passe provisoire défini par l’administrateur, modifiable par l’agent depuis son profil" />
            <Setting icon={ScrollText} title="Traçabilité" text="Chaque changement de statut d’un courrier est enregistré (date et auteur) et consultable dans sa fiche • les modifications faites dans l’administration Django sont également historisées" />
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={creating} onOpenChange={(o) => { setCreating(o); setPwdValid(false); setFormError(""); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
            <DialogDescription>
              Choisissez un mot de passe provisoire et communiquez-le à l’agent : il pourra le changer depuis son profil.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom complet" wide required>
              <input name="nom" placeholder="Prénom et nom" required />
            </Field>
            <Field label="Adresse professionnelle" wide required>
              <input name="email" type="email" placeholder="nom@mairie.sn" required />
            </Field>
            <Field label="Rôle">
              <select name="role">
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Service">
              <select name="service">
                {servicesActifs.map((s) => (
                  <option key={s.id}>{s.nom}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <PasswordFields onValidChange={setPwdValid} withGenerator label="Mot de passe provisoire" />
            </div>
            {formError && (
              <p role="alert" className="rounded-xl border border-[#f6cdc9] bg-[#fdecea] p-3 text-xs font-medium text-[#a3211a] sm:col-span-2">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setCreating(false)} className="btn-ghost">Annuler</button>
              <button disabled={busy || !pwdValid} className="btn-main">
                {busy ? <Spinner className="size-4" /> : <Plus size={16} />} Créer le compte
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reset} onOpenChange={(o) => !o && setReset(null)}>
        <DialogContent className="grid-cols-[minmax(0,1fr)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Nouveau mot de passe provisoire pour {reset?.nom}. Communiquez-le à l’agent : il pourra le
              changer depuis son profil.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!reset) return;
              const pwd = String(new FormData(e.currentTarget).get("new"));
              setBusy(true);
              setFormError("");
              try {
                await adminSetPassword(reset.id, pwd);
                notify(`Mot de passe de ${reset.nom} réinitialisé`);
                setReset(null);
              } catch (err) {
                setFormError(err instanceof Error ? err.message : "Réinitialisation impossible.");
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-4"
          >
            <PasswordFields onValidChange={setPwdValid} withGenerator label="Nouveau mot de passe provisoire" />
            {formError && (
              <p role="alert" className="rounded-xl border border-[#f6cdc9] bg-[#fdecea] p-3 text-xs font-medium text-[#a3211a]">
                {formError}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReset(null)} className="btn-ghost">Annuler</button>
              <button disabled={busy || !pwdValid} className="btn-main">
                {busy ? <Spinner className="size-4" /> : <KeyRound size={16} />} Réinitialiser
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!serviceAction}
        onOpenChange={(o) => !o && setServiceAction(null)}
        danger={serviceAction?.actif}
        title={serviceAction?.actif ? "Désactiver ce service ?" : "Réactiver ce service ?"}
        description={
          serviceAction?.actif
            ? `« ${serviceAction?.nom} » ne sera plus proposé pour les nouveaux courriers et comptes.`
            : `« ${serviceAction?.nom} » sera de nouveau proposé.`
        }
        confirmLabel={serviceAction?.actif ? "Désactiver" : "Réactiver"}
        onConfirm={async () => {
          if (!serviceAction) return;
          setServiceBusy(serviceAction.id);
          try {
            const maj = await patchService(serviceAction.id, { actif: !serviceAction.actif });
            onServicesChange((v) => v.map((x) => (x.id === maj.id ? maj : x)));
            notify(maj.actif ? "Service réactivé" : "Service désactivé");
          } catch {
            notify("Action impossible", "error");
          } finally {
            setServiceBusy(null);
          }
        }}
      />

      <ConfirmDialog
        open={!!toggle}
        onOpenChange={(o) => !o && setToggle(null)}
        danger={toggle?.actif}
        title={toggle?.actif ? "Désactiver ce compte ?" : "Réactiver ce compte ?"}
        description={
          toggle?.actif
            ? `${toggle?.nom} ne pourra plus se connecter à la plateforme.`
            : `${toggle?.nom} pourra de nouveau se connecter à la plateforme.`
        }
        confirmLabel={toggle?.actif ? "Désactiver" : "Réactiver"}
        onConfirm={async () => {
          if (!toggle) return;
          try {
            const updated = await patchAdminUser(toggle.id, { actif: !toggle.actif });
            onUsersChange((v) => v.map((x) => (x.id === toggle.id ? updated : x)));
            notify(toggle.actif ? "Compte désactivé" : "Compte réactivé");
          } catch {
            notify("Action impossible", "error");
          }
        }}
      />
    </div>
  );
}

function Setting({ icon: Icon, title, text }: { icon: typeof Settings; title: string; text: string }) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
        <Icon size={18} />
      </span>
      <div>
        <b className="text-ink">{title}</b>
        <p className="mt-1 text-sm leading-6 text-muted-ink">{text}</p>
      </div>
    </div>
  );
}
