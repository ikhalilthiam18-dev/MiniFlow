"use client";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toaster } from "@/components/ui/sonner";
import {
  clearSession,
  createCourrier,
  fetchAccounts,
  fetchAdminUsers,
  fetchContacts,
  fetchCourriers,
  fetchMe,
  fetchNotifications,
  fetchServices,
  getStoredAccessToken,
  markAllNotificationsRead,
  markNotificationRead,
  patchCourrier,
  updateProfileAvatar,
  uploadPieces,
  type ApiService,
} from "@/lib/api";
import {
  enRetard,
  exporterCSV,
  filtrerCourriers,
  filtresVides,
  isClos,
  rolesCreation,
  rolesVueGlobale,
  servicesParDefaut,
  today,
  type AppNotification,
  type AppUser,
  type Contact,
  type Courrier,
  type CourrierFilters,
  type Notify,
  type Stats,
} from "@/lib/mairie";
import Landing from "@/components/mairie/landing";
import { Login } from "@/components/mairie/login";
import { Sidebar, Topbar, type Tab } from "@/components/mairie/shell";
import { ConfirmDialog, ErrorState, LoadingScreen, Spinner } from "@/components/mairie/ui";
import { Dashboard } from "@/components/mairie/dashboard";
import { CourrierDetail, CourriersPage, MailForm } from "@/components/mairie/courriers";
import { Circuit } from "@/components/mairie/circuit";
import { Registres } from "@/components/mairie/registres";
import { Statistiques } from "@/components/mairie/statistiques";
import { Contacts } from "@/components/mairie/contacts";
import { Administration } from "@/components/mairie/administration";
import { NotificationsPanel, ProfilePanel } from "@/components/mairie/account";
import { ChangePasswordForm } from "@/components/mairie/password";

export default function Home() {
  const [tab, setTab] = useState<Tab>("dashboard"),
    [mobile, setMobile] = useState(false),
    [dialog, setDialog] = useState<"in" | "out" | "detail" | "profile" | "password" | null>(null),
    [notifOpen, setNotifOpen] = useState(false),
    [confirmLogout, setConfirmLogout] = useState(false),
    [selected, setSelected] = useState<Courrier | null>(null),
    [filters, setFilters] = useState<CourrierFilters>(filtresVides),
    [logged, setLogged] = useState(false),
    [role, setRole] = useState<AppUser["role"]>("Agent communal"),
    [currentUser, setCurrentUser] = useState("");
  const [items, setItems] = useState<Courrier[]>([]),
    [contacts, setContacts] = useState<Contact[]>([]),
    [users, setUsers] = useState<AppUser[]>([]),
    [notifications, setNotifications] = useState<AppNotification[]>([]),
    [avatars, setAvatars] = useState<Record<string, string>>({}),
    [services, setServices] = useState<ApiService[]>([]),
    [booting, setBooting] = useState(true),
    [loading, setLoading] = useState(false),
    [loadError, setLoadError] = useState(""),
    [screen, setScreen] = useState<"home" | "login">("home");

  const notify: Notify = (m, kind = "success") => {
    if (kind === "error") toast.error(m);
    else if (kind === "info") toast.info(m);
    else toast.success(m);
  };

  const loadWorkspace = async (user: AppUser) => {
    setLoading(true);
    setLoadError("");
    try {
      const [courriers, reps, notifs, accounts] = await Promise.all([
        fetchCourriers(),
        fetchContacts(),
        fetchNotifications(),
        fetchAccounts(),
      ]);
      setItems(courriers);
      setContacts(reps);
      setNotifications(notifs);
      setUsers(user.role === "Administrateur système" ? await fetchAdminUsers() : accounts);
      setServices(
        await fetchServices().catch(() =>
          servicesParDefaut.map((nom, i) => ({ id: -(i + 1), nom, actif: true })),
        ),
      );
      if (user.avatar) setAvatars((v) => ({ ...v, [user.nom]: user.avatar! }));
    } catch {
      setLoadError(
        "Les données de la plateforme n’ont pas pu être chargées. Vérifiez votre connexion puis réessayez.",
      );
    } finally {
      setLoading(false);
    }
  };
  const openSession = async (user: AppUser) => {
    setRole(user.role);
    setCurrentUser(user.nom);
    setLogged(true);
    await loadWorkspace(user);
  };

  useEffect(() => {
    const restore = async () => {
      if (!getStoredAccessToken()) return;
      await openSession(await fetchMe());
    };
    restore()
      .catch(() => clearSession())
      .finally(() => setBooting(false));
    // openSession only uses state setters, so running this once on mount is intended.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The API already restricts courriers to what the current role may see.
  const scopedItems = items;
  const canCreate = rolesCreation.includes(role);
  const visibleNotifications = rolesVueGlobale.includes(role)
    ? notifications
    : notifications.filter((n) => n.destinataire === currentUser);
  const unread = visibleNotifications.filter((n) => !n.lue).length;
  const currentAccount = users.find((u) => u.nom === currentUser);
  // Tous les services servent au filtrage ; seuls les actifs sont proposés à la saisie.
  const nomsServices = services.map((s) => s.nom);
  const nomsServicesActifs = services.filter((s) => s.actif).map((s) => s.nom);
  const avatar = avatars[currentUser];
  const filtered = useMemo(() => filtrerCourriers(scopedItems, filters), [scopedItems, filters]);
  const stats: Stats = {
    jour: scopedItems.filter((x) => x.date === today()).length,
    attente: scopedItems.filter((x) => !isClos(x)).length,
    retard: scopedItems.filter(enRetard).length,
    signature: scopedItems.filter((x) => x.statut.includes("signature")).length,
    traites: scopedItems.filter(isClos).length,
  };

  const navigate = (t: Tab) => {
    setTab(t);
    setMobile(false);
    window.scrollTo({ top: 0 });
  };
  const openCourrier = (c: Courrier) => {
    setSelected(c);
    setDialog("detail");
  };
  const showFiltered = (f: Partial<CourrierFilters>) => {
    setFilters({ ...filtresVides, ...f });
    navigate("courriers");
  };
  const setAvatarFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Sélectionnez une image valide", "error");
    if (file.size > 2 * 1024 * 1024) return notify("La photo ne doit pas dépasser 2 Mo", "error");
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      updateProfileAvatar(dataUrl)
        .then(() => {
          setAvatars((v) => ({ ...v, [currentUser]: dataUrl }));
          notify("Photo de profil enregistrée");
        })
        .catch(() => notify("Impossible d’enregistrer la photo", "error"));
    };
    reader.readAsDataURL(file);
  };
  const removeAvatar = () =>
    updateProfileAvatar("")
      .then(() => {
        setAvatars((v) => {
          const n = { ...v };
          delete n[currentUser];
          return n;
        });
        notify("Photo supprimée");
      })
      .catch(() => notify("Impossible de supprimer la photo", "error"));
  const add = async (fd: FormData, sens: "Arrivée" | "Départ") => {
    try {
      const c = await createCourrier({
        sens,
        date: String(fd.get("date")),
        tiers: String(fd.get("tiers")),
        objet: String(fd.get("objet")),
        service: String(fd.get("service")),
        type: String(fd.get("type")),
        priorite: String(fd.get("priorite")) as Courrier["priorite"],
        statut: sens === "Arrivée" ? "Reçu" : "En préparation",
        echeance: String(fd.get("echeance")),
        responsable: sens === "Arrivée" ? String(fd.get("responsable")) : "Bureau du courrier",
        signataire: String(fd.get("signataire") || ""),
      });
      setItems((v) => [c, ...v]);
      setDialog(null);
      notify(`${c.numero} enregistré dans le registre ${sens.toLowerCase()}`);
      fetchNotifications().then(setNotifications).catch(() => {});
      const fichiers = fd.getAll("fichiers").filter((f): f is File => f instanceof File && f.size > 0);
      if (fichiers.length) {
        uploadPieces(c.id, fichiers)
          .then((p) => notify(`${p.length} pièce(s) jointe(s) ajoutée(s) à ${c.numero}`))
          .catch((err) =>
            notify(
              `${c.numero} est enregistré, mais les pièces jointes n’ont pas pu être envoyées : ${err instanceof Error ? err.message : "erreur"}. Ajoutez-les depuis la fiche du courrier.`,
              "error",
            ),
          );
      }
    } catch {
      notify("Erreur lors de l’enregistrement du courrier", "error");
    }
  };
  const updateCourrier = async (id: number, patch: Partial<Courrier>) => {
    const updated = await patchCourrier(id, patch);
    setItems((v) => v.map((x) => (x.id === id ? updated : x)));
    return updated;
  };
  const logout = () => {
    clearSession();
    setLogged(false);
    setScreen("home");
    setTab("dashboard");
    setDialog(null);
    setNotifOpen(false);
    setFilters(filtresVides);
    setItems([]);
    setContacts([]);
    setUsers([]);
    setNotifications([]);
    setAvatars({});
    setServices([]);
    notify("Vous êtes déconnecté", "info");
  };

  const toaster = <Toaster theme="light" position="top-right" richColors closeButton />;

  if (booting) return <LoadingScreen text="Chargement de la plateforme…" />;
  if (!logged)
    return (
      <>
        {screen === "home" ? (
          <Landing onLogin={() => setScreen("login")} />
        ) : (
          <Login
            onBack={() => setScreen("home")}
            onLogin={async (user) => {
              await openSession(user);
              notify(`Bienvenue, ${user.nom}`);
            }}
          />
        )}
        {toaster}
      </>
    );

  return (
    <main className="min-h-screen bg-surface text-ink">
      {toaster}
      <Sidebar
        tab={tab}
        onNavigate={navigate}
        open={mobile}
        onClose={() => setMobile(false)}
        role={role}
        userName={currentUser}
        avatar={avatar}
        badges={{ circuit: stats.retard }}
        onLogout={() => setConfirmLogout(true)}
        onPassword={() => {
          setMobile(false);
          setDialog("password");
        }}
      />
      <section className="lg:ml-[264px]">
        <Topbar
          tab={tab}
          onMenu={() => setMobile(true)}
          onSearch={(query) => showFiltered({ query })}
          unread={unread}
          onNotifications={() => setNotifOpen(true)}
          canCreate={canCreate}
          onCreate={setDialog}
          userName={currentUser}
          role={role}
          avatar={avatar}
          onProfile={() => setDialog("profile")}
        />
        <div className="mx-auto max-w-[1440px] p-4 sm:p-7">
          {loading ? (
            <div className="grid min-h-[50vh] place-items-center text-sm text-muted-ink">
              <span className="flex items-center gap-3">
                <Spinner className="size-5 text-brand-700" /> Chargement des données…
              </span>
            </div>
          ) : loadError ? (
            <ErrorState
              text={loadError}
              onRetry={() => fetchMe().then(loadWorkspace).catch(() => logout())}
            />
          ) : (
            <div key={tab} className="animate-in fade-in duration-300">
              {tab === "dashboard" && (
                <Dashboard
                  stats={stats}
                  items={scopedItems}
                  userName={currentUser}
                  role={role}
                  canCreate={canCreate}
                  open={openCourrier}
                  onCreate={setDialog}
                  onNavigate={navigate}
                  onFilter={showFiltered}
                />
              )}
              {tab === "courriers" && (
                <CourriersPage
                  items={filtered}
                  filters={filters}
                  setFilters={setFilters}
                  open={openCourrier}
                  onExport={() => {
                    exporterCSV(filtered, "registre-courrier");
                    notify("Export CSV généré");
                  }}
                  canCreate={canCreate}
                  onCreate={setDialog}
                  services={nomsServices}
                />
              )}
              {tab === "circuit" && (
                <Circuit
                  items={scopedItems}
                  onAdvance={(id, statut) => updateCourrier(id, { statut })}
                  notify={notify}
                  open={openCourrier}
                />
              )}
              {tab === "registres" && (
                <Registres
                  items={scopedItems}
                  open={openCourrier}
                  notify={notify}
                  exportCSV={(list, nom) => {
                    exporterCSV(list, nom);
                    notify("Export CSV généré");
                  }}
                />
              )}
              {tab === "statistiques" && <Statistiques items={scopedItems} />}
              {tab === "contacts" && (
                <Contacts contacts={contacts} onAdded={(c) => setContacts((v) => [...v, c])} notify={notify} />
              )}
              {tab === "administration" && role === "Administrateur système" && (
                <Administration
                  users={users}
                  items={scopedItems}
                  services={services}
                  onUsersChange={setUsers}
                  onServicesChange={setServices}
                  notify={notify}
                />
              )}
            </div>
          )}
        </div>
        <footer className="mx-auto max-w-[1440px] px-4 pb-6 text-[11px] text-muted-ink sm:px-7">
          © {new Date().getFullYear()} Mairie de Ziguinchor — Plateforme de gestion du courrier
        </footer>
      </section>

      <Dialog open={dialog === "in" || dialog === "out"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[92vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {dialog === "out" ? "Nouveau courrier départ" : "Nouveau courrier arrivée"}
            </DialogTitle>
            <DialogDescription>
              Les champs marqués d’un astérisque sont obligatoires. Le numéro chrono est attribué automatiquement.
            </DialogDescription>
          </DialogHeader>
          <MailForm
            sens={dialog === "out" ? "Départ" : "Arrivée"}
            onSubmit={add}
            users={users}
            services={nomsServicesActifs}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "detail"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[92vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-2xl">
          {selected && (
            <CourrierDetail
              key={selected.id}
              c={selected}
              canEdit={canCreate}
              users={users}
              services={nomsServicesActifs}
              userName={currentUser}
              role={role}
              notify={notify}
              onUpdate={async (patch) => {
                try {
                  const updated = await updateCourrier(selected.id, patch);
                  setSelected(updated);
                  const champs = Object.keys(patch);
                  notify(
                    champs.length === 1 && patch.statut
                      ? `Statut mis à jour : ${patch.statut}`
                      : champs.length === 1 && "notes" in patch
                        ? "Annotation enregistrée"
                        : "Courrier modifié",
                  );
                  return true;
                } catch (err) {
                  notify(err instanceof Error ? err.message : "Impossible d’enregistrer la modification", "error");
                  return false;
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "profile"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[92vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-xl">
          <ProfilePanel
            userName={currentUser}
            role={role}
            account={currentAccount}
            avatar={avatar}
            onAvatarFile={setAvatarFile}
            onAvatarRemove={removeAvatar}
            onLogout={() => {
              setDialog(null);
              setConfirmLogout(true);
            }}
            onDone={() => setDialog(null)}
            notify={notify}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "password"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="max-h-[92vh] grid-cols-[minmax(0,1fr)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Changer mon mot de passe</DialogTitle>
            <DialogDescription>
              Saisissez votre mot de passe actuel, puis choisissez-en un nouveau.
            </DialogDescription>
          </DialogHeader>
          <ChangePasswordForm onDone={() => setDialog(null)} notify={notify} />
        </DialogContent>
      </Dialog>

      <NotificationsPanel
        open={notifOpen}
        onOpenChange={setNotifOpen}
        notifications={visibleNotifications}
        onRead={(n) =>
          markNotificationRead(n.id)
            .then(() => setNotifications((v) => v.map((x) => (x.id === n.id ? { ...x, lue: true } : x))))
            .catch(() => notify("Action impossible", "error"))
        }
        onReadAll={() =>
          markAllNotificationsRead()
            .then(() => {
              setNotifications((v) => v.map((x) => ({ ...x, lue: true })));
              notify("Toutes les notifications sont lues");
            })
            .catch(() => notify("Action impossible", "error"))
        }
        onOpenCourrier={(numero) => {
          const c = scopedItems.find((x) => x.numero === numero);
          if (!c) return notify("Ce courrier n’est pas accessible depuis votre compte", "info");
          setNotifOpen(false);
          openCourrier(c);
        }}
      />

      <ConfirmDialog
        open={confirmLogout}
        onOpenChange={setConfirmLogout}
        title="Se déconnecter ?"
        description="Vous devrez saisir à nouveau vos identifiants pour accéder à la plateforme."
        confirmLabel="Se déconnecter"
        danger
        onConfirm={logout}
      />
    </main>
  );
}
