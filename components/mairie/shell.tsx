"use client";
import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronDown,
  FileInput,
  FileOutput,
  GitBranch,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Plus,
  Search,
  Settings,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { roleCourt, type Role } from "@/lib/mairie";
import { Avatar, Logo } from "./ui";

export type Tab =
  | "dashboard"
  | "courriers"
  | "circuit"
  | "registres"
  | "statistiques"
  | "contacts"
  | "administration";

type NavItem = { id: Tab; label: string; icon: LucideIcon; adminOnly?: boolean };

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { id: "dashboard", label: "Tableau de bord", icon: LayoutDashboard },
      { id: "statistiques", label: "Statistiques", icon: BarChart3 },
    ],
  },
  {
    title: "Courrier",
    items: [
      { id: "courriers", label: "Courriers", icon: Mail },
      { id: "circuit", label: "Circuit & délais", icon: GitBranch },
      { id: "registres", label: "Registres officiels", icon: BookOpen },
    ],
  },
  {
    title: "Ressources",
    items: [{ id: "contacts", label: "Répertoire", icon: Users }],
  },
  {
    title: "Système",
    items: [
      { id: "administration", label: "Administration", icon: Settings, adminOnly: true },
    ],
  },
];

export const tabTitles: Record<Tab, string> = {
  dashboard: "Tableau de bord",
  courriers: "Courriers",
  circuit: "Circuit & délais",
  registres: "Registres officiels",
  statistiques: "Statistiques",
  contacts: "Répertoire",
  administration: "Administration",
};

export function Sidebar({
  tab,
  onNavigate,
  open,
  onClose,
  role,
  userName,
  avatar,
  badges,
  onLogout,
  onPassword,
}: {
  tab: Tab;
  onNavigate: (t: Tab) => void;
  open: boolean;
  onClose: () => void;
  role: Role;
  userName: string;
  avatar?: string;
  badges: Partial<Record<Tab, number>>;
  onLogout: () => void;
  onPassword: () => void;
}) {
  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[264px] flex-col bg-brand-900 text-white transition-transform duration-300 lg:translate-x-0 ${open ? "translate-x-0 shadow-2xl" : "-translate-x-full"}`}
      >
        <div className="flex h-[72px] items-center justify-between gap-2 border-b border-white/10 px-4">
          <Logo light compact subtitle="Gestion du courrier" />

        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5 scrollbar-thin" aria-label="Navigation principale">
          {navGroups.map((g) => {
            const items = g.items.filter(
              (i) => !i.adminOnly || role === "Administrateur système",
            );
            if (!items.length) return null;
            return (
              <div key={g.title}>
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">
                  {g.title}
                </p>
                {items.map(({ id, label, icon: Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      onClick={() => onNavigate(id)}
                      aria-current={active ? "page" : undefined}
                      className={`relative mb-0.5 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-white/10 font-semibold text-white" : "text-white/65 hover:bg-white/5 hover:text-white"}`}
                    >
                      {active && (
                        <span className="absolute inset-y-2 left-0 w-1 rounded-r-full bg-gold-400" />
                      )}
                      <Icon size={18} className={active ? "text-gold-400" : ""} />
                      <span className="flex-1 text-left">{label}</span>
                      {!!badges[id] && (
                        <span className="rounded-full bg-[#e5484d] px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                          {badges[id]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>
        {open && (
          <button
            onClick={onClose}
            aria-label="Fermer le menu"
            className="absolute -right-12 top-4 grid size-9 place-items-center rounded-full bg-white text-brand-900 shadow-lg lg:hidden"
          >
            <X size={18} />
          </button>
        )}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-2.5">
            <Avatar name={userName} src={avatar} size={36} className="bg-gold-400 text-brand-950" />
            <div className="min-w-0 flex-1">
              <b className="block truncate text-[13px]">{userName}</b>
              <small className="block truncate text-[11px] text-white/55">{roleCourt[role]}</small>
            </div>
            <button
              onClick={onPassword}
              title="Changer mon mot de passe"
              aria-label="Changer mon mot de passe"
              className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <KeyRound size={17} />
            </button>
            <button
              onClick={onLogout}
              title="Se déconnecter"
              aria-label="Se déconnecter"
              className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      {open && (
        <button
          aria-label="Fermer le menu"
          className="animate-in fade-in fixed inset-0 z-40 bg-brand-950/40 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
        />
      )}
    </>
  );
}

export function Topbar({
  tab,
  onMenu,
  onSearch,
  unread,
  onNotifications,
  canCreate,
  onCreate,
  userName,
  role,
  avatar,
  onProfile,
}: {
  tab: Tab;
  onMenu: () => void;
  onSearch: (q: string) => void;
  unread: number;
  onNotifications: () => void;
  canCreate: boolean;
  onCreate: (sens: "in" | "out") => void;
  userName: string;
  role: Role;
  avatar?: string;
  onProfile: () => void;
}) {
  const [q, setQ] = useState("");
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [menu]);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur-xl">
      <div className="flex h-[72px] items-center gap-3 px-4 sm:px-7">
        <button className="icon-btn lg:hidden" onClick={onMenu} aria-label="Ouvrir le menu">
          <Menu size={18} />
        </button>
        <div className="min-w-0 flex-1 md:flex-none">
          <p className="truncate text-[11px] text-muted-ink">
            Commune de Ziguinchor <span className="mx-1 text-[#b5c2bc]">/</span>
            <span className="text-ink/70">{tabTitles[tab]}</span>
          </p>
          <h1 className="font-display truncate text-[17px] font-bold text-ink">{tabTitles[tab]}</h1>
        </div>
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSearch(q);
          }}
          className="field-row mx-auto hidden w-full max-w-md py-2 md:flex"
        >
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un courrier (n°, objet, correspondant)…"
            aria-label="Rechercher un courrier"
          />
        </form>
        <div className="flex items-center gap-2">
          <button
            onClick={onNotifications}
            aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}
            className="icon-btn relative"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-[#e5484d] px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-white">
                {unread}
              </span>
            )}
          </button>
          {canCreate && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenu((v) => !v)}
                aria-expanded={menu}
                aria-haspopup="menu"
                className="btn-main px-3 sm:px-4"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Nouveau courrier</span>
                <ChevronDown size={14} className="hidden sm:block" />
              </button>
              {menu && (
                <div
                  role="menu"
                  className="animate-in fade-in slide-in-from-top-1 absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-line bg-white p-1.5 shadow-xl"
                >
                  {(
                    [
                      ["in", "Courrier arrivée", "Pli reçu par la mairie", FileInput],
                      ["out", "Courrier départ", "Courrier émis par la mairie", FileOutput],
                    ] as const
                  ).map(([k, l, d, Icon]) => (
                    <button
                      key={k}
                      role="menuitem"
                      onClick={() => {
                        setMenu(false);
                        onCreate(k);
                      }}
                      className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left hover:bg-brand-50"
                    >
                      <span className="grid size-9 place-items-center rounded-lg bg-brand-100 text-brand-700">
                        <Icon size={17} />
                      </span>
                      <span>
                        <b className="block text-[13px] text-ink">{l}</b>
                        <small className="text-[11px] text-muted-ink">{d}</small>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={onProfile}
            aria-label="Mon profil"
            className="hidden items-center gap-2.5 rounded-xl border border-line bg-white py-1.5 pl-1.5 pr-3 text-left transition hover:border-brand-200 xl:flex"
          >
            <Avatar name={userName} src={avatar} size={32} />
            <span className="min-w-0 max-w-[170px]">
              <b className="block truncate text-xs text-ink">{userName}</b>
              <span className="block truncate text-[10.5px] text-muted-ink">{roleCourt[role]}</span>
            </span>
          </button>
          <button onClick={onProfile} aria-label="Mon profil" className="xl:hidden">
            <Avatar name={userName} src={avatar} size={38} />
          </button>
        </div>
      </div>
    </header>
  );
}
