import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mairie de Ziguinchor — Gestion du courrier",
  description:
    "Plateforme numérique de gestion et de suivi du courrier administratif de la Mairie de Ziguinchor.",
  icons: { icon: "/logo-mairie-ziguinchor.jpeg", shortcut: "/logo-mairie-ziguinchor.jpeg" },
};

export const viewport: Viewport = { themeColor: "#0a3a26" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="antialiased">{children}</body>
    </html>
  );
}
