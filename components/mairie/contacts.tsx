"use client";
import { useState } from "react";
import { Building2, Mail, Phone, Plus, Search, SearchX, Users } from "lucide-react";
import { createContact } from "@/lib/api";
import { categoriesContact, type Contact, type Notify } from "@/lib/mairie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, Empty, Field, PageHead, Pagination, Spinner, usePagination } from "./ui";

export function Contacts({
  contacts,
  onAdded,
  notify,
}: {
  contacts: Contact[];
  onAdded: (c: Contact) => void;
  notify: Notify;
}) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("Toutes");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const list = contacts.filter(
    (c) =>
      (cat === "Toutes" || c.categorie === cat) &&
      `${c.nom} ${c.email} ${c.telephone}`.toLowerCase().includes(q.toLowerCase()),
  );
  const pg = usePagination(list, 12);
  const add = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    setBusy(true);
    try {
      const c = await createContact({
        nom: String(f.get("nom")),
        categorie: String(f.get("categorie")),
        email: String(f.get("email")),
        telephone: String(f.get("telephone")),
      });
      onAdded(c);
      form.reset();
      setAdding(false);
      notify("Contact ajouté au répertoire");
    } catch {
      notify("Impossible d’ajouter le contact", "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <PageHead
        eyebrow="Ressources"
        title="Répertoire administratif"
        desc="Correspondants récurrents : administrations, associations, entreprises, élus et citoyens."
        actions={
          <button onClick={() => setAdding(true)} className="btn-main">
            <Plus size={16} /> Ajouter un contact
          </button>
        }
      />
      <div className="card mb-4 flex flex-col gap-3 p-4 lg:flex-row lg:items-center">
        <label className="field-row flex-1">
          <Search size={16} />
          <input value={q} onChange={(e) => { setQ(e.target.value); pg.setPage(1); }} placeholder="Rechercher par nom, email ou téléphone…" aria-label="Rechercher un contact" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["Toutes", ...categoriesContact].map((c) => (
            <button
              key={c}
              onClick={() => { setCat(c); pg.setPage(1); }}
              aria-pressed={cat === c}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${cat === c ? "border-brand-800 bg-brand-800 text-white" : "border-line bg-white text-muted-ink hover:border-brand-200 hover:text-ink"}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {list.length === 0 ? (
        <div className="card">
          <Empty
            icon={contacts.length ? SearchX : Users}
            title={contacts.length ? "Aucun résultat" : "Répertoire vide"}
            text={contacts.length ? "Aucun contact ne correspond à votre recherche." : "Ajoutez vos premiers correspondants."}
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="-mb-px -mr-px grid sm:grid-cols-2 xl:grid-cols-3">
            {pg.pageItems.map((c) => (
              <li key={c.id} className="flex gap-3.5 border-b border-r border-line p-5">
                <Avatar name={c.nom} size={42} className={c.categorie === "Administration" ? "bg-navy-100 text-navy-700" : ""} />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm text-ink">{c.nom}</b>
                  <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-ink">
                    <Building2 size={12} /> {c.categorie}
                  </span>
                  <div className="mt-2.5 space-y-1 text-xs">
                    {c.email && (
                      <a href={`mailto:${c.email}`} className="flex items-center gap-2 truncate text-brand-700 hover:underline">
                        <Mail size={13} className="shrink-0" /> {c.email}
                      </a>
                    )}
                    {c.telephone && (
                      <a href={`tel:${c.telephone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-ink/80 hover:underline">
                        <Phone size={13} className="shrink-0" /> {c.telephone}
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination {...pg} label="contacts" />
        </div>
      )}
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un contact</DialogTitle>
            <DialogDescription>Le contact sera visible par tous les agents habilités.</DialogDescription>
          </DialogHeader>
          <form onSubmit={add} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nom ou organisme" wide required>
              <input name="nom" placeholder="Ex. Préfecture de Ziguinchor" required />
            </Field>
            <Field label="Catégorie" wide>
              <select name="categorie">
                {categoriesContact.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Adresse email">
              <input name="email" type="email" placeholder="contact@exemple.sn" />
            </Field>
            <Field label="Téléphone">
              <input name="telephone" type="tel" placeholder="33 000 00 00" />
            </Field>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" onClick={() => setAdding(false)} className="btn-ghost">
                Annuler
              </button>
              <button disabled={busy} className="btn-main">
                {busy ? <Spinner className="size-4" /> : <Plus size={16} />} Ajouter
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
