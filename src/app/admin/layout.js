import { Suspense } from "react";
import NavigationEquipe from "@/components/admin/NavigationEquipe";

// Espace équipe : jamais indexé par les moteurs de recherche.
export const metadata = {
  title: "Espace équipe",
  robots: { index: false, follow: false },
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
    </>
  );
}
