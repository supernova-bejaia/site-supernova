import { Suspense } from "react";
import EnregistrementApplication from "@/components/admin/EnregistrementApplication";
import NavigationEquipe from "@/components/admin/NavigationEquipe";

// Espace équipe : jamais indexé par les moteurs de recherche.
//
// « manifest » et « appleWebApp » : ajouté à l'écran d'accueil d'un
// téléphone, l'espace équipe devient une application « Contacts
// Supernova », qui s'ouvre en plein écran directement sur le carnet
// (public/carnet/manifest.webmanifest). Pas de mode hors ligne.
export const metadata = {
  title: "Espace équipe",
  robots: { index: false, follow: false },
  manifest: "/carnet/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Contacts",
    statusBarStyle: "black",
  },
};

// La barre de navigation lit l'adresse de la page : elle est isolée dans
// <Suspense>, comme le demande Next.js pour les adresses dynamiques.
export default function LayoutAdmin({ children }) {
  return (
    <>
      <Suspense fallback={null}>
        <NavigationEquipe />
      </Suspense>
      {children}
      <EnregistrementApplication />
    </>
  );
}
