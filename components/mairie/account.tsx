"use client";
import { useState } from "react";
import { Bell, BellOff, CheckCheck, KeyRound, LogOut, Trash2, Upload } from "lucide-react";
import { fmtDateTime, roleCourt, type AppNotification, type AppUser, type Notify, type Role } from "@/lib/mairie";
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, Empty, Segmented } from "./ui";
import { ChangePasswordForm } from "./password";

export function ProfilePanel({
  userName,
  role,
  account,
  avatar,
  onAvatarFile,
  onAvatarRemove,
  onLogout,
  onDone,
  notify,
}: {
  userName: string;
  role: Role;
  account?: AppUser;
  avatar?: string;
  onAvatarFile: (f?: File) => void;
  onAvatarRemove: () => void;
  onLogout: () => void;
  onDone: () => void;
  notify: Notify;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Mon profil</DialogTitle>
        <DialogDescription>Informations du compte et paramètres de sécurité.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-line bg-brand-50/50 p-5 text-center sm:flex-row sm:text-left">
        <Avatar name={userName} src={avatar} size={76} className="text-2xl ring-4 ring-white" />
        <div className="min-w-0 flex-1">
          <b className="font-display block text-lg text-ink">{userName}</b>
          <span className="text-sm text-muted-ink">{roleCourt[role]}</span>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <label className="btn-light btn-sm cursor-pointer">
              <Upload size={14} /> Changer la photo
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  onAvatarFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
            {avatar && (
              <button type="button" onClick={onAvatarRemove} className="btn-ghost btn-sm">
                <Trash2 size={14} /> Retirer
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-muted-ink">JPG, PNG ou WebP • 2 Mo maximum</p>
        </div>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        {[
          ["Fonction", role],
          ["Service municipal", account?.service ?? "—"],
          ["Adresse professionnelle", account?.email ?? "—"],
          ["État du compte", account?.actif === false ? "Désactivé" : "Actif"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl bg-surface px-4 py-3">
            <dt className="text-[11px] text-muted-ink">{l}</dt>
            <dd className="truncate font-semibold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <section className="space-y-3 border-t border-line pt-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-ink">
          <KeyRound size={15} className="text-brand-700" /> Changer mon mot de passe
        </h3>
        <ChangePasswordForm
          onDone={onDone}
          notify={notify}
          footer={
            <button type="button" onClick={onLogout} className="btn-danger">
              <LogOut size={15} /> Se déconnecter
            </button>
          }
        />
      </section>
    </>
  );
}

export function NotificationsPanel({
  open,
  onOpenChange,
  notifications,
  onRead,
  onReadAll,
  onOpenCourrier,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  notifications: AppNotification[];
  onRead: (n: AppNotification) => void;
  onReadAll: () => void;
  onOpenCourrier: (numero: string) => void;
}) {
  const [vue, setVue] = useState<"Toutes" | "Non lues">("Toutes");
  const unread = notifications.filter((n) => !n.lue).length;
  const list = vue === "Toutes" ? notifications : notifications.filter((n) => !n.lue);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-line p-5">
          <SheetTitle className="font-display flex items-center gap-2 text-lg">
            <Bell size={18} className="text-brand-700" /> Notifications
          </SheetTitle>
          <SheetDescription>
            {unread ? `${unread} notification${unread > 1 ? "s" : ""} non lue${unread > 1 ? "s" : ""}` : "Vous êtes à jour."}
          </SheetDescription>
          <div className="mt-3 flex items-center justify-between gap-2">
            <Segmented label="Filtrer les notifications" value={vue} options={["Toutes", "Non lues"] as const} onChange={setVue} />
            {unread > 0 && (
              <button onClick={onReadAll} className="btn-ghost btn-sm">
                <CheckCheck size={14} /> Tout marquer lu
              </button>
            )}
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          {list.length === 0 ? (
            <Empty icon={BellOff} title="Aucune notification" text={vue === "Non lues" ? "Toutes vos notifications ont été lues." : "Les affectations de courriers apparaîtront ici."} />
          ) : (
            <ul className="space-y-2">
              {list.map((n) => (
                <li key={n.id}>
                  <div className={`rounded-2xl border p-4 transition ${n.lue ? "border-line bg-white" : "border-brand-200 bg-brand-50"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex items-center gap-2">
                        {!n.lue && <span className="size-2 rounded-full bg-brand-600" aria-label="Non lue" />}
                        <b className="text-sm text-ink">{n.destinataire}</b>
                      </span>
                      <time className="shrink-0 text-[11px] text-muted-ink">{fmtDateTime(n.date)}</time>
                    </div>
                    <p className="mt-1.5 text-sm leading-6 text-ink/80">{n.message}</p>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      {n.courrier ? (
                        <button onClick={() => onOpenCourrier(n.courrier)} className="text-xs font-bold text-brand-700 hover:underline">
                          {n.courrier} →
                        </button>
                      ) : (
                        <span />
                      )}
                      {!n.lue && (
                        <button onClick={() => onRead(n)} className="btn-ghost btn-sm">
                          Marquer comme lue
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
