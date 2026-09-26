import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-surface px-5">
      <div className="max-w-md text-center">
        <span className="mx-auto grid size-16 place-items-center overflow-hidden rounded-2xl bg-white p-1.5 shadow-sm ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-mairie-ziguinchor.jpeg" alt="Blason de la Commune de Ziguinchor" className="h-full w-full object-contain" />
        </span>
        <p className="font-display mt-8 text-7xl font-extrabold text-brand-800">404</p>
        <h1 className="font-display mt-3 flex items-center justify-center gap-2 text-2xl font-bold text-ink">
          <Compass size={22} className="text-gold-500" /> Page introuvable
        </h1>
        <p className="mt-3 text-sm leading-6 text-muted-ink">
          La page que vous recherchez n’existe pas ou a été déplacée. Revenez à
          l’accueil de la plateforme de la Mairie de Ziguinchor.
        </p>
        <Link href="/" className="btn-main mt-8">
          <ArrowLeft size={16} /> Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
