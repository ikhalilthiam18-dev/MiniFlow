import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata={title:"Courrier 360 — Mairie de Ziguinchor",description:"Application de gestion des courriers de la Commune de Ziguinchor.",icons:{icon:"/logo-mairie-ziguinchor.jpeg",shortcut:"/logo-mairie-ziguinchor.jpeg"}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="fr"><body className="antialiased">{children}</body></html>}
